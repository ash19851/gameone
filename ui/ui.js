import { SCREEN_WIDTH, SCREEN_HEIGHT } from './lib/render';
import { HUD_HEIGHT, CAR_BAR_HEIGHT, UPGRADES, SKILL_MAGNET_USES, SKILL_TILT_RESET_USES, SKILL_SLOW_DURATION, SKILL_SAME_COLOR_DURATION, COIN_EARN_RATIO } from './lib/config';
import { loadBestScores, buyUpgrade } from './data/storage';

export default class UI {
  constructor() {
    this.btnLevels = { x: 0, y: 0, w: 0, h: 0 };
    this.btnInfinite = { x: 0, y: 0, w: 0, h: 0 };
    this.btnLadder = { x: 0, y: 0, w: 0, h: 0 };
    this.btnLeaderboard = { x: 0, y: 0, w: 0, h: 0 };
    this.btnUpgrades = { x: 0, y: 0, w: 0, h: 0 };
    this.btnRestart = { x: 0, y: 0, w: 0, h: 0 };
    this.btnMenu = { x: 0, y: 0, w: 0, h: 0 };
    this.btnDoubleCoins = { x: 0, y: 0, w: 0, h: 0 };
    this.btnReviveWatch = { x: 0, y: 0, w: 0, h: 0 };
    this.btnReviveNo = { x: 0, y: 0, w: 0, h: 0 };
    this.btnTutorial = null;
    this.btnShareLadder = { x: 0, y: 0, w: 0, h: 0 };
    this.btnChallengeFriend = { x: 0, y: 0, w: 0, h: 0 };
    this.skillBtns = [];
    this.upgradeBtns = [];
  }

  // helpers

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawButton(ctx, x, y, w, h, text, color, fontSize) {
    ctx.fillStyle = color;
    this.roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize || 18}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  hitTest(rect, clientX, clientY) {
    return clientX >= rect.x && clientX <= rect.x + rect.w
        && clientY >= rect.y && clientY <= rect.y + rect.h;
  }

  // main menu

