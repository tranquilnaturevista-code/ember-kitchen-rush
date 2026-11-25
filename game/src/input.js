// input.js — one clear job: turn keyboard and pointer into game actions. Clicks
// are reported as logical 1280x720 coordinates (the renderer scales the canvas
// to the window, so this maps client pixels back to game pixels). One-shot
// presses (serve, trash, pause, start) are queued as bit flags and taken once
// by the loop, so a press between two frames is never lost or counted twice.

export const ACTION_SERVE = 1;
export const ACTION_TRASH = 2;
export const ACTION_PAUSE = 4;
export const ACTION_CONFIRM = 8;
export const ACTION_MUTE = 16;

const INGREDIENT_KEYS = new Map([
  ['Digit1', 'rice'],
  ['Digit2', 'noodle'],
  ['Digit3', 'egg'],
  ['Digit4', 'chicken'],
  ['Digit5', 'chilli'],
  ['Digit6', 'greens'],
]);

export function createInput(canvas) {
  let actions = 0;
  let ingredient = null; // ingredient id queued by a 1-6 keypress
  let click = null; // { x, y } in logical coordinates, taken once

  window.addEventListener('keydown', (event) => {
    if (INGREDIENT_KEYS.has(event.code)) {
      if (!event.repeat) ingredient = INGREDIENT_KEYS.get(event.code);
    } else if (event.code === 'Space' || event.code === 'Enter') {
      if (!event.repeat) actions |= ACTION_CONFIRM | ACTION_SERVE;
    } else if (event.code === 'KeyT') {
      if (!event.repeat) actions |= ACTION_TRASH;
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else {
      return;
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    click = { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  });

  return {
    /** The ingredient id queued by a 1-6 keypress since the last call, or null. */
    takeIngredient() {
      const taken = ingredient;
      ingredient = null;
      return taken;
    },
    /** The click point since the last call, in logical coordinates, or null. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
    /** The one-shot action flags since the last call. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}

/** True when the point lies inside the rectangle. */
export function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}
