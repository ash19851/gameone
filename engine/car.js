import { CAR_BASE_WIDTH, CAR_HEIGHT, CAR_Y_RATIO, CAR_COLOR, UPGRADE_CAR_WIDTH_BONUS } from './lib/config';
import { getUpgradeLevel } from './data/storage';

export default class Car {
  constructor() {
    this.baseWidth = CAR_BASE_WIDTH;
    this.height = CAR_HEIGHT;
    this.x = canvas.width / 2;
    this.y = canvas.height * CAR_Y_RATIO;
    this.tilt = 0;
    this.targetX = this.x;
  }

  get width() {
    return this.baseWidth + getUpgradeLevel('carWidth') * UPGRADE_CAR_WIDTH_BONUS;
  }

  get left()   { return this.x - this.width / 2; }
  get right()  { return this.x + this.width / 2; }
  get top()    { return this.y - this.height / 2; }
  get bottom() { return this.y + this.height / 2; }

  setTarget(touchX) {
    this.targetX = touchX;
  }

  update(dt) {
    const dx = this.targetX - this.x;
    const speed = 12;
    this.x += dx * Math.min(speed * dt, 1);

    const halfW = this.width / 2;
    if (this.x - halfW < 0) this.x = halfW;
    if (this.x + halfW > canvas.width) this.x = canvas.width - halfW;
  }

  reset() {
    this.x = canvas.width / 2;
    this.targetX = this.x;
    this.tilt = 0;
  }

  render(ctx) {
    const { x, y, width, height } = this;
    const left = x - width / 2;
    const top = y - height / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(left + 2, top + 3, width, height);

    // Body
    ctx.fillStyle = CAR_COLOR;
    ctx.beginPath();
    ctx.moveTo(left + 6, top);
    ctx.lineTo(left + width - 6, top);
    ctx.quadraticCurveTo(left + width, top, left + width, top + 6);
    ctx.lineTo(left + width, top + height);
    ctx.lineTo(left, top + height);
    ctx.lineTo(left, top + 6);
    ctx.quadraticCurveTo(left, top, left + 6, top);
    ctx.closePath();
    ctx.fill();

    // Top highlight
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(left + 8, top + 3, width - 16, 5);

    // Wheels
    const wheelR = 8;
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(left + 12, top + height + wheelR - 4, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(left + width - 12, top + height + wheelR - 4, wheelR, 0, Math.PI * 2);
    ctx.fill();

    // Wheel hubs
    ctx.fillStyle = '#95A5A6';
    ctx.beginPath();
    ctx.arc(left + 12, top + height + wheelR - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(left + width - 12, top + height + wheelR - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
