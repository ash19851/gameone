import { SCREEN_WIDTH, SCREEN_HEIGHT } from './lib/render';
import { HUD_HEIGHT, CAR_BAR_HEIGHT, UPGRADES, SKILL_MAGNET_USES, SKILL_TILT_RESET_USES, SKILL_SLOW_DURATION, SKILL_SAME_COLOR_DURATION, COIN_EARN_RATIO } from './lib/config';
import { loadBestScores, buyUpgrade } from './data/storage';

export default class UI {
  constructor() {
    this.btnLevels = { x: 0, y: 0, w: 0, h: 0 };
    this.btnInfinite = { x: 0, y: 0, w: 0, h: 0 };
    this.btnUpgrades = { x: 0, y: 0, w: 0, h: 0 };
    this.btnRestart = { x: 0, y: 0, w: 0, h: 0 };
    this.btnMenu = { x: 0, y: 0, w: 0, h: 0 };
    this.btnDoubleCoins = { x: 0, y: 0, w: 0, h: 0 };
    this.btnReviveWatch = { x: 0, y: 0, w: 0, h: 0 };
    this.btnReviveNo = { x: 0, y: 0, w: 0, h: 0 };
    this.btnTutorial = null;
    this.skillBtns = [];
    this.upgradeBtns = [];
  }

  // ── helpers ──

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

  // ── main menu ──

  renderMenu(ctx) {
    const cx = SCREEN_WIDTH / 2;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🚗 小车积木塔', cx, SCREEN_HEIGHT * 0.14);

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
    this.drawButton(ctx, btnX, by3, btnW, btnH, '🔧 升级商店', '#E67E22');
    this.btnUpgrades = { x: btnX, y: by3, w: btnW, h: btnH };

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
    this.btnTutorial = { x: helpX, y: helpY, w: helpR * 2, h: helpR * 2 };

    const db = GameGlobal.databus;
    const bestY = by3 + btnH + 24;
    ctx.font = '13px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    if (db.levelsBest > 0) ctx.fillText(`闯关最高分: ${db.levelsBest}`, cx, bestY);
    if (db.infiniteBest > 0) ctx.fillText(`无限最高分: ${db.infiniteBest}`, cx, bestY + 20);
    ctx.fillText(`💰 ${db.coins}`, cx, bestY + (db.infiniteBest > 0 ? 44 : 24));
  }

  checkMenuTouch(clientX, clientY) {
    if (this.hitTest(this.btnLevels, clientX, clientY)) return 'levels';
    if (this.hitTest(this.btnInfinite, clientX, clientY)) return 'infinite';
    if (this.hitTest(this.btnUpgrades, clientX, clientY)) return 'upgrades';
    return null;
  }

  checkMenuTutorialTouch(clientX, clientY) {
    return this.btnTutorial && this.hitTest(this.btnTutorial, clientX, clientY);
  }

  // ── upgrade shop ──

  renderUpgrades(ctx) {
    const cx = SCREEN_WIDTH / 2;
    const db = GameGlobal.databus;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🔧 升级商店', cx, 30);

    ctx.fillStyle = '#F1C40F';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`💰 ${db.coins}`, cx, 62);

    this.upgradeBtns = [];
    const startY = 90;
    const rowH = 64;

