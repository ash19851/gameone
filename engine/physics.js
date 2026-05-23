import {
  GRAVITY, TERMINAL_VELOCITY, BUCKET_SIZE,
  STABILITY_MARGIN, INSTABILITY_THRESHOLD, TILT_SPEED, COLLAPSE_ANGLE,
  UPGRADE_STABILITY_BONUS,
} from './lib/config';
import { getUpgradeLevel } from './data/storage';

export default class Physics {
  constructor() {
    this.heightMap = null;
    this.numBuckets = 0;
    this.xOffset = 0;
    this.initHeightMap();
  }

  initHeightMap() {
    // Extend height map beyond screen edges so blocks pushed off-screen
    // still contribute to the surface and support blocks above them
    this.xOffset = 140;
    this.numBuckets = Math.ceil((canvas.width + this.xOffset * 2) / BUCKET_SIZE) + 1;
    this.heightMap = new Float32Array(this.numBuckets);
  }

  reset(car) {
    const bottomY = canvas.height + 200;
    this.heightMap.fill(bottomY);
    this.setCarSurface(car);
  }

  setCarSurface(car) {
    const carTop = car.y - car.height / 2;
    const { clampedLeft, clampedRight } = this.getBucketRange(car.x, car.width);
    for (let i = clampedLeft; i <= clampedRight; i++) {
      this.heightMap[i] = carTop;
    }
  }

  rebuildHeightMap(car, settledBlocks) {
    const bottomY = canvas.height + 200;
    this.heightMap.fill(bottomY);
    this.setCarSurface(car);
    for (let i = 0; i < settledBlocks.length; i++) {
      this.updateHeightMap(settledBlocks[i].x, settledBlocks[i].width, settledBlocks[i].top);
    }
  }

  // World x → bucket index (with margin offset)
  worldToBucket(x) {
    return Math.floor((x + this.xOffset) / BUCKET_SIZE);
  }

  getBucketRange(centerX, width) {
    const left = this.worldToBucket(centerX - width / 2);
    const right = this.worldToBucket(centerX + width / 2);
    const clampedLeft = Math.max(0, left);
    const clampedRight = Math.min(this.numBuckets - 1, right);
    return { left, right, clampedLeft, clampedRight, totalBuckets: right - left + 1 };
  }

  getFloorY(centerX, width) {
    const { clampedLeft, clampedRight } = this.getBucketRange(centerX, width);
    let minY = canvas.height + 200;
    for (let i = clampedLeft; i <= clampedRight; i++) {
      if (this.heightMap[i] < minY) minY = this.heightMap[i];
    }
    return minY;
  }

  updateHeightMap(centerX, width, topY) {
    const { left, right } = this.getBucketRange(centerX, width);
    for (let i = left; i <= right; i++) {
      if (i >= 0 && i < this.numBuckets && topY < this.heightMap[i]) {
        this.heightMap[i] = topY;
      }
    }
  }

  applyGravity(blocks, dt) {
    for (const block of blocks) {
      if (block.settled) continue;
      block.vy += GRAVITY * dt;
      if (block.vy > TERMINAL_VELOCITY) block.vy = TERMINAL_VELOCITY;
      block.y += block.vy * dt;
    }
  }

  getSupportRatio(centerX, width, floorY) {
    const { clampedLeft, clampedRight, totalBuckets } = this.getBucketRange(centerX, width);
    if (totalBuckets <= 0) return 0;
    const tolerance = 8;
    let supported = 0;
    for (let i = clampedLeft; i <= clampedRight; i++) {
      if (Math.abs(this.heightMap[i] - floorY) <= tolerance) supported++;
    }
    // Off-screen buckets count as unsupported → lower ratio for blocks at screen edge
    return supported / totalBuckets;
  }

  getSupportCenterBias(centerX, width, floorY) {
    const halfW = width / 2;
    const leftRatio = this.getSupportRatio(centerX - halfW / 2, halfW, floorY);
    const rightRatio = this.getSupportRatio(centerX + halfW / 2, halfW, floorY);
    return rightRatio - leftRatio;
  }

