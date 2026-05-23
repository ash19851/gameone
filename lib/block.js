import { BLOCK_TYPES, BLOCK_HEIGHT, BLOCK_BORDER_RADIUS } from './lib/config';

export default class Block {
  constructor(type, x, y, width) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = BLOCK_HEIGHT;
    this.vy = 0;
    this.vx = 0;
    this.settled = false;
    this.wasMerged = false;
    this.fuseTimer = 0;
    this.magnetPulled = false;
  }

  get left()   { return this.x - this.width / 2; }
  get right()  { return this.x + this.width / 2; }
  get top()    { return this.y - this.height / 2; }
  get bottom() { return this.y + this.height / 2; }

  static getTypeConfig(type) {
    return BLOCK_TYPES[type];
  }

  static isSpecial(type)  { return type >= 6; }
  static isUniversal(type) { return type === 6; }
  static isMagnet(type)    { return type === 7; }
  static isBomb(type)      { return type === 8; }
  static canMerge(type)    { return type < 6 || type === 6; }

  static render(ctx, block) {
    const t = BLOCK_TYPES[block.type];
    const { x, y, width, height } = block;
    const r = BLOCK_BORDER_RADIUS;
    const left = x - width / 2;
    const top = y - height / 2;

    // Main body
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.moveTo(left + r, top);
    ctx.lineTo(left + width - r, top);
    ctx.quadraticCurveTo(left + width, top, left + width, top + r);
    ctx.lineTo(left + width, top + height - r);
    ctx.quadraticCurveTo(left + width, top + height, left + width - r, top + height);
    ctx.lineTo(left + r, top + height);
    ctx.quadraticCurveTo(left, top + height, left, top + height - r);
    ctx.lineTo(left, top + r);
    ctx.quadraticCurveTo(left, top, left + r, top);
    ctx.closePath();
    ctx.fill();

    // Top highlight
    ctx.fillStyle = t.lighter;
    ctx.beginPath();
    ctx.moveTo(left + r, top);
    ctx.lineTo(left + width - r, top);
    ctx.quadraticCurveTo(left + width, top, left + width, top + r);
    ctx.lineTo(left + width, top + 6);
    ctx.lineTo(left, top + 6);
    ctx.lineTo(left, top + r);
    ctx.quadraticCurveTo(left, top, left + r, top);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = t.darker;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Special block visuals
    if (t.special === 'bomb' && block.fuseTimer > 0) {
      const urgency = 1 - block.fuseTimer / 1.0;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / (80 - urgency * 60));
      ctx.fillStyle = `rgba(255, 50, 50, ${pulse * 0.35})`;
      ctx.beginPath();
      ctx.moveTo(left + r, top);
      ctx.lineTo(left + width - r, top);
      ctx.quadraticCurveTo(left + width, top, left + width, top + r);
      ctx.lineTo(left + width, top + height - r);
      ctx.quadraticCurveTo(left + width, top + height, left + width - r, top + height);
      ctx.lineTo(left + r, top + height);
      ctx.quadraticCurveTo(left, top + height, left, top + height - r);
      ctx.lineTo(left, top + r);
      ctx.quadraticCurveTo(left, top, left + r, top);
      ctx.closePath();
      ctx.fill();
    }

    if (t.icon) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.fillText(t.icon, x, y);
      ctx.shadowBlur = 0;
    }
  }
}
