// guards.js — one job: the wardens. Patrols, vision cones, the staged
// detection meter (calm -> suspicious -> alert -> caught), and how a
// guard loses you and goes back to its rounds.
import {
  TILE, CONE_RANGE, CONE_HALF_ANGLE, CONE_RANGE_SNEAK,
  METER_GAIN_BASE, METER_DECAY, SNEAK_GAIN, SHADOW_GAIN, RUN_GAIN,
  SHADOW_HIDE_DIST, SUSPICIOUS_AT, ALERT_AT, METER_MAX,
  GUARD_PATROL_SPEED, GUARD_INVESTIGATE_SPEED, GUARD_TURN_SPEED,
  PEBBLE_NOISE_RADIUS,
} from './config.js';
import { tileCenter, tileOf, isShadow, hasLineOfSight, moveCircle } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.color = def.color;
    this.waypoints = def.waypoints.map((w) => tileCenter(w.col, w.row));
    this.pauseAtWaypoint = def.pauseAtWaypoint;
    this.wpIndex = 0;
    this.wpForward = true;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.facing = def.startFacing;
    this.state = 'patrol'; // patrol | suspicious | investigate | return
    this.pauseTimer = 0;
    this.scanTimer = 0;
    this.scanDir = 1;
    this.target = null; // {x, y} being walked toward while investigating
    this.lastSeen = null; // {x, y, t} of the last confirmed glimpse
    this.suspicion = 0; // per-guard 0..1, drives the cone colour
    this.radius = 14;
  }

  reset() {
    this.wpIndex = 0;
    this.wpForward = true;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.state = 'patrol';
    this.pauseTimer = 0;
    this.scanTimer = 0;
    this.target = null;
    this.lastSeen = null;
    this.suspicion = 0;
  }

  // Can this guard see the player right now? Distance, cone angle,
  // line-of-sight, and whether the player is small, dark, or still.
  seesPlayer(player, game) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const range = player.sneaking ? CONE_RANGE_SNEAK : CONE_RANGE;
    if (dist > range) return 0;
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angle, this.facing)) > CONE_HALF_ANGLE) return 0;
    if (!hasLineOfSight(this.x, this.y, player.x, player.y)) return 0;
    if (player.inShadow && dist > SHADOW_HIDE_DIST) return 0;
    // Visibility 0..1: full up close, fading to a sliver at the cone edge.
    let vis = 1 - dist / range;
    vis = 0.25 + 0.75 * vis;
    if (player.sneaking) vis *= SNEAK_GAIN + 0.65;
    if (player.inShadow) vis *= 0.6;
    if (player.running) vis *= 1.25;
    return Math.min(1, vis);
  }

  hearNoise(nx, ny, radius) {
    if (this.state === 'investigate' || this.state === 'return') return;
    const d = Math.hypot(nx - this.x, ny - this.y);
    if (d <= radius) {
      this.state = 'investigate';
      this.target = { x: nx, y: ny };
    }
  }

  hearPebble(p) {
    this.hearNoise(p.x, p.y, PEBBLE_NOISE_RADIUS);
  }

  update(dt, game) {
    const player = game.player;
    const vis = this.seesPlayer(player, game);
    const meter = game.meter;

    if (vis > 0) {
      // Seen: the meter climbs, faster up close and when the player is loud.
      let gain = METER_GAIN_BASE * vis;
      if (player.sneaking) gain *= SNEAK_GAIN;
      if (player.inShadow) gain *= SHADOW_GAIN;
      if (player.running) gain *= RUN_GAIN;
      game.meter = Math.min(METER_MAX, meter + gain * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.suspicion = Math.min(1, this.suspicion + dt * 1.4);
      if (game.meter >= ALERT_AT) {
        this.state = 'investigate';
        this.target = { x: player.x, y: player.y };
      } else if (game.meter >= SUSPICIOUS_AT && this.state === 'patrol') {
        this.state = 'suspicious';
        this.scanTimer = 1.6;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * 0.5);
    }

    switch (this.state) {
      case 'patrol': this.updatePatrol(dt); break;
      case 'suspicious': this.updateSuspicious(dt, player); break;
      case 'investigate': this.updateInvestigate(dt, game); break;
      case 'return': this.updateReturn(dt); break;
      default: break;
    }
  }

  updatePatrol(dt) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      // Idle scan: slow sweep left and right at the waypoint.
      this.facing += Math.sin(this.pauseTimer * 2.2) * 0.35 * dt;
      return;
    }
    const target = this.waypoints[this.wpIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      this.pauseTimer = this.pauseAtWaypoint;
      if (this.wpForward) {
        this.wpIndex += 1;
        if (this.wpIndex >= this.waypoints.length) {
          this.wpIndex = this.waypoints.length - 2;
          this.wpForward = false;
        }
      } else {
        this.wpIndex -= 1;
        if (this.wpIndex < 0) {
          this.wpIndex = 1;
          this.wpForward = true;
        }
      }
      return;
    }
    const step = GUARD_PATROL_SPEED * dt;
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.facing = Math.atan2(dy, dx);
    const moved = moveCircle(this.x, this.y, this.radius, nx - this.x, ny - this.y);
    this.x = moved.x;
    this.y = moved.y;
  }

  updateSuspicious(dt, player) {
    // Stop, turn toward the glimpse, scan. If the player stays visible
    // the meter keeps climbing; if not, the guard shrugs it off.
    const want = Math.atan2(player.y - this.y, player.x - this.x);
    this.facing += Math.max(-GUARD_TURN_SPEED * dt,
      Math.min(GUARD_TURN_SPEED * dt, angleDiff(want, this.facing)));
    this.scanTimer -= dt;
    if (this.scanTimer <= 0) {
      this.state = 'patrol';
    }
  }

  updateInvestigate(dt, game) {
    if (!this.target) {
      this.state = 'return';
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      // Arrived, found nothing: look around, then walk back to the rounds.
      this.scanTimer += dt;
      this.facing += Math.sin(this.scanTimer * 2.4) * 0.8 * dt;
      if (this.scanTimer > 2.2) {
        this.scanTimer = 0;
        this.target = null;
        this.state = 'return';
      }
      return;
    }
    const step = GUARD_INVESTIGATE_SPEED * dt;
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.facing = Math.atan2(dy, dx);
    const moved = moveCircle(this.x, this.y, this.radius, nx - this.x, ny - this.y);
    this.x = moved.x;
    this.y = moved.y;
  }

  updateReturn(dt) {
    // Walk back to the nearest waypoint, then resume the patrol.
    let best = this.waypoints[0];
    let bestD = Infinity;
    for (const w of this.waypoints) {
      const d = Math.hypot(w.x - this.x, w.y - this.y);
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    const dx = best.x - this.x;
    const dy = best.y - this.y;
    if (bestD < 6) {
      this.wpIndex = this.waypoints.indexOf(best);
      this.state = 'patrol';
      return;
    }
    const step = GUARD_PATROL_SPEED * dt;
    const nx = this.x + (dx / bestD) * step;
    const ny = this.y + (dy / bestD) * step;
    this.facing = Math.atan2(dy, dx);
    const moved = moveCircle(this.x, this.y, this.radius, nx - this.x, ny - this.y);
    this.x = moved.x;
    this.y = moved.y;
  }

  // Decay the shared meter once per frame — called from the game loop,
  // not per guard, so four guards do not decay it four times as fast.
  static decayMeter(game, dt, anySeeing) {
    if (!anySeeing) {
      game.meter = Math.max(0, game.meter - METER_DECAY * dt);
    }
    if (game.meter >= METER_MAX) game.status = 'caught';
  }
}