  renderMenu(ctx) {
    const cx = SCREEN_WIDTH / 2;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🚚 小车积木塔', cx, SCREEN_HEIGHT * 0.14);

    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('接住方块 · 同色合并 · 堆高成塔', cx, SCREEN_HEIGHT * 0.22);

    const btnW = 200;
    const btnH = 50;
    const btnX = cx - btnW / 2;
    const gap = 14;

    const by1 = SCREEN_HEIGHT * 0.32;
    this.drawButton(ctx, btnX, by1, btnW, btnH, '闯关模式', '#2ECC71');
    this.btnLevels = { x: btnX, y: by1, w: btnW, h: btnH };

    const by2 = by1 + btnH + gap;
    this.drawButton(ctx, btnX, by2, btnW, btnH, '无限模式', '#3498DB');
    this.btnInfinite = { x: btnX, y: by2, w: btnW, h: btnH };

    const by3 = by2 + btnH + gap;
    this.drawButton(ctx, btnX, by3, btnW, btnH, '🏆 天梯竞技', '#E74C3C');
    this.btnLadder = { x: btnX, y: by3, w: btnW, h: btnH };

    const by4 = by3 + btnH + gap;
    this.drawButton(ctx, btnX, by4, btnW, btnH, '⚙️ 升级商店', '#E67E22');
    this.btnUpgrades = { x: btnX, y: by4, w: btnW, h: btnH };

    // "?" help button
    const helpR = 18;
    const helpX = SCREEN_WIDTH - helpR * 2 - 10;
    const helpY = 10;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(helpX + helpR, helpY + helpR, helpR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', helpX + helpR, helpY + helpR);

    // Leaderboard button (left side)
    const lbR = 18;
    const lbX = 10;
    const lbY = 10;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(lbX + lbR, lbY + lbR, lbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('??', lbX + lbR, lbY + lbR);
    this.btnLeaderboard = { x: lbX, y: lbY, w: lbR * 2, h: lbR * 2 };
    this.btnTutorial = { x: helpX, y: helpY, w: helpR * 2, h: helpR * 2 };

    const db = GameGlobal.databus;
    const bestY = by4 + btnH + 24;
    ctx.font = '13px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    if (db.levelsBest > 0) ctx.fillText(`闯关最高分: ${db.levelsBest}`, cx, bestY);
    if (db.infiniteBest > 0) ctx.fillText(`无限最高分: ${db.infiniteBest}`, cx, bestY + 20);
    if (db.ladderBest > 0) ctx.fillText(`天梯最高分: ${db.ladderBest}`, cx, bestY + 40);
    ctx.fillText(`🪙 ${db.coins}`, cx, bestY + 64);
  }

  checkMenuTouch(clientX, clientY) {
    if (this.hitTest(this.btnLevels, clientX, clientY)) return 'levels';
    if (this.hitTest(this.btnInfinite, clientX, clientY)) return 'infinite';
    if (this.hitTest(this.btnLadder, clientX, clientY)) return 'ladder';
    if (this.hitTest(this.btnUpgrades, clientX, clientY)) return 'upgrades';
    if (this.hitTest(this.btnLeaderboard, clientX, clientY)) return 'leaderboard';
    return null;
  }

  checkMenuTutorialTouch(clientX, clientY) {
    return this.btnTutorial && this.hitTest(this.btnTutorial, clientX, clientY);
  }

  //  upgrade shop 

  renderUpgrades(ctx) {
    const cx = SCREEN_WIDTH / 2;
    const db = GameGlobal.databus;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚙️ 升级商店', cx, 30);

    ctx.fillStyle = '#F1C40F';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`🪙 ${db.coins}`, cx, 62);

    // Note about ladder mode
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '12px Arial';
    ctx.fillText('⚠ 升级仅对闯关/无限模式生效，天梯模式固定参数', cx, 82);

    this.upgradeBtns = [];
    const startY = 100;
    const rowH = 64;

    UPGRADES.forEach((upg, i) => {
      const y = startY + i * rowH;
      const level = db.upgrades[upg.key] || 0;
      const maxed = level >= upg.maxLv;
      const cost = maxed ? 0 : upg.costs[level];
      const canBuy = !maxed && db.coins >= cost;

      // Card background
      ctx.fillStyle = maxed ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255,255,255,0.08)';
      this.roundRect(ctx, 20, y, SCREEN_WIDTH - 40, rowH - 6, 8);
      ctx.fill();

      // Icon + name + level
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${upg.icon} ${upg.name}`, 36, y + 22);
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(upg.desc, 36, y + 42);

      // Level dots
      ctx.textAlign = 'right';
      let lvStr = '';
      for (let j = 0; j < upg.maxLv; j++) {
        lvStr += j < level ? '●' : '○';
      }
      ctx.fillStyle = '#F1C40F';
      ctx.font = '14px Arial';
      ctx.fillText(lvStr, SCREEN_WIDTH - 120, y + 32);

      // Buy button
      const btnX = SCREEN_WIDTH - 110;
      const btnY = y + 6;
      const btnW = 90;
      const btnH = rowH - 18;
      const btnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
      this.upgradeBtns.push({ key: upg.key, rect: btnRect, cost, maxed });

      if (maxed) {
        ctx.fillStyle = '#2ECC71';
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('已满', btnX + btnW / 2, btnY + btnH / 2);
      } else {
        ctx.fillStyle = canBuy ? '#27AE60' : '#555';
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`🪙${cost}`, btnX + btnW / 2, btnY + btnH / 2);
      }
    });

    // Back button
    const backW = 120;
    const backX = cx - backW / 2;
    const backY = startY + UPGRADES.length * rowH + 16;
    this.drawButton(ctx, backX, backY, backW, 44, '返回菜单', '#7F8C8D');
    this.btnMenu = { x: backX, y: backY, w: backW, h: 44 };
  }

  tryBuyUpgrade(clientX, clientY) {
    const db = GameGlobal.databus;
    for (const btn of this.upgradeBtns) {
      if (this.hitTest(btn.rect, clientX, clientY)) {
        if (!btn.maxed && db.coins >= btn.cost) {
          buyUpgrade(btn.key, btn.cost);
          db.upgrades = loadBestScores().upgrades;
          db.coins = loadBestScores().coins;
        }
        return;
      }
    }
  }

  //  HUD

  renderHUD(ctx) {
    const db = GameGlobal.databus;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`得分: ${db.score}`, 12, HUD_HEIGHT / 2);

    ctx.textAlign = 'center';
    ctx.fillText(`层数: ${db.layersBuilt}`, SCREEN_WIDTH / 2, HUD_HEIGHT / 2);

    // Lives
    ctx.textAlign = 'right';
    let hearts = '';
    for (let i = 0; i < db.lives; i++) hearts += '❤️';
    for (let i = db.lives; i < 5; i++) hearts += '🖤';
    ctx.fillText(hearts, SCREEN_WIDTH - 12, HUD_HEIGHT / 2);

    // Combo
    if (db.comboCount > 1) {
      ctx.fillStyle = '#F1C40F';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${db.comboCount}x`, SCREEN_WIDTH - 12, HUD_HEIGHT / 2 + 18);
    }
  }

