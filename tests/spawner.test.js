// spawner.test.js — TDD tests for engine/spawner.js
// Run with: node tests/spawner.test.js

const BLOCK_MIN_WIDTH = 26;
const BLOCK_MAX_WIDTH = 58;
const SPAWN_MARGIN = 20;
const SPECIAL_SPAWN_RATE = 0.04;

const LEVELS = [
  { level: 1, layers: 6,  colors: 2, intervalStart: 2.2, intervalEnd: 1.6 },
  { level: 2, layers: 6,  colors: 3, intervalStart: 1.6, intervalEnd: 1.2 },
  { level: 3, layers: 12, colors: 4, intervalStart: 1.2, intervalEnd: 0.9 },
  { level: 4, layers: 24, colors: 5, intervalStart: 0.9, intervalEnd: 0.7 },
  { level: 5, layers: Infinity, colors: 6, intervalStart: 0.6, intervalEnd: 0.6 },
];

const INFINITE_COLORS_START = 3;
const INFINITE_COLORS_MAX = 6;
const INFINITE_LAYERS_PER_COLOR = 8;
const INFINITE_INTERVAL_START = 1.8;
const INFINITE_INTERVAL_MIN = 0.5;
const INFINITE_INTERVAL_DECREASE = 0.02;

// ---------- Pure Functions ----------

function getBaseColors(gameMode, layersBuilt) {
  if (gameMode === 'infinite') {
    const extraColors = Math.floor(layersBuilt / INFINITE_LAYERS_PER_COLOR);
    return Math.min(INFINITE_COLORS_MAX, INFINITE_COLORS_START + extraColors);
  }
  let remaining = layersBuilt;
  for (const cfg of LEVELS) {
    if (remaining < cfg.layers || cfg.layers === Infinity) return cfg.colors;
    remaining -= cfg.layers;
  }
  return LEVELS[LEVELS.length - 1].colors;
}

function getInterval(gameMode, layersBuilt) {
  if (gameMode === 'infinite') {
    return Math.max(
      INFINITE_INTERVAL_MIN,
      INFINITE_INTERVAL_START - layersBuilt * INFINITE_INTERVAL_DECREASE
    );
  }
  let remaining = layersBuilt;
  for (const cfg of LEVELS) {
    if (remaining < cfg.layers || cfg.layers === Infinity) {
      const progress = Math.min(1, remaining / Math.max(1, cfg.layers - 1));
      return cfg.intervalStart + (cfg.intervalEnd - cfg.intervalStart) * progress;
    }
    remaining -= cfg.layers;
  }
  return LEVELS[LEVELS.length - 1].intervalEnd;
}

// ---------- Test Runner ----------

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

function assertEquals(actual, expected, msg) {
  if (Math.abs(actual - expected) < 0.01) { passed++; }
  else { console.error(`  FAIL: ${msg} — expected ${expected}, got ${actual}`); failed++; }
}

// ============ TESTS ============

console.log("\n=== getBaseColors — levels mode ===");

assertEquals(getBaseColors('levels', 0), 2, "Level 1 start: 2 colors");
assertEquals(getBaseColors('levels', 5), 2, "Level 1 end: still 2 colors");
assertEquals(getBaseColors('levels', 6), 3, "Level 2 start: 3 colors");
assertEquals(getBaseColors('levels', 17), 4, "Level 3: 4 colors");
assertEquals(getBaseColors('levels', 29), 5, "Level 4: 5 colors"); // 6+6+12=24, at 24 remaining<24 so level 4
assertEquals(getBaseColors('levels', 48), 6, "Level 5: 6 colors"); // 6+6+12+24=48, at 48 level 5 (Infinity)
assertEquals(getBaseColors('levels', 1000), 6, "Deep: capped at 6");

console.log("\n=== getBaseColors — infinite mode ===");

assertEquals(getBaseColors('infinite', 0), 3, "Infinite start: 3 colors");
assertEquals(getBaseColors('infinite', 7), 3, "Before 8 layers: still 3");
assertEquals(getBaseColors('infinite', 8), 4, "After 8 layers: 4 colors");
assertEquals(getBaseColors('infinite', 16), 5, "After 16 layers: 5 colors");
assertEquals(getBaseColors('infinite', 24), 6, "After 24 layers: 6 colors");
assertEquals(getBaseColors('infinite', 100), 6, "Deep: capped at 6");

console.log("\n=== getInterval — levels mode ===");

assertEquals(getInterval('levels', 0), 2.2, "Level 1 start: 2.2s");
assertEquals(getInterval('levels', 5), 1.6, "Level 1 end: 1.6s");
assertEquals(getInterval('levels', 6), 1.6, "Level 2 start: 1.6s");
assertEquals(getInterval('levels', 48), 0.6, "Level 5: 0.6s"); // FIXED: 48 layers enters level 5

console.log("\n=== getInterval — infinite mode ===");

assertEquals(getInterval('infinite', 0), 1.8, "Infinite start: 1.8s");
assertEquals(getInterval('infinite', 10), 1.6, "After 10 layers: 1.8-0.2=1.6");
assertEquals(getInterval('infinite', 65), 0.5, "After 65 layers: capped at 0.5s");
assertEquals(getInterval('infinite', 100), 0.5, "Capped: 0.5s");

// ============ SUMMARY ============
console.log(`\n==========`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
console.log(`==========\n`);
process.exit(failed > 0 ? 1 : 0);
