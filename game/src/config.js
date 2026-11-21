// config.js — one job: every tunable number for The Lantern Archive.
// All values are plain constants so the balance can be read at a glance.
export const TILE = 48;
export const COLS = 26;
export const ROWS = 15;
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const ORIGIN_X = 16; // level is 26*48 = 1248 wide, centred in 1280
export const ORIGIN_Y = 0;

// Player movement (pixels per second).
export const WALK_SPEED = 150;
export const SNEAK_SPEED = 78;
export const RUN_SPEED = 205;

// Detection. The meter runs 0..100; at 100 the archive wakes and you are caught.
export const METER_MAX = 100;
export const SUSPICIOUS_AT = 35; // guard stops, turns, stares
export const ALERT_AT = 70; // guard walks to the last place it saw you
export const METER_GAIN_BASE = 46; // per second, point-blank, walking, in lamplight
export const METER_DECAY = 14; // per second while nobody can see you
export const SNEAK_GAIN = 0.35; // multiplier while sneaking
export const SHADOW_GAIN = 0.22; // multiplier while standing in a shadow tile
export const RUN_GAIN = 1.6; // running is loud AND obvious
export const SHADOW_HIDE_DIST = 95; // inside this range a shadow still cannot hide you

// Vision cones.
export const CONE_RANGE = 185;
export const CONE_HALF_ANGLE = 0.61; // ~35 degrees each side
export const CONE_RANGE_SNEAK = 132; // sneaking shrinks the effective range

// Sound.
export const NOISE_RUN_RADIUS = 230; // running is heard this far
export const PEBBLE_COUNT = 3;
export const PEBBLE_NOISE_RADIUS = 210;
export const PEBBLE_THROW_RANGE = 340;

// Guards.
export const GUARD_PATROL_SPEED = 52;
export const GUARD_INVESTIGATE_SPEED = 96;
export const GUARD_CHASE_SPEED = 132;
export const GUARD_TURN_SPEED = 2.6; // radians per second while scanning

// Palette — lamplit archive: warm floor, cold shadow, amber cones.
export const COLORS = {
  floorA: '#2b2118',
  floorB: '#33281d',
  floorLine: '#1d150e',
  wallTop: '#4a3423',
  wallSide: '#2e2013',
  shelfWood: '#3a2817',
  bookA: '#8a4b2d',
  bookB: '#4f6b4a',
  bookC: '#6b4f8a',
  bookD: '#a8873c',
  shadowFill: 'rgba(38, 68, 120, 0.42)',
  shadowEdge: 'rgba(120, 170, 255, 0.35)',
  cone: 'rgba(255, 190, 80, 0.27)',
  coneEdge: 'rgba(255, 205, 110, 0.55)',
  coneSuspicious: 'rgba(255, 140, 60, 0.38)',
  lanternGlow: 'rgba(255, 180, 90, 0.16)',
  player: '#3fd2c0',
  playerDark: '#1e7a6e',
  guard: '#c94f43',
  guardDark: '#7e2a22',
  seal: '#ffb62e',
  exitGlow: 'rgba(120, 255, 170, 0.30)',
  hudBg: 'rgba(12, 9, 6, 0.78)',
  hudText: '#f2e6c9',
  hudDim: '#b8a888',
};
