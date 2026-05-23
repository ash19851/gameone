let instance = null;

export default class AudioManager {
  constructor() {
    if (instance) return instance;
    instance = this;
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = wx.createWebAudioContext();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.initialized = true;
    } catch (e) {
      // Audio unavailable — all play methods become no-ops
    }
  }

  _isReady() {
    return this.initialized && this.ctx && this.ctx.state !== 'closed';
  }

  _tone(freq, duration, type, volume, rampEndFreq, rampEndTime) {
    if (!this._isReady()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (rampEndFreq !== undefined) {
        osc.frequency.linearRampToValueAtTime(
          rampEndFreq,
          this.ctx.currentTime + (rampEndTime || duration)
        );
      }
      gain.gain.setValueAtTime(volume || 0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // silently ignore
    }
  }

  playDrop() {
    this._tone(120, 0.05, 'triangle', 0.2, 60, 0.05);
  }

  playMerge() {
    this._tone(300, 0.1, 'sine', 0.12, 600, 0.1);
  }

  playBombExplosion() {
    this._tone(80, 0.2, 'sawtooth', 0.25, 20, 0.2);
    this._tone(600, 0.15, 'square', 0.08, 100, 0.15);
  }

  playCollapse() {
    this._tone(60, 0.3, 'sawtooth', 0.3, 30, 0.3);
    this._tone(120, 0.25, 'triangle', 0.12, 50, 0.25);
  }

  playLevelUp() {
    if (!this._isReady()) return;
    try {
      const notes = [523, 659, 784];
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const t = now + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      });
    } catch (e) {}
  }

  playButtonClick() {
    this._tone(800, 0.015, 'sine', 0.1);
  }

  playDropPenalty() {
    this._tone(400, 0.12, 'triangle', 0.12, 200, 0.12);
  }
}
