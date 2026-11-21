// render.js — one job: draw the whole archive on the canvas. Pure
// presentation: it reads game state and never changes it.
import {
  TILE, VIEW_W, VIEW_H, ORIGIN_X, ORIGIN_Y,
  CONE_RANGE, CONE_HALF_ANGLE, COLORS,
} from './config.js';
import {
  MAP, COLS, ROWS, tileCenter, tileOf, isShadow, LANTERNS,
  SEAL_TILE, EXIT_TILE, hash2,
} from './level.js';

const BOOK_COLORS = [COLORS.bookA, COLORS.bookB, COLORS.bookC, COLORS.bookD];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, time) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const x = ORIGIN_X + col * TILE;
      const y = ORIGIN_Y + row * TILE;
      const h = hash2(col, row);
      ctx.fillStyle = h > 0.5 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      // Plank seams, offset per row so the floor reads as old wood.
      ctx.strokeStyle = COLORS.floorLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + TILE - 0.5);
      ctx.lineTo(x + TILE, y + TILE - 0.5);
      ctx.stroke();
      if (h > 0.86) {
        // A worn knot in the boards.
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + TILE * 0.6, y + TILE * 0.5, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      void time;
    }
  }
}

function drawShelves(ctx) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (MAP[row][col] !== '#') continue;
      const x = ORIGIN_X + col * TILE;
      const y = ORIGIN_Y + row * TILE;
      const edge = row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1;
      ctx.fillStyle = edge ? COLORS.wallSide : COLORS.shelfWood;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = COLORS.wallTop;
      ctx.fillRect(x + 2, y + 2, TILE - 4, 5);
      if (!edge) {
        // Book spines: two rows of deterministic colours.
        for (let shelf = 0; shelf < 2; shelf += 1) {
          const sy = y + 12 + shelf * 18;
          let bx = x + 6;
          while (bx < x + TILE - 8) {
            const w = 4 + Math.floor(hash2(col * 7 + shelf, row * 3 + bx) * 5);
            ctx.fillStyle = BOOK_COLORS[Math.floor(hash2(bx, col + row) * BOOK_COLORS.length)];
            ctx.fillRect(bx, sy, w - 1, 13);
            bx += w;
          }
        }
      }
    }
  }
}

function drawShadowPools(ctx, time) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (!isShadow(col, row)) continue;
      const x = ORIGIN_X + col * TILE;
      const y = ORIGIN_Y + row * TILE;
      const pulse = 0.36 + Math.sin(time * 1.4 + col) * 0.05;
      ctx.fillStyle = `rgba(38, 68, 120, ${pulse})`;
      ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      ctx.strokeStyle = COLORS.shadowEdge;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
      ctx.setLineDash([]);
    }
  }
}

function drawLanterns(ctx, time) {
  for (const L of LANTERNS) {
    const c = tileCenter(L.col, L.row);
    const flicker = 0.13 + Math.sin(time * 3.1 + L.col * 1.7) * 0.03 + Math.sin(time * 7.3) * 0.015;
    const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, 90);
    g.addColorStop(0, `rgba(255, 190, 100, ${flicker + 0.1})`);
    g.addColorStop(1, 'rgba(255, 180, 90, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(c.x - 90, c.y - 90, 180, 180);
    ctx.fillStyle = '#3a2a12';
    ctx.fillRect(c.x - 2, c.y - 16, 4, 16);
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(c.x, c.y - 4, 6 + Math.sin(time * 5 + L.row) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSeal(ctx, game, time) {
  if (game.player.hasSeal) return;
  const c = tileCenter(SEAL_TILE.col, SEAL_TILE.row);
  const pulse = 1 + Math.sin(time * 2.6) * 0.12;
  const g = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 70 * pulse);
  g.addColorStop(0, 'rgba(255, 182, 46, 0.5)');
  g.addColorStop(1, 'rgba(255, 182, 46, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(c.x - 70, c.y - 70, 140, 140);
  // Ember Seal: a small wax seal with a flame mark.
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#c22e1f';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.seal;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(6, -1, 3, 5);
  ctx.quadraticCurveTo(0, 8, -3, 5);
  ctx.quadraticCurveTo(-6, -1, 0, -8);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.seal;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBER SEAL', c.x, c.y + 30);
}

function drawExit(ctx, game, time) {
  const c = tileCenter(EXIT_TILE.col, EXIT_TILE.row);
  const open = game.player.hasSeal;
  const glow = open ? 0.5 + Math.sin(time * 3) * 0.12 : 0.22;
  const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, 64);
  g.addColorStop(0, `rgba(120, 255, 170, ${glow})`);
  g.addColorStop(1, 'rgba(120, 255, 170, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(c.x - 64, c.y - 64, 128, 128);
  // Arched door in the east wall.
  ctx.fillStyle = open ? '#1d5c38' : '#274a35';
  ctx.beginPath();
  ctx.moveTo(c.x - 15, c.y + 20);
  ctx.lineTo(c.x - 15, c.y - 4);
  ctx.arc(c.x, c.y - 4, 15, Math.PI, 0);
  ctx.lineTo(c.x + 15, c.y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = open ? '#8affb8' : '#4d7a5e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = open ? '#c9ffe0' : '#7fb894';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — OPEN' : 'EXIT', c.x, c.y + 34);
}

function drawCone(ctx, guard, game) {
  const range = CONE_RANGE;
  const suspicious = guard.suspicion > 0.25 || guard.state !== 'patrol';
  const grad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, range);
  const base = suspicious ? COLORS.coneSuspicious : COLORS.cone;
  grad.addColorStop(0, base);
  grad.addColorStop(1, 'rgba(255, 190, 80, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - CONE_HALF_ANGLE, guard.facing + CONE_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
  // Cone edges, so the danger reads even when the screenshot is shrunk.
  ctx.strokeStyle = suspicious ? 'rgba(255, 120, 50, 0.7)' : COLORS.coneEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing - CONE_HALF_ANGLE) * range,
    guard.y + Math.sin(guard.facing - CONE_HALF_ANGLE) * range);
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing + CONE_HALF_ANGLE) * range,
    guard.y + Math.sin(guard.facing + CONE_HALF_ANGLE) * range);
  ctx.stroke();
  void game;
}

