// config.js — one clear job: every tunable number, colour and layout slot of
// Ember Kitchen Rush. The playfield is a fixed 1280x720 logical area; the
// renderer scales it to the window, so no rule below depends on screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One work shift lasts this long; when the timer hits zero the shift ends. */
export const SHIFT_SECONDS = 150;

/** Hearts: an order that expires costs one. At zero hearts the shift ends early. */
export const HEARTS = 3;

/** Orders: at most this many tickets on the board at once. */
export const MAX_ORDERS = 3;

/** First order arrives after this many seconds; later gaps shrink as the shift goes on. */
export const SPAWN = { first: 2.5, start: 9, min: 5, shrinkPerSecond: 0.02 };

/** An order's patience in seconds: starts here, shrinks as the shift goes on. */
export const PATIENCE = { start: 45, min: 28, shrinkPerSecond: 0.05 };

/** A cooked dish waits on the plate this long before it goes cold and is lost. */
export const PLATE_SPOIL_SECONDS = 10;

/** Combo bonus coins per combo level on top of the dish reward. */
export const COMBO_BONUS = 2;

/** Where the best coins total is kept between visits (this browser only). */
export const BEST_KEY = 'ember-kitchen.best';

/** The six ingredient bins on the counter, in counter order. */
export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', key: '1', colour: '#f5efe0', dark: '#d9cfae' },
  { id: 'noodle', name: 'Noodle', key: '2', colour: '#f2c14e', dark: '#c98f1f' },
  { id: 'egg', name: 'Egg', key: '3', colour: '#fff6d8', dark: '#e8b64c' },
  { id: 'chicken', name: 'Chicken', key: '4', colour: '#e8a06a', dark: '#b06a2e' },
  { id: 'chilli', name: 'Chilli', key: '5', colour: '#e5493a', dark: '#a92a20' },
  { id: 'greens', name: 'Greens', key: '6', colour: '#58b368', dark: '#2f7d3d' },
];

/** Clickable rectangles, in logical 1280x720 coordinates. */
export const LAYOUT = {
  // Six bins across the counter.
  bins: { x: 24, y: 232, w: 190, h: 118, gap: 12 },
  // The wok and stove, centre-left below the counter.
  wok: { x: 300, y: 392, w: 320, h: 220 },
  // The pass: the plate a finished dish waits on, centre-right.
  plate: { x: 700, y: 392, w: 280, h: 220 },
  // The trash can that clears the wok.
  trash: { x: 1060, y: 420, w: 196, h: 192 },
  // Order tickets on the board.
  tickets: { x: 24, y: 78, w: 300, h: 112, gap: 24 },
  // The specials board listing every recipe, top right.
  specials: { x: 1000, y: 78, w: 256, h: 112 },
  pause: { x: 1212, y: 12, w: 56, h: 40 },
};

export const PALETTE = {
  wall: '#3a2a22',
  wallTile: '#433129',
  floor: '#241812',
  counter: '#8a5a33',
  counterTop: '#a9743f',
  counterEdge: '#6e4525',
  board: '#2b1d16',
  boardFrame: '#c98f4e',
  ticket: '#f7ead0',
  ticketInk: '#3a2a22',
  stove: '#1f1a18',
  steel: '#9aa3ad',
  steelDark: '#6b7280',
  wok: '#2b2b30',
  plate: '#f4f1e6',
  text: '#f7ead0',
  muted: '#c9a98a',
  gold: '#f2c14e',
  red: '#e5493a',
  green: '#58b368',
  heart: '#ef5d7a',
  timerLow: '#e5493a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
