import { MAX_LIVES, SKILL_MAGNET_USES, SKILL_TILT_RESET_USES } from './lib/config';
import { loadBestScores } from './data/storage';

let instance;

export default class DataBus {
  constructor() {
    if (instance) return instance;
    instance = this;
    this.reset();
  }

  reset() {
    this.fallingBlocks = [];
    this.settledBlocks = [];
    this.score = 0;
    this.layersBuilt = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.isGameOver = false;
    this.instabilityTimer = 0;
    this.tiltAngle = 0;
    this.comX = 0;
    this.screen = 'menu';
    this.lives = MAX_LIVES;
    this.currentLevel = 1;
    this.cameraY = 0;
    this.isNewRecord = false;
    this.levelUpTimer = 0;
    this.levelUpLevel = 0;
    this.reviveUsed = false;
    this.shakeAmount = 0;
    this.shakeDuration = 0;
    this.bgImage = null;
  }

  initGame(mode) {
    this.reset();
    this.screen = 'playing';
    this.gameMode = mode;
    const best = loadBestScores();
    this.levelsBest = best.levelsBest;
    this.infiniteBest = best.infiniteBest;
    this.ladderBest = best.ladderBest || 0;
    this.coins = best.coins;
    this.upgrades = best.upgrades;
    this.gameCount = (best.gameCount || 0) + 1;

    // Skills (per-game)
    this.slowTimer = 0;
    this.magnetRemaining = SKILL_MAGNET_USES;
    this.sameColorActive = false;
    this.sameColorTimer = 0;
    this.sameColorType = 0;
    this.tiltResetsRemaining = SKILL_TILT_RESET_USES;
  }

  backToMenu() {
    const best = loadBestScores();
    this.levelsBest = best.levelsBest;
    this.infiniteBest = best.infiniteBest;
    this.ladderBest = best.ladderBest || 0;
    this.coins = best.coins;
    this.upgrades = best.upgrades;
    this.screen = 'menu';
  }
}