function drawGuard(ctx, guard, time) {
  drawCone(ctx, guard);
  // Robed warden: dark robe, hood, a lantern dot at the chest.
  const bob = Math.sin(time * 2 + guard.x * 0.01) * 1.2;
  ctx.save();
  ctx.translate(guard.x, guard.y + bob);
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.moveTo(-13, 4);
  ctx.lineTo(13, 4);
  ctx.lineTo(9, 15);
  ctx.lineTo(-9, 15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.arc(Math.cos(guard.facing) * 5, Math.sin(guard.facing) * 5, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.facing) * 11, Math.sin(guard.facing) * 11, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Name + state word, small but legible.
  ctx.fillStyle = 'rgba(242, 230, 201, 0.9)';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const label = guard.state === 'patrol' ? guard.name
    : guard.state === 'suspicious' ? `${guard.name} — ?`
    : guard.state === 'investigate' ? `${guard.name} — !` : guard.name;
  // Labels near the top go below the guard so the HUD never covers them.
  ctx.fillText(label, guard.x, guard.y - 20 < 66 ? guard.y + 34 : guard.y - 20);
}

function drawPlayer(ctx, game, time) {
  const p = game.player;
  const bob = p.moving ? Math.sin(p.stepPhase * Math.PI * 2) * 1.6 : Math.sin(time * 1.8) * 0.8;
  // Her own small lantern light.
  const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.sneaking ? 55 : 80);
  g.addColorStop(0, 'rgba(90, 220, 200, 0.14)');
  g.addColorStop(1, 'rgba(90, 220, 200, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(p.x - 80, p.y - 80, 160, 160);
  // Running noise ring.
  if (p.noisePulse > 0) {
    ctx.strokeStyle = `rgba(255, 220, 120, ${p.noisePulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20 + (1 - p.noisePulse) * 60, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.fillStyle = p.sneaking ? COLORS.playerDark : COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  // Hood point toward the facing direction.
  ctx.beginPath();
  ctx.moveTo(Math.cos(p.facing) * 13, Math.sin(p.facing) * 13);
  ctx.lineTo(Math.cos(p.facing + 2.5) * 9, Math.sin(p.facing + 2.5) * 9);
  ctx.lineTo(Math.cos(p.facing - 2.5) * 9, Math.sin(p.facing - 2.5) * 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0e2a26';
  ctx.beginPath();
  ctx.arc(Math.cos(p.facing) * 4, Math.sin(p.facing) * 4, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (p.hasSeal) {
    ctx.fillStyle = COLORS.seal;
    ctx.beginPath();
    ctx.arc(p.x + 12, p.y - 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(242, 230, 201, 0.95)';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.sneaking ? 'Wren — sneaking' : 'Wren', p.x, p.y - 20 < 66 ? p.y + 34 : p.y - 20);
}

function drawPebbles(ctx, game) {
  for (const pb of game.pebbles) {
    ctx.strokeStyle = 'rgba(255, 220, 120, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pb.x, pb.y, 6 + Math.sin(game.time * 6) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#d8cdb2';
    ctx.beginPath();
    ctx.arc(pb.x, pb.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawHud(ctx, game) {
  const p = game.player;
  ctx.fillStyle = COLORS.hudBg;
  roundRect(ctx, 8, 8, 1264, 46, 8);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  const objective = p.hasSeal
    ? 'Objective: reach the EXIT — unseen'
    : 'Objective: take the Ember Seal, then reach the EXIT';
  ctx.fillText(objective, 22, 32);
  // Detection eye: an eye outline that fills amber as the meter climbs.
  const ex = 640;
  const ey = 31;
  ctx.strokeStyle = game.meter >= 70 ? '#ff7a4d' : COLORS.hudText;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex - 22, ey);
  ctx.quadraticCurveTo(ex, ey - 13, ex + 22, ey);
  ctx.quadraticCurveTo(ex, ey + 13, ex - 22, ey);
  ctx.stroke();
  ctx.fillStyle = game.meter >= 70 ? '#ff7a4d' : game.meter >= 35 ? '#ffb62e' : COLORS.hudDim;
  ctx.beginPath();
  ctx.arc(ex, ey, 4 + (game.meter / 100) * 4, 0, Math.PI * 2);
  ctx.fill();
  // Meter bar next to the eye.
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, ex + 30, ey - 6, 130, 12, 6);
  ctx.fill();
  const mw = (game.meter / 100) * 130;
  ctx.fillStyle = game.meter >= 70 ? '#ff5a3c' : game.meter >= 35 ? '#ffb62e' : '#3fd2c0';
  if (mw > 0) {
    roundRect(ctx, ex + 30, ey - 6, mw, 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(game.meter >= 70 ? 'HUNTED' : game.meter >= 35 ? 'SUSPICIOUS' : 'UNSEEN', ex + 168, ey + 1);
  // Right side: seal, pebbles, timer.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 14px system-ui, sans-serif';
  const sealText = p.hasSeal ? 'Seal: HELD' : 'Seal: —';
  ctx.fillText(`${sealText}   Pebbles: ${p.pebbles}   ${game.clockText}`, 1258, 32);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // Bottom hint bar.
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('WASD move · Shift sneak · Space run · Click throw a pebble · R restart · M mute', 22, VIEW_H - 12);
  if (p.inShadow) {
    ctx.fillStyle = '#9db8ff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('Hidden in shadow — the wardens cannot see you from afar', 22, VIEW_H - 30);
  }
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(8, 6, 4, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('THE LANTERN ARCHIVE', VIEW_W / 2, 250);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Wren, archivist of the night, must steal the Ember Seal', VIEW_W / 2, 300);
  ctx.fillText('and slip out the east door — without ever being seen.', VIEW_W / 2, 330);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText('WASD move · Shift sneak · Space run · Click throws a pebble to distract a warden', VIEW_W / 2, 390);
  ctx.fillText('Blue pools are shadow — hide in them. Amber cones are a warden’s sight.', VIEW_W / 2, 416);
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(game.shotMode ? 'Staged scene — press Enter to play' : 'Press Enter to begin', VIEW_W / 2, 480);
  ctx.textAlign = 'left';
}

function drawCaught(ctx) {
  ctx.fillStyle = 'rgba(40, 4, 2, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6a4d';
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText('SPOTTED', VIEW_W / 2, 320);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('The archive wakes. The wardens close in. The night resets.', VIEW_W / 2, 368);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText('Press R to try the same night again', VIEW_W / 2, 420);
  ctx.textAlign = 'left';
}

function drawWon(ctx, game) {
  ctx.fillStyle = 'rgba(4, 24, 12, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8affb8';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('UNSEEN', VIEW_W / 2, 300);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('The Ember Seal is yours. No warden ever knew you were there.', VIEW_W / 2, 350);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText(`Finished in ${game.clockText} — press R to run the night again`, VIEW_W / 2, 400);
  ctx.textAlign = 'left';
}

export function render(ctx, game) {
  const time = game.time;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#14100a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, time);
  drawShelves(ctx);
  drawShadowPools(ctx, time);
  drawLanterns(ctx, time);
  drawSeal(ctx, game, time);
  drawExit(ctx, game, time);
  for (const guard of game.guards) drawGuard(ctx, guard, time);
  drawPebbles(ctx, game);
  drawPlayer(ctx, game, time);
  drawVignette(ctx);
  drawHud(ctx, game);
  if (game.status === 'title') drawTitle(ctx, game);
  else if (game.status === 'caught') drawCaught(ctx);
  else if (game.status === 'won') drawWon(ctx, game);
}