    UPGRADES.forEach((upg, i) => {
      const y = startY + i * rowH;
      const level = (db.upgrades && db.upgrades[upg.key]) || 0;
      const maxed = level >= upg.maxLv;
      const cost = maxed ? 0 : upg.costs[level];

      // Background
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      this.roundRect(ctx, 10, y, SCREEN_WIDTH - 20, rowH - 4, 8);
      ctx.fill();

      // Icon + name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${upg.icon} ${upg.name}`, 24, y + 8);

      // Level dots
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      let dots = '';
      for (let d = 0; d < upg.maxLv; d++) {
        dots += d < level ? '●' : '○';
      }
      ctx.fillText(dots, 24, y + 30);

      // Desc
      ctx.textAlign = 'right';
      ctx.fillText(`${upg.desc}`, SCREEN_WIDTH - 100, y + 30);

      // Buy button
      const bbW = 72;
      const bbH = 32;
      const bbX = SCREEN_WIDTH - 10 - bbW;
      const bbY = y + (rowH - 4 - bbH) / 2;
      if (maxed) {
        ctx.fillStyle = '#555';
        this.roundRect(ctx, bbX, bbY, bbW, bbH, 6);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MAX', bbX + bbW / 2, bbY + bbH / 2);
      } else {
        const canBuy = db.coins >= cost;
        ctx.fillStyle = canBuy ? '#27AE60' : '#555';
        this.roundRect(ctx, bbX, bbY, bbW, bbH, 6);
        ctx.fill();
        ctx.fillStyle = canBuy ? '#fff' : '#999';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`💰${cost}`, bbX + bbW / 2, bbY + bbH / 2);
        if (canBuy) {
          this.upgradeBtns.push({ key: upg.key, cost, newLevel: level + 1, rect: { x: bbX, y: bbY, w: bbW, h: bbH } });
        }
      }
    });

    // Back button
    const by = startY + UPGRADES.length * rowH + 16;
    this.drawButton(ctx, cx - 90, by, 180, 44, '返回菜单', '#7F8C8D');
    this.btnMenu = { x: cx - 90, y: by, w: 180, h: 44 };
  }

  tryBuyUpgrade(clientX, clientY) {
    const db = GameGlobal.databus;
    for (const btn of this.upgradeBtns) {
      if (this.hitTest(btn.rect, clientX, clientY)) {
        if (buyUpgrade(btn.key, btn.cost, btn.newLevel)) {
          db.coins -= btn.cost;
          if (!db.upgrades) db.upgrades = {};
          db.upgrades[btn.key] = btn.newLevel;
        }
        return;
      }
    }
  }

  // ── HUD ──

  renderHUD(ctx) {
    const db = GameGlobal.databus;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT);

    ctx.textBaseline = 'middle';

    // Lives
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    let hearts = '';
    for (let i = 0; i < db.lives; i++) hearts += '♥ ';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText(hearts, 10, HUD_HEIGHT / 2);

    // Level
    ctx.fillStyle = '#F1C40F';
    ctx.font = 'bold 14px Arial';
    const levelText = db.gameMode === 'infinite' ? '∞' : `Lv.${db.currentLevel}`;
    ctx.fillText(levelText, 64, HUD_HEIGHT / 2);

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`分数: ${db.score}`, SCREEN_WIDTH / 2, HUD_HEIGHT / 2);

    // Layers
    ctx.textAlign = 'right';
    ctx.fillText(`层数: ${db.layersBuilt}`, SCREEN_WIDTH - 10, HUD_HEIGHT / 2);

    // Combo
    if (db.comboCount > 1 && db.comboTimer > 0) {
      const alpha = Math.min(1, db.comboTimer / 0.5);
      ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`x${db.comboCount} COMBO!`, SCREEN_WIDTH / 2, HUD_HEIGHT + 24);
    }
  }

  // ── skill bar ──

  renderSkillBar(ctx) {
    const db = GameGlobal.databus;
    if (db.screen !== 'playing' || db.isGameOver) return;

    const skills = [
      {
        key: 'slow',
        icon: '⏸',
        label: '减速',
        active: db.slowTimer > 0,
        remaining: db.slowTimer > 0 ? null : 1,
      },
      {
        key: 'magnet',
        icon: '🧲',
        label: '磁力',
        active: false,
        remaining: db.magnetRemaining,
      },
      {
        key: 'sameColor',
        icon: '🎨',
        label: '同色',
        active: db.sameColorActive,
        remaining: db.sameColorTimer <= 0 && !db.sameColorActive ? 1 : 0,
      },
      {
        key: 'tiltReset',
        icon: '🔄',
        label: '平衡',
        active: false,
        remaining: db.tiltResetsRemaining,
      },
    ];

    const startX = SCREEN_WIDTH - 10;
    const btnR = 16;
    const gap = 4;
    const topY = HUD_HEIGHT + 8;

    this.skillBtns = [];

    for (let i = skills.length - 1; i >= 0; i--) {
      const sk = skills[i];
      const x = startX - (btnR * 2 + gap) * (skills.length - i) + btnR;
      const y = topY + btnR;

      // Background
      const bgColor = sk.active ? 'rgba(46, 204, 113, 0.7)' :
        (sk.remaining > 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)');
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(x, y, btnR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = sk.remaining > 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Icon
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sk.icon, x, y);

      // Remaining count
      if (sk.remaining !== null && sk.remaining > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textBaseline = 'top';
        ctx.fillText(`x${sk.remaining}`, x, y + btnR - 12);
      }

      // Active timer bar
      if (sk.active) {
        let timer = 0, maxTime = 1;
        if (sk.key === 'slow') { timer = db.slowTimer; maxTime = SKILL_SLOW_DURATION; }
        if (sk.key === 'sameColor') { timer = db.sameColorTimer; maxTime = SKILL_SAME_COLOR_DURATION; }
        const pct = timer / maxTime;
        ctx.strokeStyle = '#2ECC71';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, btnR + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
      }

      this.skillBtns.push({
        key: sk.key,
        rect: { x: x - btnR, y: y - btnR, w: btnR * 2, h: btnR * 2 },
        remaining: sk.remaining,
      });
    }
  }

  checkSkillTouch(clientX, clientY) {
    for (const sb of this.skillBtns) {
      if (sb.remaining > 0 && this.hitTest(sb.rect, clientX, clientY)) {
        return sb.key;
      }
    }
    return null;
  }

  isTouchOnSkillBar(clientX) {
    // Skill bar is on the right side — if touching there, don't move car
    return clientX > SCREEN_WIDTH - 130;
  }

  // ── car status bar ──

  renderCarBar(ctx) {
    const db = GameGlobal.databus;
    const barTop = SCREEN_HEIGHT - CAR_BAR_HEIGHT;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, barTop, SCREEN_WIDTH, CAR_BAR_HEIGHT);

    const groundBarY = barTop + 24;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, groundBarY);
    ctx.lineTo(SCREEN_WIDTH - 10, groundBarY);
    ctx.stroke();

    const car = db.carRef;
    if (car) {
      const miniW = car.width * 0.45;
      const miniH = car.height * 0.45;
      const carY = barTop + 36;
      const cx = Math.max(20 + miniW / 2, Math.min(SCREEN_WIDTH - 20 - miniW / 2, car.x));

      ctx.fillStyle = '#5D6D7E';
      ctx.fillRect(cx - miniW / 2, carY - miniH / 2, miniW, miniH);

      ctx.fillStyle = '#F1C40F';
      ctx.beginPath();
      ctx.arc(cx, groundBarY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (Math.abs(db.tiltAngle) > 2) {
      ctx.fillStyle = '#E74C3C';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`倾斜 ${Math.abs(db.tiltAngle).toFixed(1)}°`, SCREEN_WIDTH / 2, barTop + 62);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    const modeLabel = db.gameMode === 'infinite' ? '无限模式' : `第${db.currentLevel}关`;
    ctx.fillText(modeLabel, SCREEN_WIDTH - 12, barTop + 14);
  }

  // ── revive screen ──

  renderRevive(ctx) {
    const db = GameGlobal.databus;
    const cx = SCREEN_WIDTH / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cy = SCREEN_HEIGHT * 0.35;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('塔要倒了!', cx, cy);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('观看广告复活并继续游戏?', cx, cy + 40);

    const btnW = 180;
    const btnH = 48;
    const btnX = cx - btnW / 2;
    const by1 = cy + 80;
    const by2 = by1 + btnH + 10;

    this.drawButton(ctx, btnX, by1, btnW, btnH, '📺 看广告复活', '#27AE60');
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

  // ── game over ──

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
    ctx.fillText(`💰 +${coinsEarned}`, cx, cy + 98);

    if (db.isNewRecord) {
      ctx.fillStyle = '#F1C40F';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('🏆 新纪录!', cx, cy + 128);
    }

    // Buttons
    const btnW = 200;
    const btnH = 44;
    const btnX = cx - btnW / 2;
    const by1 = cy + 160;

    this.drawButton(ctx, btnX, by1, btnW, btnH, '重新开始', '#27AE60');
    this.btnRestart = { x: btnX, y: by1, w: btnW, h: btnH };

    this.drawButton(ctx, btnX, by1 + btnH + 10, btnW, btnH, '📺 双倍金币', '#E67E22');
    this.btnDoubleCoins = { x: btnX, y: by1 + btnH + 10, w: btnW, h: btnH };

    this.drawButton(ctx, btnX, by1 + (btnH + 10) * 2, btnW, btnH, '返回菜单', '#7F8C8D');
    this.btnMenu = { x: btnX, y: by1 + (btnH + 10) * 2, w: btnW, h: btnH };
  }

  isTouchOnDoubleCoins(clientX, clientY) {
    return GameGlobal.databus.isGameOver && this.hitTest(this.btnDoubleCoins, clientX, clientY);
  }

  isTouchOnRestart(clientX, clientY) {
    return GameGlobal.databus.isGameOver && this.hitTest(this.btnRestart, clientX, clientY);
  }

  isTouchOnMenu(clientX, clientY) {
    return (GameGlobal.databus.isGameOver || GameGlobal.databus.screen === 'upgrades')
      && this.hitTest(this.btnMenu, clientX, clientY);
  }

  // ── main render ──

  render(ctx) {
    const db = GameGlobal.databus;
    this.renderHUD(ctx);
    this.renderSkillBar(ctx);
    this.renderCarBar(ctx);

    if (db.screen === 'revive') {
      this.renderRevive(ctx);
    } else if (db.isGameOver) {
      this.renderGameOver(ctx);
    }

    if (db.levelUpTimer > 0 && db.screen === 'playing') {
      this.renderLevelUp(ctx);
    }
  }

  renderLevelUp(ctx) {
    const db = GameGlobal.databus;
    const alpha = Math.min(1, db.levelUpTimer / 0.6);
    const cy = SCREEN_HEIGHT * 0.45;

    ctx.fillStyle = `rgba(241, 196, 15, ${alpha * 0.8})`;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${db.levelUpLevel} 关通过!`, SCREEN_WIDTH / 2, cy);
  }

  renderTutorial(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cx = SCREEN_WIDTH / 2;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('如何玩', cx, SCREEN_HEIGHT * 0.12);

    const steps = [
      { icon: '👆', text: '左右滑动移动小车', y: SCREEN_HEIGHT * 0.28 },
      { icon: '🟦', text: '接住同色方块合并得分', y: SCREEN_HEIGHT * 0.42 },
      { icon: '⚖️',  text: '保持塔的平衡!', y: SCREEN_HEIGHT * 0.56 },
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
