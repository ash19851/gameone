// physics.test.js — TDD tests for engine/physics.js
// Run with: node tests/physics.test.js

const GRAVITY = 900;
const TERMINAL_VELOCITY = 650;
const BUCKET_SIZE = 8;
const STABILITY_MARGIN = 1.4;
const INSTABILITY_THRESHOLD = 1.8;
const TILT_SPEED = 25;
const COLLAPSE_ANGLE = 40;
const UPGRADE_STABILITY_BONUS = 0.2;

// ---------- Pure Functions (from physics.js) ----------

function worldToBucket(x, xOffset) {
  return Math.floor((x + xOffset) / BUCKET_SIZE);
}

function getBucketRange(centerX, width, xOffset, numBuckets) {
  const left = worldToBucket(centerX - width / 2, xOffset);
  const right = worldToBucket(centerX + width / 2, xOffset);
  const clampedLeft = Math.max(0, left);
  const clampedRight = Math.min(numBuckets - 1, right);
  return { left, right, clampedLeft, clampedRight, totalBuckets: right - left + 1 };
}

function getFloorY(heightMap, centerX, width, xOffset) {
  const numBuckets = heightMap.length;
  const { clampedLeft, clampedRight } = getBucketRange(centerX, width, xOffset, numBuckets);
  let minY = Infinity;
  for (let i = clampedLeft; i <= clampedRight; i++) {
    if (heightMap[i] < minY) minY = heightMap[i];
  }
  return minY;
}

function applyGravity(blocks, dt) {
  for (const block of blocks) {
    if (block.settled) continue;
    block.vy += GRAVITY * dt;
    if (block.vy > TERMINAL_VELOCITY) block.vy = TERMINAL_VELOCITY;
    block.y += block.vy * dt;
  }
}

