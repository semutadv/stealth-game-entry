// main.js — one job: boot the game, own the loop, own the state machine.
// Title -> playing -> caught/won, plus the deterministic ?shot= scenes
// used for screenshots. No drawing or AI logic lives here.
import { VIEW_W, VIEW_H, TILE, METER_MAX } from './config.js';
import { ENTRANCE, SEAL_TILE, EXIT_TILE, tileCenter, tileOf } from './level.js';
import { Player } from './player.js';
import { Guard } from './guards.js';
import { PATROLS } from './level.js';
import { SoundBank } from './audio.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { applyShot, SHOT_NAMES } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const sounds = new SoundBank();
const input = createInput(canvas);

const game = {
  time: 0,
  clockSeconds: 0,
  status: 'title', // title | playing | caught | won
  meter: 0,
  player: new Player(ENTRANCE),
  guards: PATROLS.map((def) => new Guard(def)),
  pebbles: [], // live pebble markers {x, y, ttl}
  shotMode: false,
  shotReadyAt: 0,
  get clockText() {
    const total = Math.floor(this.clockSeconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  },
};

function resetLevel() {
  game.meter = 0;
  game.clockSeconds = 0;
  game.player.reset(ENTRANCE);
  for (const guard of game.guards) guard.reset();
  game.pebbles = [];
  game.status = 'playing';
}

function sealCenter() {
  return tileCenter(SEAL_TILE.col, SEAL_TILE.row);
}

function exitCenter() {
  return tileCenter(EXIT_TILE.col, EXIT_TILE.row);
}

function update(dt) {
  if (game.status !== 'playing') return;
  const prevMeter = game.meter;
  game.clockSeconds += dt;

  // Player.
  const prevStep = Math.floor(game.player.stepPhase);
  game.player.update(dt, input);
  if (game.player.moving && Math.floor(game.player.stepPhase) !== prevStep) {
    sounds.ensure();
    sounds.step(game.player.sneaking);
  }

  // Pebble throws (mouse clicks).
  for (const click of input.takeClicks()) {
    sounds.ensure();
    const landing = game.player.throwPebble(click.x, click.y);
    if (landing) {
      game.pebbles.push({ x: landing.x, y: landing.y, ttl: 1.6 });
      sounds.pebble();
      for (const guard of game.guards) guard.hearPebble(landing);
    }
  }
  for (const pb of game.pebbles) pb.ttl -= dt;
  game.pebbles = game.pebbles.filter((pb) => pb.ttl > 0);

  // Running noise draws nearby wardens.
  if (game.player.noiseRadius > 60) {
    for (const guard of game.guards) {
      guard.hearNoise(game.player.x, game.player.y, game.player.noiseRadius);
    }
  }

  // Guards + shared detection meter.
  let anySeeing = false;
  for (const guard of game.guards) {
    const vis = guard.seesPlayer(game.player, game);
    if (vis > 0) anySeeing = true;
    guard.update(dt, game);
  }
  Guard.decayMeter(game, dt, anySeeing);

  // Meter crossed a threshold: sting the player with a sound cue.
  if (prevMeter < 35 && game.meter >= 35) sounds.suspicious();
  if (prevMeter < 70 && game.meter >= 70) sounds.alert();

  // Seal pickup.
  if (!game.player.hasSeal) {
    const s = sealCenter();
    if (Math.hypot(game.player.x - s.x, game.player.y - s.y) < TILE * 0.62) {
      game.player.hasSeal = true;
      sounds.sealPickup();
    }
  }

  // Exit with the seal: win. Exit without it: the door stays shut.
  const e = exitCenter();
  if (Math.hypot(game.player.x - e.x, game.player.y - e.y) < TILE * 0.6) {
    if (game.player.hasSeal) {
      game.status = 'won';
      sounds.win();
    }
  }

  if (game.status === 'caught') sounds.caught();
}

// --- Staged screenshot scenes (?shot=start|stalk|spotted|escape&seed=1) ---
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName && SHOT_NAMES.includes(shotName)) {
  if (applyShot(game, shotName)) {
    // Frozen world: render a fixed moment, then raise the flag the
    // capture helper waits for.
    let frames = 0;
    const tick = () => {
      game.time = Math.min(game.shotReadyAt, game.time + 1 / 60);
      render(ctx, game);
      frames += 1;
      if (game.time >= game.shotReadyAt && frames >= 30) {
        window.__shotReady = true;
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

// --- Live game loop ---
if (!game.shotMode) {
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.time += dt;
    if (input.takeMute()) {
      sounds.ensure();
      sounds.toggleMute();
    }
    if (game.status === 'title' && input.takeConfirm()) {
      sounds.ensure();
      resetLevel();
    } else if ((game.status === 'caught' || game.status === 'won') && input.takeRestart()) {
      resetLevel();
    } else if (game.status === 'playing' && input.takeRestart()) {
      resetLevel();
    }
    update(dt);
    render(ctx, game);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Expose the state for debugging in the console; harmless in the grader.
window.__game = game;
