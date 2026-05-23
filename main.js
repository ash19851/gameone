import './lib/render';
import DataBus from './data/databus';
import Car from './engine/car';
import Physics from './engine/physics';
import Spawner from './engine/spawner';
import Merger from './engine/merger';
import ParticleSystem from './lib/particles';
import UI from './ui/ui';
import Block from './lib/block';
import {
  COMBO_WINDOW, SCORE_CATCH, SCORE_DROP_PENALTY,
  HUD_HEIGHT, CAR_BAR_HEIGHT, BLOCK_HEIGHT,
  LEVELS, SKILL_SLOW_FACTOR, SKILL_SAME_COLOR_DURATION, COIN_EARN_RATIO,
  INTERSTITIAL_EVERY_N_GAMES,
  BOMB_FUSE_DURATION, BOMB_EXPLOSION_RADIUS,
  MAGNET_PULL_FORCE, MAGNET_PULL_FALLOFF, SCORE_BOMB_DESTROY,
  SHAKE_DECAY, SHAKE_INITIAL,
} from './lib/config';
import { saveBestScore, saveCoins, incrementGameCount, getTutorialSeen, setTutorialSeen } from './data/storage';
import { showRewardedAd, showInterstitial } from './lib/ad';
import AudioManager from './lib/audio';
import FloatTextSystem from './lib/floattext';
import { loadBackgroundImage } from './lib/render';
import { initOpenData, submitLadderScore, showLeaderboard, hideLeaderboard } from './social/open-data';

const ctx = canvas.getContext('2d');

export default class Main {
  constructor() {
    GameGlobal.databus = new DataBus();
    this.car = new Car();
    this.physics = new Physics();
    this.spawner = new Spawner();
    this.merger = new Merger();
    this.particles = new ParticleSystem();
    this.ui = new UI();
    this.audio = new AudioManager();
    this.floatTexts = new FloatTextSystem();
    this.tutorialShown = false;
    this.lastTime = Date.now();

    GameGlobal.databus.bgImage = loadBackgroundImage();
    initOpenData();

    wx.onTouchStart(this.onTouchStart.bind(this));
    wx.onTouchMove(this.onTouchMove.bind(this));

    this.start();
  }