function computeCOM(blocks) {
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

function checkStability(blocks, car, dt, instabilityTimer, tiltAngle) {
  if (blocks.length === 0) return { collapsed: false, instabilityTimer: 0, tiltAngle: 0 };

  const { x: comX } = computeCOM(blocks);
  const stabilityBonus = 0; // no upgrades in ladder mode
  const halfBase = (car.width * (STABILITY_MARGIN + stabilityBonus)) / 2;
  const baseLeft = car.x - halfBase;
  const baseRight = car.x + halfBase;

  if (comX < baseLeft || comX > baseRight) {
    instabilityTimer += dt;
  } else {
    instabilityTimer = Math.max(0, instabilityTimer - dt * 2);
  }

  if (instabilityTimer > INSTABILITY_THRESHOLD) {
    const direction = comX > car.x ? 1 : -1;
    tiltAngle += TILT_SPEED * dt * direction;
    tiltAngle = Math.max(-COLLAPSE_ANGLE, Math.min(COLLAPSE_ANGLE, tiltAngle));

    if (Math.abs(tiltAngle) >= COLLAPSE_ANGLE) {
      return { collapsed: true, instabilityTimer, tiltAngle };
    }
  } else {
    tiltAngle *= 0.9;
  }

  return { collapsed: false, instabilityTimer, tiltAngle };
}

// ---------- Test Runner ----------

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

function assertEquals(actual, expected, msg) {
  if (Math.abs(actual - expected) < 0.001) { passed++; }
  else { console.error(`  FAIL: ${msg} — expected ${expected}, got ${actual}`); failed++; }
}

// ============ TESTS ============

console.log("\n=== applyGravity ===");

{
  const block = { settled: false, vy: 0, y: 100 };
  applyGravity([block], 0.016);
  assert(block.vy > 0, "Gravity increases downward velocity");
  assert(block.y > 100, "Block moves downward (screen y increases)"); // FIXED: down = +y
  assert(block.vy <= TERMINAL_VELOCITY, "Velocity clamped to terminal velocity");
}
{
  const block = { settled: false, vy: 700, y: 100 };
  applyGravity([block], 0.016);
  assertEquals(block.vy, TERMINAL_VELOCITY, "Velocity capped at terminal");
}
{
  const block = { settled: true, vy: 0, y: 100 };
  applyGravity([block], 0.016);
  assertEquals(block.vy, 0, "Settled block not affected by gravity");
  assertEquals(block.y, 100, "Settled block does not move");
}

console.log("\n=== computeCOM ===");

{
  const com = computeCOM([]);
  assertEquals(com.x, 0, "Empty COM is 0");
}
{
  const blocks = [{ x: 100, width: 50 }];
  const com = computeCOM(blocks);
  assertEquals(com.x, 100, "Single block COM = its x");
}
{
  const blocks = [{ x: 0, width: 10 }, { x: 100, width: 10 }];
  const com = computeCOM(blocks);
  assertEquals(com.x, 50, "Two equal-mass blocks: COM at midpoint");
}
{
  const blocks = [{ x: 0, width: 20 }, { x: 100, width: 10 }];
  const com = computeCOM(blocks);
  // (0*20 + 100*10) / 30 = 1000/30 = 33.33
  assertEquals(com.x, 33.333, "Unequal masses: weighted COM");
}

console.log("\n=== worldToBucket ===");

{
  const idx = worldToBucket(100, 140);
  assertEquals(idx, 30, "worldToBucket with offset");
}
{
  const idx = worldToBucket(-50, 140);
  assertEquals(idx, 11, "Negative world coordinate");
}

console.log("\n=== getBucketRange ===");

{
  const range = getBucketRange(200, 80, 140, 100);
  assert(range.clampedLeft >= 0, "Clamped left >= 0");
  assert(range.clampedRight < 100, "Clamped right < numBuckets");
  assert(range.totalBuckets > 0, "Width produces positive bucket count");
}

console.log("\n=== getFloorY ===");

{
  // Place low surface in the middle of screen, block directly above it
  const hm = new Float32Array(50).fill(500);
  hm[25] = 100; // bucket 25 has floor at y=100
  hm[26] = 100;
  // Block centered at x=200, width=60, with xOffset=140
  // left bucket = floor((200-30+140)/8) = floor(310/8) = 38... that's too far
  // Let me recalculate. x=0 at left of screen.
  // With xOffset=140, screen-left maps to bucket 140/8=17.5 -> 17
  // A block at x=70, width=60: left = floor((70-30+140)/8)=floor(180/8)=22, right=floor((70+30+140)/8)=floor(240/8)=30
  // So buckets 22-30. hm[25] is in range. Floor should be 100.
  const floor = getFloorY(hm, 70, 60, 140);
  assertEquals(floor, 100, "Floor reads lowest height in range"); // FIXED
}

console.log("\n=== checkStability ===");

{
  // No blocks = stable
  const result = checkStability([], { x: 200, width: 76 }, 0.016, 0, 0);
  assert(!result.collapsed, "No blocks: stable");
  assertEquals(result.tiltAngle, 0, "No blocks: zero tilt");
}

{
  // Centered blocks = stable
  const blocks = [
    { x: 200, width: 40 },
    { x: 195, width: 50 },
  ];
  const result = checkStability(blocks, { x: 200, width: 76 }, 0.016, 0, 0);
  assert(!result.collapsed, "Centered blocks: stable");
  assertEquals(result.instabilityTimer, 0, "Centered: no instability accumulation");
}

{
  // Off-center blocks = instability grows
  const blocks = [
    { x: 280, width: 40 },
    { x: 285, width: 50 },
  ];
  const result = checkStability(blocks, { x: 200, width: 76 }, 0.016, 0, 0);
  assert(result.instabilityTimer > 0, "Off-center: instability timer grows");
}

{
  // Sustained instability + near-collapse tilt = collapse in one step
  const blocks = [
    { x: 300, width: 40 },
  ];
  // instabilityTimer=2.0 (>1.8), tiltAngle=39.5 — one dt step reaches 40
  const result = checkStability(blocks, { x: 200, width: 76 }, 0.1, 2.0, 39.5);
  assert(result.collapsed, "Sustained off-center: collapses"); // FIXED
}

{
  // Tilt recovers when recentered
  const blocks = [
    { x: 200, width: 40 },
  ];
  const result = checkStability(blocks, { x: 200, width: 76 }, 0.1, 1.0, 10);
  assert(!result.collapsed, "Recenter: no collapse");
  assert(result.tiltAngle < 10, "Recenter: tilt decays");
}

// ============ SUMMARY ============
console.log(`\n==========`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
console.log(`==========\n`);
process.exit(failed > 0 ? 1 : 0);
