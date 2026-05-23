import {
  BLOCK_MIN_WIDTH, BLOCK_MAX_WIDTH, SPAWN_MARGIN,
  LEVELS,
  INFINITE_COLORS_START, INFINITE_COLORS_MAX, INFINITE_LAYERS_PER_COLOR,
  INFINITE_INTERVAL_START, INFINITE_INTERVAL_MIN, INFINITE_INTERVAL_DECREASE,
  UPGRADE_SLOW_START_BONUS, SPECIAL_SPAWN_RATE,
} from './lib/config';
import { getUpgradeLevel } from './data/storage';
import Block from './lib/block';

export default class Spawner {
  constructor() {
    this.timer = 0;
  }

  reset() {
    this.timer = 1.0; // short delay before first block
  }

  getBaseColors(db) {
    if (db.gameMode === 'infinite') {
      const extraColors = Math.floor(db.layersBuilt / INFINITE_LAYERS_PER_COLOR);
      return Math.min(INFINITE_COLORS_MAX, INFINITE_COLORS_START + extraColors);
    }
    // Levels mode: find current level's colors
    let remaining = db.layersBuilt;
    for (const cfg of LEVELS) {
      if (remaining < cfg.layers || cfg.layers === Infinity) return cfg.colors;
      remaining -= cfg.layers;
    }
    return LEVELS[LEVELS.length - 1].colors;
  }

  getInterval(db) {
    if (db.gameMode === 'infinite') {
      return Math.max(
        INFINITE_INTERVAL_MIN,
        INFINITE_INTERVAL_START - db.layersBuilt * INFINITE_INTERVAL_DECREASE
      );
    }
    let remaining = db.layersBuilt;
    for (const cfg of LEVELS) {
      if (remaining < cfg.layers || cfg.layers === Infinity) {
        const progress = Math.min(1, remaining / Math.max(1, cfg.layers - 1));
        return cfg.intervalStart + (cfg.intervalEnd - cfg.intervalStart) * progress;
      }
      remaining -= cfg.layers;
    }
    return LEVELS[LEVELS.length - 1].intervalEnd;
  }

  getBlockWidth() {
    return BLOCK_MIN_WIDTH + Math.random() * (BLOCK_MAX_WIDTH - BLOCK_MIN_WIDTH);
  }

  update(dt, db) {
    this.timer -= dt;
    if (this.timer > 0) {
      return null;
    }

    const baseInterval = this.getInterval(db);
    const slowBonus = getUpgradeLevel('slowStart') * UPGRADE_SLOW_START_BONUS;
    this.timer = (baseInterval + slowBonus) * (0.7 + Math.random() * 0.6);

    const baseColors = this.getBaseColors(db);
    const colorReduce = getUpgradeLevel('colorReduce');
    const colors = Math.max(2, baseColors - colorReduce);

    // Same-color rain skill
    let type;
    if (db.sameColorActive) {
      type = db.sameColorType;
    } else {
      type = Math.floor(Math.random() * colors);
      // Special block spawn (not during same-color rain)
      const roll = Math.random();
      if (roll < SPECIAL_SPAWN_RATE) type = 6;        // universal
      else if (roll < SPECIAL_SPAWN_RATE * 2) type = 7; // magnet
      else if (roll < SPECIAL_SPAWN_RATE * 3) type = 8; // bomb
    }

    const width = this.getBlockWidth();
    let minX = SPAWN_MARGIN + width / 2;
    let maxX = canvas.width - SPAWN_MARGIN - width / 2;

    // Magnet skill: pull x toward car center
    if (db.magnetRemaining > 0 && db.carRef) {
      const carX = db.carRef.x;
      const pull = (carX - (minX + maxX) / 2) * 0.5;
      const midX = (minX + maxX) / 2 + pull;
      db.magnetRemaining--;
      return new Block(type, midX, -20, width);
    }

    const x = minX + Math.random() * (maxX - minX);
    return new Block(type, x, -20, width);
  }

}
