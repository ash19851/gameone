// replay.test.js — TDD tests for data/replay.js
// Run with: node tests/replay.test.js

// ---------- Replay System (from data/replay.js) ----------

class ReplayRecorder {
  constructor() {
    this.recording = false;
    this.actions = [];
    this.startTime = 0;
    this.randomSeed = 0;
  }

  start(seed) {
    this.recording = true;
    this.actions = [];
    this.startTime = Date.now();
    this.randomSeed = seed;
  }

  recordTouch(x) {
    if (!this.recording) return;
    this.actions.push({ t: Date.now() - this.startTime, x });
  }

  stop() {
    this.recording = false;
    return {
      seed: this.randomSeed,
      actions: this.actions,
      duration: Date.now() - this.startTime,
    };
  }
}

class ReplayPlayer {
  constructor(replayData) {
    this.data = replayData;
    this.playbackTime = 0;
    this.currentIndex = 0;
    this.finished = false;
  }

  getActionAt(dt) {
    this.playbackTime += dt;
    while (
      this.currentIndex < this.data.actions.length &&
      this.data.actions[this.currentIndex].t <= this.playbackTime
    ) {
      this.currentIndex++;
    }
    if (this.currentIndex > 0) {
      return this.data.actions[this.currentIndex - 1].x;
    }
    return null;
  }
}

// ---------- Test Runner ----------

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

function assertEquals(actual, expected, msg) {
  if (actual === expected || (typeof actual === 'number' && Math.abs(actual - expected) < 0.01)) { passed++; }
  else { console.error(`  FAIL: ${msg} — expected ${expected}, got ${actual}`); failed++; }
}

// ============ TESTS ============

console.log("\n=== ReplayRecorder ===");

{
  const recorder = new ReplayRecorder();
  assert(!recorder.recording, "Initially not recording");
}

{
  const recorder = new ReplayRecorder();
  recorder.start(42);
  assert(recorder.recording, "Start sets recording=true");
  assertEquals(recorder.randomSeed, 42, "Seed captured on start");
  assertEquals(recorder.actions.length, 0, "Actions empty on start");
}

{
  const recorder = new ReplayRecorder();
  recorder.recordTouch(150); // should be ignored
  assertEquals(recorder.actions.length, 0, "Touch ignored when not recording");
}

{
  const recorder = new ReplayRecorder();
  recorder.start(7);
  recorder.recordTouch(100);
  recorder.recordTouch(200);
  recorder.recordTouch(300);
  assertEquals(recorder.actions.length, 3, "3 touches recorded");
  assert(recorder.actions[0].t >= 0, "Timestamp is non-negative");
  assertEquals(recorder.actions[0].x, 100, "First touch x=100");
  assertEquals(recorder.actions[2].x, 300, "Third touch x=300");
}

{
  const recorder = new ReplayRecorder();
  recorder.start(99);
  const data = recorder.stop();
  assert(!recorder.recording, "Stop sets recording=false");
  assertEquals(data.seed, 99, "Seed in output data");
  assert(data.duration >= 0, "Duration is non-negative");
}

console.log("\n=== ReplayPlayer ===");

{
  const data = {
    seed: 42,
    actions: [
      { t: 100, x: 150 },
      { t: 500, x: 200 },
      { t: 900, x: 250 },
    ],
    duration: 1000,
  };
  const player = new ReplayPlayer(data);

  // Before first action
  assertEquals(player.getActionAt(50), null, "Before first action: null");

  // After first action time
  assertEquals(player.getActionAt(60), 150, "After t=100: returns first x");
  assertEquals(player.getActionAt(0), 150, "Still at same position");

  // After second action
  assertEquals(player.getActionAt(400), 200, "After t=500: returns second x");

  // After third
  assertEquals(player.getActionAt(410), 250, "After t=900: returns third x");
}

{
  // Same seed replay test: identical actions should produce same positions
  const data = {
    seed: 12345,
    actions: [
      { t: 50, x: 100 },
      { t: 150, x: 180 },
    ],
    duration: 200,
  };

  const p1 = new ReplayPlayer(data);
  const p2 = new ReplayPlayer(data);

  // Both players, stepping through identically
  const steps = [30, 30, 50, 50];
  for (const dt of steps) {
    const a1 = p1.getActionAt(dt);
    const a2 = p2.getActionAt(dt);
    // Both should produce same results at same times
    assertEquals(a1, a2, "Same data + same steps = same output");
  }
}

// ============ SUMMARY ============
console.log(`\n==========`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
console.log(`==========\n`);
process.exit(failed > 0 ? 1 : 0);