  checkCollisions(fallingBlocks, settledBlocks, car, dt) {
    const newlySettled = [];
    const remaining = [];

    for (const block of fallingBlocks) {
      // Integrate gravity step so blocks never pass through surfaces
      const nextVy = block.vy + GRAVITY * dt;
      const clampedVy = nextVy > TERMINAL_VELOCITY ? TERMINAL_VELOCITY : nextVy;
      const nextY = block.y + clampedVy * dt;
      const nextBottom = nextY + block.height / 2;

      const floorY = this.getFloorY(block.x, block.width);

      if (nextBottom >= floorY) {
        const supportRatio = this.getSupportRatio(block.x, block.width, floorY);

        if (supportRatio < 0.45) {
          const bias = this.getSupportCenterBias(block.x, block.width, floorY);
          const dir = bias > 0 ? -1 : 1;
          block.vx += dir * (120 + Math.random() * 80);
          block.vy = -60 - Math.random() * 40;
          block.y = nextY;
          remaining.push(block);
        } else {
          block.y = floorY - block.height / 2;
          block.vy = 0;
          block.vx = 0;
          block.settled = true;
          this.updateHeightMap(block.x, block.width, block.top);
          settledBlocks.push(block);
          newlySettled.push(block);
        }
      } else {
        block.vy = clampedVy;
        block.y = nextY;
        remaining.push(block);
      }
    }

    return { remaining, newlySettled };
  }

  // After merges, check if any settled blocks lost support from below
  findUnsupported(settledBlocks, car) {
    // Sort bottom-to-top so cascade works: if a lower block is unsupported,
    // blocks above it will also see the gap
    const sorted = [...settledBlocks].sort((a, b) => b.y - a.y);

    const bottomY = canvas.height + 200;
    this.heightMap.fill(bottomY);
    this.setCarSurface(car);

    const unsupported = [];

    for (const block of sorted) {
      if (block.wasMerged) {
        this.updateHeightMap(block.x, block.width, block.top);
        continue;
      }

      const floorY = this.getFloorY(block.x, block.width);

      if (floorY > block.bottom + 6) {
        // Gap below block — it lost its support
        unsupported.push(block);
        // Don't add to height map so blocks above also see the gap
      } else {
        this.updateHeightMap(block.x, block.width, block.top);
      }
    }

    return unsupported;
  }

  computeCOM(blocks) {
    if (blocks.length === 0) return { x: 0, totalMass: 0 };
    let totalMass = 0;
    let comX = 0;
    for (const block of blocks) {
      const mass = block.width;
      totalMass += mass;
      comX += block.x * mass;
    }
    return { x: comX / totalMass, totalMass };
  }

  checkStability(blocks, car, dt) {
    const databus = GameGlobal.databus;
    if (blocks.length === 0) {
      databus.instabilityTimer = 0;
      databus.tiltAngle = 0;
      return false;
    }

    const { x: comX } = this.computeCOM(blocks);
    databus.comX = comX;

    const stabilityBonus = getUpgradeLevel('stability') * UPGRADE_STABILITY_BONUS;
    const halfBase = (car.width * (STABILITY_MARGIN + stabilityBonus)) / 2;
    const baseLeft = car.x - halfBase;
    const baseRight = car.x + halfBase;

    if (comX < baseLeft || comX > baseRight) {
      databus.instabilityTimer += dt;
    } else {
      databus.instabilityTimer = Math.max(0, databus.instabilityTimer - dt * 2);
    }

    if (databus.instabilityTimer > INSTABILITY_THRESHOLD) {
      const direction = comX > car.x ? 1 : -1;
      databus.tiltAngle += TILT_SPEED * dt * direction;
      databus.tiltAngle = Math.max(-COLLAPSE_ANGLE, Math.min(COLLAPSE_ANGLE, databus.tiltAngle));

      if (Math.abs(databus.tiltAngle) >= COLLAPSE_ANGLE) {
        return true;
      }
    } else {
      databus.tiltAngle *= 0.9;
    }

    return false;
  }

  triggerCollapse(blocks, particles, tiltAngle) {
    // Blocks fly toward the leaning side, not randomly
    const dir = tiltAngle > 0 ? 1 : -1;
    for (const block of blocks) {
      block.settled = false;
      block.vy = -100 - Math.random() * 250;
      // Higher blocks get flung farther (they have more potential energy)
      const heightFactor = 1 + (canvas.height - block.y) / canvas.height;
      block.vx = dir * (80 + Math.random() * 280) * heightFactor;
    }
    if (particles && blocks.length > 0) {
      const last = blocks[blocks.length - 1];
      particles.emit(last.x, last.y, '#FF6B6B', 30);
      if (blocks.length > 5) {
        const mid = blocks[Math.floor(blocks.length / 2)];
        particles.emit(mid.x, mid.y, '#FF4444', 20);
      }
      if (blocks.length > 3) {
        const bottom = blocks[0];
        particles.emit(bottom.x, bottom.y, '#FFA500', 15);
      }
    }
  }
}
