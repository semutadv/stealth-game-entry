// player.js — one job: Wren, the night archivist. Movement, sneaking,
// noise, pebbles, the seal, and where she stands in the light or dark.
import {
  TILE, WALK_SPEED, SNEAK_SPEED, RUN_SPEED, NOISE_RUN_RADIUS,
  PEBBLE_COUNT, PEBBLE_THROW_RANGE,
} from './config.js';
import { tileCenter, tileOf, isShadow, moveCircle } from './level.js';

export class Player {
  constructor(spawnTile) {
    const c = tileCenter(spawnTile.col, spawnTile.row);
    this.x = c.x;
    this.y = c.y;
    this.radius = 14;
    this.facing = 0; // radians; 0 = east
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.hasSeal = false;
    this.pebbles = PEBBLE_COUNT;
    this.stepPhase = 0; // drives the walk bob + footstep sounds
    this.noisePulse = 0; // 0..1, fades after a loud step — drawn as a ring
  }

  reset(spawnTile) {
    const c = tileCenter(spawnTile.col, spawnTile.row);
    this.x = c.x;
    this.y = c.y;
    this.facing = 0;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.hasSeal = false;
    this.pebbles = PEBBLE_COUNT;
    this.stepPhase = 0;
    this.noisePulse = 0;
  }

  get inShadow() {
    const { col, row } = tileOf(this.x, this.y);
    return isShadow(col, row);
  }

  // Current noise radius: running is heard far away, sneaking is silent.
  get noiseRadius() {
    if (!this.moving) return 0;
    if (this.sneaking) return 0;
    return this.running ? NOISE_RUN_RADIUS : 42;
  }

  update(dt, input) {
    const v = input.moveVector();
    this.sneaking = input.sneaking && !input.running;
    this.running = input.running && !this.sneaking;
    this.moving = v.x !== 0 || v.y !== 0;
    const speed = this.sneaking ? SNEAK_SPEED : this.running ? RUN_SPEED : WALK_SPEED;
    if (this.moving) {
      this.facing = Math.atan2(v.y, v.x);
      const moved = moveCircle(this.x, this.y, this.radius, v.x * speed * dt, v.y * speed * dt);
      this.x = moved.x;
      this.y = moved.y;
      this.stepPhase += (speed * dt) / 26;
      if (this.running) this.noisePulse = 1;
    }
    this.noisePulse = Math.max(0, this.noisePulse - dt * 2.2);
  }

  // Throw a pebble toward a canvas point. Returns the landing point or null.
  throwPebble(tx, ty) {
    if (this.pebbles <= 0) return null;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 30) return null;
    const range = Math.min(dist, PEBBLE_THROW_RANGE);
    this.pebbles -= 1;
    return { x: this.x + (dx / dist) * range, y: this.y + (dy / dist) * range };
  }
}
