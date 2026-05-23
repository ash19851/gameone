// Replay system - records and replays game sessions
// Stores: touch sequence + timestamps + random seed
// Replay: re-runs game logic with same seed, driven by recorded inputs

export default class ReplayRecorder {
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

export class ReplayPlayer {
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
