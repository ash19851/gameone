import { MAX_PARTICLES, PARTICLE_LIFE, PARTICLE_SPEED, PARTICLE_SIZE } from './lib/config';

class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.color = '#fff';
    this.size = PARTICLE_SIZE;
  }

  init(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = PARTICLE_SPEED * (0.5 + Math.random());
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 150;
    this.life = PARTICLE_LIFE * (0.5 + Math.random() * 0.5);
    this.maxLife = this.life;
    this.color = color;
    this.size = PARTICLE_SIZE * (0.5 + Math.random());
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }
    this.vy += 400 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

export default class ParticleSystem {
  constructor() {
    this.pool = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push(new Particle());
    }
  }

  emit(x, y, color, count = 8) {
    let emitted = 0;
    for (const p of this.pool) {
      if (!p.active) {
        p.init(x, y, color);
        emitted++;
        if (emitted >= count) break;
      }
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (p.active) p.update(dt);
    }
  }

  render(ctx) {
    for (const p of this.pool) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  reset() {
    for (const p of this.pool) p.active = false;
  }
}
