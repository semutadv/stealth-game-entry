// level.js — one job: the archive itself. Map data, tile queries,
// line-of-sight, and the fixed set dressing (lanterns, patrol routes).
// Legend: # wall/shelf (blocks walk + sight)  . floor  S shadow pool
//         E entrance  G Ember Seal  X exit door
import { TILE, ORIGIN_X, ORIGIN_Y } from './config.js';

export const MAP = [
  '##########################',
  '#E......#......#........X#',
  '#.......#......#.........#',
  '#.###...#..##..#...###...#',
  '#.#.....#..##..#.....#...#',
  '#.#.S...#......#...S.#...#',
  '#.#.....#..##..#.....#...#',
  '#...##.........###.......#',
  '#...##..#..G.......##....#',
  '#...##.........###.......#',
  '#.#.....#..##..#.....#...#',
  '#.#.S...#......#...S.#...#',
  '#.#.....#..##..#.....#...#',
  '#.###...#..##..#...###...#',
  '##########################',
];

export const COLS = MAP[0].length;
export const ROWS = MAP.length;

export function tileAt(col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return '#';
  return MAP[row][col];
}

export function isWall(col, row) {
  return tileAt(col, row) === '#';
}

export function isShadow(col, row) {
  return tileAt(col, row) === 'S';
}

// Pixel centre of a tile, in canvas coordinates.
export function tileCenter(col, row) {
  return { x: ORIGIN_X + col * TILE + TILE / 2, y: ORIGIN_Y + row * TILE + TILE / 2 };
}

export function tileOf(x, y) {
  return {
    col: Math.floor((x - ORIGIN_X) / TILE),
    row: Math.floor((y - ORIGIN_Y) / TILE),
  };
}

// True when the straight segment between two points crosses no wall tile.
// Samples along the segment; cheap and exact enough at tile scale.
export function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const { col, row } = tileOf(x0 + dx * t, y0 + dy * t);
    if (isWall(col, row)) return false;
  }
  return true;
}

// Circle (player/guard body) against wall tiles, axis separated so the
// body slides along shelves instead of sticking on corners.
export function moveCircle(x, y, radius, dx, dy) {
  let nx = x + dx;
  let ny = y + dy;
  const hitsWall = (px, py) => {
    const corners = [
      [px - radius, py - radius], [px + radius, py - radius],
      [px - radius, py + radius], [px + radius, py + radius],
    ];
    return corners.some(([cx, cy]) => {
      const { col, row } = tileOf(cx, cy);
      return isWall(col, row);
    });
  };
  if (hitsWall(nx, y)) nx = x;
  if (hitsWall(nx, ny)) ny = y;
  return { x: nx, y: ny };
}

export function findTile(ch) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (MAP[row][col] === ch) return { col, row };
    }
  }
  return null;
}

export const ENTRANCE = findTile('E');
export const SEAL_TILE = findTile('G');
export const EXIT_TILE = findTile('X');

// Lanterns: fixed warm light pools. Pure dressing, never gameplay.
export const LANTERNS = [
  { col: 3, row: 1 }, { col: 12, row: 1 }, { col: 20, row: 2 },
  { col: 1, row: 7 }, { col: 13, row: 7 }, { col: 23, row: 7 },
  { col: 6, row: 13 }, { col: 12, row: 13 }, { col: 21, row: 13 },
];

// Patrol routes: two lanes each, so every guard's pattern can be learned.
// Waypoints are tile coords; guards walk straight lines between them.
export const PATROLS = [
  {
    name: 'Bram', color: '#c94f43',
    waypoints: [{ col: 6, row: 2 }, { col: 6, row: 12 }],
    startFacing: Math.PI / 2, pauseAtWaypoint: 1.4,
  },
  {
    name: 'Cedd', color: '#c98a43',
    waypoints: [{ col: 13, row: 2 }, { col: 13, row: 12 }],
    startFacing: Math.PI / 2, pauseAtWaypoint: 1.1,
  },
  {
    name: 'Dain', color: '#a843c9',
    waypoints: [{ col: 18, row: 7 }, { col: 24, row: 7 }],
    startFacing: 0, pauseAtWaypoint: 1.6,
  },
  {
    name: 'Fen', color: '#4386c9',
    waypoints: [{ col: 22, row: 2 }, { col: 22, row: 12 }],
    startFacing: Math.PI / 2, pauseAtWaypoint: 1.2,
  },
];

// Deterministic pseudo-random from integer coords — stable book-spine
// colours and floor shading with no Math.random anywhere in the game.
export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >> 16)) >>> 0;
  return h / 4294967295;
}