  start() {
    this.car.reset();
    this.physics.reset(this.car);
    this.spawner.reset();
    this.particles.reset();
    this.floatTexts.reset();
    cancelAnimationFrame(this.aniId);
    this.lastTime = Date.now();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  onTouchStart(event) {
    this.audio.init();

    // Dismiss tutorial on any tap
    if (this.tutorialShown) {
      this.tutorialShown = false;
      setTutorialSeen();
      return;
    }

    this.touchIsForSkill = false;
    const { clientX, clientY } = event.touches[0];
    const db = GameGlobal.databus;

    if (db.screen === 'menu') {
      if (this.ui.checkMenuTutorialTouch(clientX, clientY)) {
        this.showTutorial();
        return;
      }
      const action = this.ui.checkMenuTouch(clientX, clientY);
      if (action === 'leaderboard') {
        showLeaderboard('friend');
        return;
      }
      if (action === 'levels' || action === 'infinite' || action === 'ladder') {
        this.audio.playButtonClick();
        db.initGame(action);
        this.start();
        if (!getTutorialSeen()) {
          this.showTutorial();
        }
      } else if (action === 'upgrades') {
        this.audio.playButtonClick();
        db.screen = 'upgrades';
      }
      return;
    }

    if (db.screen === 'upgrades') {
      if (this.ui.isTouchOnMenu(clientX, clientY)) {
        this.audio.playButtonClick();
        db.backToMenu();
      } else {
        this.ui.tryBuyUpgrade(clientX, clientY);
      }
      return;
    }

    if (db.screen === 'revive') {
      if (this.ui.isTouchOnReviveWatch(clientX, clientY)) {
        this.doRevive();
        return;
      }
      if (this.ui.isTouchOnReviveNo(clientX, clientY)) {
        this.endGame();
        return;
      }
      return;
    }

    if (db.isGameOver) {
      if (this.ui.isTouchOnRestart(clientX, clientY)) {
        this.audio.playButtonClick();
        db.initGame(db.gameMode);
        this.start();
        return;
      }
      if (this.ui.isTouchOnMenu(clientX, clientY)) {
        this.audio.playButtonClick();
        db.backToMenu();
        return;
      }
      if (this.ui.isTouchOnDoubleCoins(clientX, clientY) && db.gameMode !== 'ladder') {
        this.doDoubleCoins();
        return;
      }
      // Ladder-specific buttons
      if (this.ui.isTouchOnShareLadder(clientX, clientY)) {
        this.shareLadderScore();
        return;
      }
      if (this.ui.isTouchOnChallengeFriend(clientX, clientY)) {
        this.challengeFriend();
        return;
      }
      if (this.ui.isTouchOnLeaderboard(clientX, clientY)) {
        showLeaderboard('friend');
        return;
      }
      return;
    }

    if (db.screen === 'playing') {
      const skill = this.ui.checkSkillTouch(clientX, clientY);
      if (skill) {
        this.audio.playButtonClick();
        this.touchIsForSkill = true;
        this.activateSkill(skill);
        return;
      }
      this.car.setTarget(clientX);
    }
  }

  onTouchMove(event) {
    const db = GameGlobal.databus;
    if (db.screen !== 'playing' || db.isGameOver) return;
    if (this.touchIsForSkill) return;
    const { clientX } = event.touches[0];
    this.car.setTarget(clientX);
  }

  activateSkill(skill) {
    const db = GameGlobal.databus;
    switch (skill) {
      case 'slow':
        db.slowTimer = 4;
        break;
      case 'magnet':
        // magnet is consumed per-block in spawner
        // already initialized in initGame, nothing extra needed here
        break;
      case 'sameColor':
        db.sameColorActive = true;
        db.sameColorTimer = SKILL_SAME_COLOR_DURATION;
        db.sameColorType = Math.floor(Math.random() * 3);
        break;
      case 'tiltReset':
        if (db.tiltResetsRemaining > 0) {
          db.tiltResetsRemaining--;
          db.tiltAngle = 0;
          db.instabilityTimer = 0;
        }
        break;
    }
  }

  showTutorial() {
    this.tutorialShown = true;
  }

  async doRevive() {
    const db = GameGlobal.databus;
    const ok = await showRewardedAd('adunit-revive');
    if (ok) {
      db.isGameOver = false;
      db.screen = 'playing';
      db.tiltAngle = 0;
      db.instabilityTimer = 0;
      db.reviveUsed = true;

      // Remove bottom row of settled blocks
      if (db.settledBlocks.length > 0) {
        const bottomY = Math.max(...db.settledBlocks.map(b => b.y));
        db.settledBlocks = db.settledBlocks.filter(b => {
          if (b.y >= bottomY - 10) {
            return false;
          }
          return true;
        });
      }
    } else {
      this.endGame();
    }
  }

  async doDoubleCoins() {
    const db = GameGlobal.databus;
    const ok = await showRewardedAd('adunit-double');
    if (ok) {
      const extra = Math.floor(db.score / COIN_EARN_RATIO);
      saveCoins(extra);
    }
  }

  applyMagnetPull(magnetBlock) {
    const db = GameGlobal.databus;
    for (const block of db.fallingBlocks) {
      if (block.settled) continue;
      const dx = magnetBlock.x - block.x;
      const dist = Math.abs(dx);
      if (dist < 1) continue;
      const force = MAGNET_PULL_FORCE * Math.max(0.2, 1 - dist / MAGNET_PULL_FALLOFF);
      block.vx += Math.sign(dx) * force;
    }
    this.particles.emit(magnetBlock.x, magnetBlock.y, '#FF4500', 10);
    magnetBlock.magnetPulled = true;
  }

  processBombFuses(dt) {
    const db = GameGlobal.databus;
    const toExplode = [];

    for (const block of db.settledBlocks) {
      if (Block.isBomb(block.type) && block.fuseTimer > 0) {
        block.fuseTimer -= dt;
        if (block.fuseTimer <= 0) {
          toExplode.push(block);
        }
      }
    }

    for (const bomb of toExplode) {
      const idx = db.settledBlocks.indexOf(bomb);
      if (idx >= 0) db.settledBlocks.splice(idx, 1);

      const destroyed = [];
      for (const block of db.settledBlocks) {
        const dist = Math.hypot(block.x - bomb.x, block.y - bomb.y);
        if (dist <= BOMB_EXPLOSION_RADIUS) {
          destroyed.push(block);
        }
      }

      for (const block of destroyed) {
        const i = db.settledBlocks.indexOf(block);
        if (i >= 0) db.settledBlocks.splice(i, 1);
      }

      this.particles.emit(bomb.x, bomb.y, '#FF4500', 25);
      this.particles.emit(bomb.x, bomb.y, '#FFD700', 15);
      this.audio.playBombExplosion();

      if (destroyed.length > 0) {
        db.score += SCORE_BOMB_DESTROY * destroyed.length;
        const screenY = bomb.y + db.cameraY;
        this.floatTexts.emit(`+${SCORE_BOMB_DESTROY * destroyed.length}`, bomb.x, screenY, '#FF4500', 16);
      }
    }
  }

  endGame() {
    const db = GameGlobal.databus;
    db.isGameOver = true;
    db.isNewRecord = saveBestScore(db.gameMode, db.score);
    const coins = Math.floor(db.score / COIN_EARN_RATIO);
    saveCoins(coins);
    incrementGameCount();

    if ((db.gameCount || 0) % INTERSTITIAL_EVERY_N_GAMES === 0) {
      showInterstitial('adunit-interstitial');
    }
  }

  update(dt) {
    const db = GameGlobal.databus;
    db.carRef = this.car;

    if (db.isGameOver) {
      const allBlocks = [...db.settledBlocks, ...db.fallingBlocks];
      this.physics.applyGravity(allBlocks, dt);
      for (const b of allBlocks) {
        b.x += (b.vx || 0) * dt;
      }
      this.particles.update(dt);
      this.floatTexts.update(dt);
      return;
    }

    if (db.screen !== 'playing') return;

    // Pause game logic while tutorial is showing
    if (this.tutorialShown) {
      this.particles.update(dt);
      this.floatTexts.update(dt);
      return;
    }

    // Slow-mo skill
    let effectiveDt = dt;
    if (db.slowTimer > 0) {
      db.slowTimer -= dt;
      effectiveDt = dt * SKILL_SLOW_FACTOR;
    }

    // Same-color rain timer
    if (db.sameColorActive) {
      db.sameColorTimer -= dt;
      if (db.sameColorTimer <= 0) {
        db.sameColorActive = false;
      }
    }

    const oldCarX = this.car.x;
    this.car.update(effectiveDt);
    const carDx = this.car.x - oldCarX;
    if (Math.abs(carDx) > 0.01) {
      for (const block of db.settledBlocks) {
        block.x += carDx;
      }
    }

    this.physics.rebuildHeightMap(this.car, db.settledBlocks);

    const newBlock = this.spawner.update(effectiveDt, db);
    if (newBlock) {
      db.fallingBlocks.push(newBlock);
    }

    for (const b of db.fallingBlocks) {
      b.x += (b.vx || 0) * effectiveDt;
      b.vx *= 0.94;
    }

    let droppedCount = 0;
    db.fallingBlocks = db.fallingBlocks.filter((b) => {
      if (b.y > canvas.height + 60) {
        if (!b.immuneToDrop) {
          droppedCount++;
          this.audio.playDropPenalty();
          db.score -= SCORE_DROP_PENALTY;
          if (db.score < 0) db.score = 0;
        }
        return false;
      }
      return true;
    });

    if (droppedCount > 0) {
      db.lives -= droppedCount;
      if (db.lives <= 0) {
        db.lives = 0;
        this.endGame();
        return;
      }
    }

    const result = this.physics.checkCollisions(db.fallingBlocks, db.settledBlocks, this.car, effectiveDt);
    db.fallingBlocks = result.remaining;

    if (result.newlySettled.length > 0) {
      db.score += SCORE_CATCH * result.newlySettled.length;
      for (const block of result.newlySettled) {
        this.audio.playDrop();
        const screenY = block.y + db.cameraY;
        const t = Block.getTypeConfig(block.type);
        this.floatTexts.emit(`+${SCORE_CATCH}`, block.x, screenY, t.lighter, 14);
      }
    }

    // Special block effects on newly settled
    for (const block of result.newlySettled) {
      if (Block.isMagnet(block.type) && !block.magnetPulled) {
        this.applyMagnetPull(block);
      }
      if (Block.isBomb(block.type)) {
        block.fuseTimer = BOMB_FUSE_DURATION;
      }
    }

    const mergeResult = this.merger.update(db.settledBlocks, this.particles);
    const mergeScores = mergeResult.scores;
    const displaced = mergeResult.displaced;
    const mergePositions = mergeResult.positions || [];

    if (displaced.length > 0) {
      for (const b of displaced) {
        const idx = db.settledBlocks.indexOf(b);
        if (idx >= 0) db.settledBlocks.splice(idx, 1);
        db.fallingBlocks.push(b);
      }
    }

    // Process bomb fuses (after merge/displace, before findUnsupported)
    this.processBombFuses(effectiveDt);

    const unsupported = this.physics.findUnsupported(db.settledBlocks, this.car);
    if (unsupported.length > 0) {
      for (const b of unsupported) {
        const idx = db.settledBlocks.indexOf(b);
        if (idx >= 0) db.settledBlocks.splice(idx, 1);
        b.settled = false;
        b.vy = 0;
        b.immuneToDrop = true;
        db.fallingBlocks.push(b);
      }
    }

    if (mergeScores.length > 0) {
      db.comboCount += mergeScores.length;
      db.comboTimer = COMBO_WINDOW;
      const multiplier = db.comboCount > 1 ? 2 : 1;
      for (let i = 0; i < mergeScores.length; i++) {
        db.score += mergeScores[i] * multiplier;
        this.audio.playMerge();
        if (mergePositions[i]) {
          const screenY = mergePositions[i].y + db.cameraY;
          const text = multiplier > 1 ? `+${mergeScores[i]} x2` : `+${mergeScores[i]}`;
          this.floatTexts.emit(text, mergePositions[i].x, screenY, '#F1C40F', 14);
        }
      }
      if (db.comboCount >= 3 && mergePositions.length > 0) {
        const lastPos = mergePositions[mergePositions.length - 1];
        const screenY = lastPos.y + db.cameraY - 20;
        this.floatTexts.emit(`x${db.comboCount} COMBO!`, lastPos.x, screenY, '#FF6B6B', 18);
      }
    } else {
      if (db.comboTimer <= 0) db.comboCount = 0;
    }

    if (db.comboTimer > 0) {
      db.comboTimer -= dt;
      if (db.comboTimer <= 0) db.comboCount = 0;
    }

    if (db.levelUpTimer > 0) db.levelUpTimer -= dt;

    // Compute actual vertical layers from tower height (car top → highest block top)
    if (db.settledBlocks.length > 0 && db.gameMode === 'levels') {
      const carTop = this.car.y - this.car.height / 2;
      const highestTop = Math.min(...db.settledBlocks.map(b => b.top));
      const totalLayers = Math.max(0, Math.round((carTop - highestTop) / BLOCK_HEIGHT));
      if (totalLayers > db.layersBuilt) {
        db.layersBuilt = totalLayers;
      }
      // Derive current level from total layers built
      let remaining = db.layersBuilt;
      let newLevel = 1;
      for (const cfg of LEVELS) {
        if (remaining < cfg.layers || cfg.layers === Infinity) {
          newLevel = cfg.level;
          break;
        }
        remaining -= cfg.layers;
        newLevel = cfg.level + 1;
      }
      if (newLevel > db.currentLevel) {
        db.levelUpLevel = db.currentLevel;
        db.currentLevel = newLevel;
        db.levelUpTimer = 2.5;
        this.audio.playLevelUp();
        this.floatTexts.emit(`第 ${db.currentLevel} 关!`, canvas.width / 2, canvas.height * 0.48, '#F1C40F', 24);
      }
    }

    // Update screen shake
    if (db.shakeDuration > 0) {
      db.shakeDuration -= effectiveDt;
      if (db.shakeDuration <= 0) {
        db.shakeAmount = 0;
      } else {
        db.shakeAmount *= Math.exp(-SHAKE_DECAY * effectiveDt);
      }
    }

    this.updateCamera();

    const collapsed = this.physics.checkStability(db.settledBlocks, this.car, effectiveDt);
    if (collapsed && !db.isGameOver) {
      this.audio.playCollapse();
      db.shakeAmount = SHAKE_INITIAL;
      db.shakeDuration = 0.5;
      if (!db.reviveUsed && db.gameMode !== 'ladder') {
        db.screen = 'revive';
        db.isGameOver = true;
        this.physics.triggerCollapse(db.settledBlocks, this.particles, db.tiltAngle);
      } else {
        this.endGame();
        this.physics.triggerCollapse(db.settledBlocks, this.particles, db.tiltAngle);
      }
    }

    this.particles.update(dt);
    this.floatTexts.update(dt);
  }

  updateCamera() {
    const db = GameGlobal.databus;
    if (db.settledBlocks.length === 0) {
      db.cameraY += (0 - db.cameraY) * 0.1;
      return;
    }

    const gameBottom = canvas.height - CAR_BAR_HEIGHT;
    const gameTop = HUD_HEIGHT;
    const thresholdY = gameTop + (gameBottom - gameTop) * 0.35;

    const topBlock = Math.min(...db.settledBlocks.map(b => b.top));
    const targetY = thresholdY - topBlock;

    if (targetY > 0) {
      db.cameraY += (targetY - db.cameraY) * 0.08;
      if (db.cameraY < 0) db.cameraY = 0;
    } else {
      db.cameraY += (0 - db.cameraY) * 0.1;
    }
  }

  render() {
    const db = GameGlobal.databus;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (db.screen === 'menu') {
      this.drawBackground();
      this.ui.renderMenu(ctx);
      return;
    }

    if (db.screen === 'upgrades') {
      this.drawBackground();
      this.ui.renderUpgrades(ctx);
      return;
    }

    this.drawBackground();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HUD_HEIGHT, canvas.width, canvas.height - HUD_HEIGHT - CAR_BAR_HEIGHT);
    ctx.clip();

    // Compute shake offset
    let shakeX = 0, shakeY = 0;
    if (db.shakeAmount > 0.5) {
      shakeX = (Math.random() - 0.5) * db.shakeAmount * 2;
      shakeY = (Math.random() - 0.5) * db.shakeAmount * 2;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY + db.cameraY);

    const tilt = db.tiltAngle * Math.PI / 180;
    ctx.save();
    if (Math.abs(tilt) > 0.001) {
      const pivotY = this.car.bottom;
      ctx.translate(this.car.x, pivotY);
      ctx.rotate(tilt);
      ctx.translate(-this.car.x, -pivotY);
    }

    const groundY = this.car.y + this.car.height / 2 + 14;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-200, groundY);
    ctx.lineTo(canvas.width + 200, groundY);
    ctx.stroke();

