import { MAX_FLOAT_TEXTS, FLOAT_TEXT_LIFE, FLOAT_TEXT_RISE_SPEED } from './lib/config';

class FloatText {
  constructor() {
    this.active = false;
    this.text = '';
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.color = '#fff';
    this.fontSize = 16;
  }

  init(text, x, y, color, size) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.vy = -FLOAT_TEXT_RISE_SPEED;
    this.life = FLOAT_TEXT_LIFE;
    this.maxLife = FLOAT_TEXT_LIFE;
    this.color = color || '#fff';
    this.fontSize = size || 16;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }
    this.y += this.vy * dt;
    this.vy *= 0.97;
  }
}

export default class FloatTextSystem {
  constructor() {
    this.pool = [];
    for (let i = 0; i < MAX_FLOAT_TEXTS; i++) {
      this.pool.push(new FloatText());
    }
  }

  emit(text, x, y, color, size) {
    for (const ft of this.pool) {
      if (!ft.active) {
        ft.init(text, x, y, color, size);
        break;
      }
    }
  }

  update(dt) {
    for (const ft of this.pool) {
      if (ft.active) ft.update(dt);
    }
  }

  render(ctx) {
    for (const ft of this.pool) {
      if (!ft.active) continue;
      const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  reset() {
    for (const ft of this.pool) ft.active = false;
  }
}