  renderSkillBar(ctx) {
    const db = GameGlobal.databus;
    const startY = HUD_HEIGHT + 4;

    this.skillBtns = [];
    const skills = [
      { key: 'slow', name: '缓降', icon: '⏳', active: db.slowTimer > 0, count: 1, used: db.slowTimer <= 0 && db.slowTimer !== undefined ? false : null },
      { key: 'magnet', name: '磁铁', icon: '🧲', count: SKILL_MAGNET_USES, remaining: db.magnetRemaining },
      { key: 'sameColor', name: '同色', icon: '🎨', active: db.sameColorActive, count: 1, used: db.sameColorActive === false && db.sameColorTimer <= 0 },
      { key: 'tiltReset', name: '复位', icon: '🔄', count: SKILL_TILT_RESET_USES, remaining: db.tiltResetsRemaining },
    ];

    const btnW = 56;
    const btnH = 42;
    const gap = 8;
    const totalW = skills.length * btnW + (skills.length - 1) * gap;
    const startX = (SCREEN_WIDTH - totalW) / 2;

    skills.forEach((sk, i) => {
      const x = startX + i * (btnW + gap);
      const y = startY;
      const rect = { x, y, w: btnW, h: btnH };

      let remaining;
      if (sk.key === 'magnet') remaining = db.magnetRemaining;
      else if (sk.key === 'tiltReset') remaining = db.tiltResetsRemaining;
      else if (sk.key === 'slow') remaining = db.slowTimer > 0 ? 0 : 1;
      else remaining = db.sameColorActive ? 0 : 1;

      const available = remaining > 0;
      const alpha = available ? 1 : 0.4;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = available ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
      this.roundRect(ctx, x, y, btnW, btnH, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sk.icon, x + btnW / 2, y + 14);

      ctx.font = '10px Arial';
      ctx.fillStyle = available ? '#fff' : '#888';
      ctx.fillText(sk.name, x + btnW / 2, y + 32);

      if (remaining > 0 && sk.count > 1) {
        ctx.fillStyle = '#F1C40F';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`x${remaining}`, x + btnW - 4, y + 10);
      }

      this.skillBtns.push({ key: sk.key, rect, available });
    });
  }

  checkSkillTouch(clientX, clientY) {
    for (const btn of this.skillBtns) {
      if (btn.available && this.hitTest(btn.rect, clientX, clientY)) {
        // Mark as used
        btn.available = false;
        return btn.key;
      }
    }
    return null;
  }

  renderCarBar(ctx) {
    const barY = SCREEN_HEIGHT - CAR_BAR_HEIGHT;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, barY, SCREEN_WIDTH, CAR_BAR_HEIGHT);
  }

  // Revive (only for non-ladder modes)

  renderRevive(ctx) {
    const db = GameGlobal.databus;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cx = SCREEN_WIDTH / 2;
    const cy = SCREEN_HEIGHT * 0.32;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('就差一点！', cx, cy);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('看一段广告即可复活', cx, cy + 40);

    const btnW = 180;
    const btnH = 48;
    const btnX = cx - btnW / 2;
    const by1 = cy + 80;
    const by2 = by1 + btnH + 10;

    this.drawButton(ctx, btnX, by1, btnW, btnH, '📵 看广告复活', '#27AE60');
    this.btnReviveWatch = { x: btnX, y: by1, w: btnW, h: btnH };

    this.drawButton(ctx, btnX, by2, btnW, btnH, '不，结束吧', '#7F8C8D');
    this.btnReviveNo = { x: btnX, y: by2, w: btnW, h: btnH };
  }

  isTouchOnReviveWatch(clientX, clientY) {
    return this.hitTest(this.btnReviveWatch, clientX, clientY);
  }

  isTouchOnReviveNo(clientX, clientY) {
    return this.hitTest(this.btnReviveNo, clientX, clientY);
  }

  // game over (non-ladder)

  renderGameOver(ctx) {
    const db = GameGlobal.databus;
    const cx = SCREEN_WIDTH / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cy = SCREEN_HEIGHT * 0.30;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const title = db.lives <= 0 ? '生命耗尽!' : '塔倒塌了!';
    ctx.fillText(title, cx, cy);

    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`最终得分: ${db.score}`, cx, cy + 46);
    ctx.fillText(`搭建层数: ${db.layersBuilt}`, cx, cy + 72);

    const coinsEarned = Math.floor(db.score / COIN_EARN_RATIO);
    ctx.fillStyle = '#F1C40F';
    ctx.fillText(`🪙 +${coinsEarned}`, cx, cy + 98);

    if (db.isNewRecord) {
      ctx.fillStyle = '#F1C40F';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('🎉 新纪录!', cx, cy + 128);
    }

    const btnW = 200;
    const btnH = 44;
    const btnX = cx - btnW / 2;
    const by1 = cy + 160;

    this.drawButton(ctx, btnX, by1, btnW, btnH, '重新开始', '#27AE60');
    this.btnRestart = { x: btnX, y: by1, w: btnW, h: btnH };

    this.drawButton(ctx, btnX, by1 + btnH + 10, btnW, btnH, '📵 双倍金币', '#E67E22');
    this.btnDoubleCoins = { x: btnX, y: by1 + btnH + 10, w: btnW, h: btnH };

    this.drawButton(ctx, btnX, by1 + (btnH + 10) * 2, btnW, btnH, '返回菜单', '#7F8C8D');
    this.btnMenu = { x: btnX, y: by1 + (btnH + 10) * 2, w: btnW, h: btnH };
  }

  // ladder game over (no revive, no double coins, social buttons)

  renderLadderGameOver(ctx) {
    const db = GameGlobal.databus;
    const cx = SCREEN_WIDTH / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cy = SCREEN_HEIGHT * 0.26;

    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('💥 塔倒塌了!', cx, cy);

    ctx.font = '22px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`🏆 ${db.score}`, cx, cy + 48);

    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`层数: ${db.layersBuilt}  连击: ${db.comboCount || 0}`, cx, cy + 78);

    if (db.isNewRecord) {
      ctx.fillStyle = '#F1C40F';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('🎉 新纪录!', cx, cy + 108);
    }

    const btnW = 200;
    const btnH = 44;
    const btnX = cx - btnW / 2;
    const btnGap = 8;
    const byStart = db.isNewRecord ? cy + 140 : cy + 115;

    this.drawButton(ctx, btnX, byStart, btnW, btnH, '🔄 再来一局', '#27AE60');
    this.btnRestart = { x: btnX, y: byStart, w: btnW, h: btnH };

    this.drawButton(ctx, btnX, byStart + btnH + btnGap, btnW, btnH, '📤 分享战绩', '#3498DB');
    this.btnShareLadder = { x: btnX, y: byStart + btnH + btnGap, w: btnW, h: btnH };

    this.drawButton(ctx, btnX, byStart + (btnH + btnGap) * 2, btnW, btnH, '⚔️ 挑战好友', '#E67E22');
    this.btnChallengeFriend = { x: btnX, y: byStart + (btnH + btnGap) * 2, w: btnW, h: btnH };

    this.drawButton(ctx, btnX, byStart + (btnH + btnGap) * 3, btnW, btnH, '🏠 返回菜单', '#7F8C8D');
    this.btnMenu = { x: btnX, y: byStart + (btnH + btnGap) * 3, w: btnW, h: btnH };
  }

  isTouchOnDoubleCoins(clientX, clientY) {
    return GameGlobal.databus.isGameOver && this.hitTest(this.btnDoubleCoins, clientX, clientY);
  }

  isTouchOnLeaderboard(clientX, clientY) {
    return (GameGlobal.databus.isGameOver && GameGlobal.databus.gameMode === 'ladder')
      && this.hitTest(this.btnLeaderboard, clientX, clientY);
  }

  isTouchOnRestart(clientX, clientY) {
    return GameGlobal.databus.isGameOver && this.hitTest(this.btnRestart, clientX, clientY);
  }

  isTouchOnMenu(clientX, clientY) {
    return (GameGlobal.databus.isGameOver || GameGlobal.databus.screen === 'upgrades')
      && this.hitTest(this.btnMenu, clientX, clientY);
  }

  isTouchOnShareLadder(clientX, clientY) {
    return GameGlobal.databus.isGameOver && GameGlobal.databus.gameMode === 'ladder'
      && this.hitTest(this.btnShareLadder, clientX, clientY);
  }

  isTouchOnChallengeFriend(clientX, clientY) {
    return GameGlobal.databus.isGameOver && GameGlobal.databus.gameMode === 'ladder'
      && this.hitTest(this.btnChallengeFriend, clientX, clientY);
  }

  // main render

  render(ctx) {
    const db = GameGlobal.databus;
    this.renderHUD(ctx);
    this.renderSkillBar(ctx);
    this.renderCarBar(ctx);

    if (db.screen === 'revive') {
      this.renderRevive(ctx);
    } else if (db.isGameOver) {
      if (db.gameMode === 'ladder') {
        this.renderLadderGameOver(ctx);
      } else {
        this.renderGameOver(ctx);
      }
    }

    if (db.levelUpTimer > 0 && db.screen === 'playing') {
      this.renderLevelUp(ctx);
    }
  }

  renderLevelUp(ctx) {
    const db = GameGlobal.databus;
    const alpha = Math.min(1, db.levelUpTimer / 0.6);
    const cy = SCREEN_HEIGHT * 0.45;

    if (db.gameMode === 'ladder') {
      ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.8})`;
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥 加速!', SCREEN_WIDTH / 2, cy);
    } else {
      ctx.fillStyle = `rgba(241, 196, 15, ${alpha * 0.8})`;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`第${db.levelUpLevel} 关通过!`, SCREEN_WIDTH / 2, cy);
    }
  }

  renderTutorial(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cx = SCREEN_WIDTH / 2;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('如何玩', cx, SCREEN_HEIGHT * 0.12);

    const steps = [
      { icon: '👆', text: '左右滑动移动小车', y: SCREEN_HEIGHT * 0.28 },
      { icon: '🧱', text: '接住同色方块合并得分', y: SCREEN_HEIGHT * 0.42 },
      { icon: '⚖️', text: '保持塔的平衡!', y: SCREEN_HEIGHT * 0.56 },
    ];

    for (const step of steps) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(step.icon, cx, step.y);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(step.text, cx, step.y + 50);
    }

    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 600);
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse * 0.4})`;
    ctx.font = '15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('点击任意位置开始游戏', cx, SCREEN_HEIGHT * 0.78);
  }
}