    this.car.render(ctx);

    for (const block of db.settledBlocks) {
      Block.render(ctx, block);
    }
    for (const block of db.fallingBlocks) {
      Block.render(ctx, block);
    }

    ctx.restore();
    this.particles.render(ctx);
    ctx.restore();

    // Float texts in screen space (inside clip, outside camera)
    this.floatTexts.render(ctx);

    ctx.restore();

    this.ui.render(ctx);

    // Tutorial overlay
    if (this.tutorialShown) {
      this.ui.renderTutorial(ctx);
    }
  }

  drawBackground() {
    const db = GameGlobal.databus;

    // Draw background image if loaded
    if (db.bgImage && db.bgImage.width > 0) {
      const imgRatio = db.bgImage.width / db.bgImage.height;
      const canvasRatio = canvas.width / canvas.height;
      let dw, dh, dx, dy;
      if (imgRatio > canvasRatio) {
        dh = canvas.height;
        dw = canvas.height * imgRatio;
        dx = (canvas.width - dw) / 2;
        dy = 0;
      } else {
        dw = canvas.width;
        dh = canvas.width / imgRatio;
        dx = 0;
        dy = (canvas.height - dh) / 2;
      }
      ctx.drawImage(db.bgImage, dx, dy, dw, dh);
    }

    // Gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(26, 26, 46, 0.75)');
    grad.addColorStop(0.5, 'rgba(22, 33, 62, 0.8)');
    grad.addColorStop(1, 'rgba(15, 52, 96, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  shareLadderScore() {
    const db = GameGlobal.databus;
    wx.shareAppMessage({
      title: `? ? ? ? ? ? ? ? ${db.score} ??? ? ? ? ??`,
    });
  }

  challengeFriend() {
    const db = GameGlobal.databus;
    wx.shareAppMessage({
      title: `?? ${db.score} ?????????`,
      query: `challenge=1&score=${db.score}&mode=ladder`,
    });
  }

  loop() {
    const now = Date.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) dt = 0.016;

    this.update(dt);
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}

new Main();
