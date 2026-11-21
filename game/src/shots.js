// shots.js — one job: the four staged, deterministic screenshot scenes.
// Each scene sets exact positions, facing, meter and status, then freezes
// the world (no patrol drift) so the render is reproducible. Called once
// from main.js when the URL carries ?shot=<name>.
import { tileCenter } from './level.js';

// Place a guard at a tile with an exact facing, frozen mid-patrol.
function placeGuard(guard, col, row, facing, state = 'patrol', suspicion = 0) {
  const c = tileCenter(col, row);
  guard.x = c.x;
  guard.y = c.y;
  guard.facing = facing;
  guard.state = state;
  guard.suspicion = suspicion;
  guard.pauseTimer = 99; // frozen: no patrol drift during the shot
  guard.target = null;
  guard.lastSeen = null;
}

function placePlayer(player, col, row, facing, sneaking = false) {
  const c = tileCenter(col, row);
  player.x = c.x;
  player.y = c.y;
  player.facing = facing;
  player.sneaking = sneaking;
  player.running = false;
  player.moving = false;
  player.stepPhase = 0;
  player.noisePulse = 0;
}

export const SHOT_NAMES = ['start', 'stalk', 'spotted', 'escape'];

export function applyShot(game, name) {
  const g = game.guards;
  game.shotMode = true;
  game.status = 'playing';
  game.meter = 0;
  game.time = 0;
  game.player.hasSeal = false;
  game.player.pebbles = 3;
  game.pebbles = [];

  if (name === 'start') {
    // Cover: the whole archive at a glance. Wren at the door, all four
    // wardens mid-round with cones sweeping, seal and exit marked.
    placePlayer(game.player, 1, 1, 0);
    placeGuard(g[0], 6, 5, Math.PI / 2); // Bram, west lane, facing down
    placeGuard(g[1], 13, 4, -Math.PI / 2); // Cedd above the seal, facing up
    placeGuard(g[2], 21, 7, Math.PI); // Dain mid-corridor, facing west
    placeGuard(g[3], 22, 10, Math.PI / 2); // Fen low east, facing down
    game.status = 'playing'; // no title overlay on the cover: the level must be fully visible
    game.shotReadyAt = 0.9;
  } else if (name === 'stalk') {
    // Sneaking behind the west shelves while Bram's cone sweeps past.
    placePlayer(game.player, 3, 6, Math.PI / 2, true);
    placeGuard(g[0], 6, 6, Math.PI, 'patrol', 0); // Bram facing west, cone just past Wren
    placeGuard(g[1], 13, 3, Math.PI / 2);
    placeGuard(g[2], 20, 7, 0);
    placeGuard(g[3], 22, 11, -Math.PI / 2);
    game.meter = 8;
    game.shotReadyAt = 0.9;
  } else if (name === 'spotted') {
    // Almost caught: meter half full, Cedd suspicious and staring,
    // Wren pressed into the east shadow pool.
    placePlayer(game.player, 19, 5, Math.PI, true);
    placeGuard(g[0], 6, 9, Math.PI / 2);
    placeGuard(g[1], 13, 5, 0, 'suspicious', 0.8); // Cedd facing east, toward Wren
    placeGuard(g[2], 18, 7, Math.PI);
    placeGuard(g[3], 22, 4, Math.PI / 2);
    game.meter = 55;
    game.shotReadyAt = 0.9;
  } else if (name === 'escape') {
    // Won: seal held, Wren at the open exit, UNSEEN across the screen.
    placePlayer(game.player, 24, 1, 0);
    game.player.hasSeal = true;
    placeGuard(g[0], 6, 3, -Math.PI / 2);
    placeGuard(g[1], 13, 10, Math.PI / 2);
    placeGuard(g[2], 19, 7, Math.PI);
    placeGuard(g[3], 22, 12, -Math.PI / 2);
    game.status = 'won';
    game.clockSeconds = 187;
    game.shotReadyAt = 0.9;
  } else {
    return false;
  }
  return true;
}
