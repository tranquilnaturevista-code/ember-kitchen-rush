// world.js — one clear job: the game's rules and state, with no drawing and no
// browser in it. Orders arrive on the board, ingredients go into the wok, a
// matched recipe cooks, the finished dish waits on the plate, and serving it to
// the matching order before its patience runs out earns coins. step() advances
// one fixed step and returns what happened as bit flags, so the caller can
// react (sounds, announcements) without the world knowing about screens.

import { HEARTS, MAX_ORDERS, PATIENCE, PLATE_SPOIL_SECONDS, SHIFT_SECONDS, SPAWN, COMBO_BONUS } from './config.js';
import { matchRecipe, recipeById, RECIPES } from './recipes.js';

export const EVENT_ADDED = 1;
export const EVENT_COOKING = 2;
export const EVENT_COOKED = 4;
export const EVENT_SERVED = 8;
export const EVENT_ORDER = 16;
export const EVENT_EXPIRED = 32;
export const EVENT_SPOILED = 64;
export const EVENT_OVER = 128;
export const EVENT_TRASHED = 256;

let nextOrderId = 1;

function newOrder(random, elapsed) {
  const dish = RECIPES[Math.floor(random() * RECIPES.length)];
  const patience = Math.max(PATIENCE.min, PATIENCE.start - elapsed * PATIENCE.shrinkPerSecond);
  return { id: nextOrderId++, dishId: dish.id, patience, maxPatience: patience, reward: dish.reward };
}

export function createWorld(random) {
  const state = {
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    orders: [],
    spawnTimer: SPAWN.first,
    wok: { items: [], cooking: false, cookLeft: 0, cookTotal: 0, dishId: null },
    plate: null, // { dishId, spoilLeft } once a dish is cooked and plated
    toast: '',
    toastTimer: 0,
    over: false,
    steam: [], // { x, y, r, life } — visual only, kept here so shots can settle it
  };

  function reset() {
    nextOrderId = 1;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.coins = 0;
    state.served = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = HEARTS;
    state.orders = [];
    state.spawnTimer = SPAWN.first;
    state.wok = { items: [], cooking: false, cookLeft: 0, cookTotal: 0, dishId: null };
    state.plate = null;
    state.toast = '';
    state.toastTimer = 0;
    state.over = false;
    state.steam = [];
  }

  function say(message, seconds = 2.5) {
    state.toast = message;
    state.toastTimer = seconds;
  }

  function spawnInterval() {
    return Math.max(SPAWN.min, SPAWN.start - state.elapsed * SPAWN.shrinkPerSecond);
  }

  /** Add one ingredient to the wok. Returns an event flag. */
  function addIngredient(id) {
    if (state.over) return 0;
    const wok = state.wok;
    if (wok.cooking) {
      say('The wok is cooking — wait for it!');
      return 0;
    }
    if (wok.items.length >= 3) {
      say('The wok is full — trash it or cook it!');
      return 0;
    }
    wok.items.push(id);
    const recipe = matchRecipe(wok.items);
    if (recipe) {
      wok.cooking = true;
      wok.cookLeft = recipe.cook;
      wok.cookTotal = recipe.cook;
      wok.dishId = recipe.id;
      return EVENT_ADDED | EVENT_COOKING;
    }
    return EVENT_ADDED;
  }

  /** Empty the wok (only while it is not cooking). */
  function trashWok() {
    if (state.over) return 0;
    const wok = state.wok;
    if (wok.cooking || wok.items.length === 0) return 0;
    wok.items = [];
    say('Wok cleared.');
    return EVENT_TRASHED;
  }

  /**
   * Serve the plated dish to the earliest matching order. Returns an event flag.
   * If no order wants this dish, the dish stays on the plate.
   */
  function servePlate() {
    if (state.over || !state.plate) return 0;
    const dish = state.plate;
    let best = null;
    for (const order of state.orders) {
      if (order.dishId !== dish.dishId) continue;
      if (!best || order.patience < best.patience) best = order;
    }
    if (!best) {
      say(`No order wants ${recipeById(dish.dishId).name} right now!`);
      return 0;
    }
    state.orders = state.orders.filter((order) => order !== best);
    const earned = best.reward + state.combo * COMBO_BONUS;
    state.coins += earned;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.plate = null;
    say(`Served ${recipeById(best.dishId).name}! +${earned} coins`);
    return EVENT_SERVED;
  }

  /** One fixed step. `paused` freezes the shift; the title backdrop runs with it set. */
  function step(dt, paused) {
    let events = 0;
    if (state.toastTimer > 0) state.toastTimer = Math.max(0, state.toastTimer - dt);
    if (paused || state.over) return events;

    state.elapsed += dt;
    state.timeLeft = Math.max(0, state.timeLeft - dt);

    // New orders arrive on the board.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < MAX_ORDERS) {
      state.orders.push(newOrder(random, state.elapsed));
      state.spawnTimer += spawnInterval();
      events |= EVENT_ORDER;
    }

    // Patience drains; an expired order costs a heart and breaks the combo.
    for (const order of [...state.orders]) {
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders = state.orders.filter((o) => o !== order);
        state.hearts -= 1;
        state.combo = 0;
        say(`Order for ${recipeById(order.dishId).name} walked out! -1 heart`);
        events |= EVENT_EXPIRED;
        if (state.hearts <= 0) {
          state.over = true;
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    // The wok cooks; when done, the dish moves to the plate.
    const wok = state.wok;
    if (wok.cooking) {
      wok.cookLeft -= dt;
      if (random() < dt * 6) {
        state.steam.push({ x: 380 + random() * 160, y: 430, r: 6 + random() * 10, life: 1 });
      }
      if (wok.cookLeft <= 0) {
        wok.cooking = false;
        state.plate = { dishId: wok.dishId, spoilLeft: PLATE_SPOIL_SECONDS };
        wok.items = [];
        wok.dishId = null;
        say(`${recipeById(state.plate.dishId).name} is ready — serve it!`, 3);
        events |= EVENT_COOKED;
      }
    }

    // Steam drifts up and fades.
    for (const puff of state.steam) {
      puff.y -= 26 * dt;
      puff.life -= dt * 0.7;
    }
    state.steam = state.steam.filter((puff) => puff.life > 0);

    // A plated dish goes cold if nobody serves it.
    if (state.plate) {
      state.plate.spoilLeft -= dt;
      if (state.plate.spoilLeft <= 0) {
        say(`${recipeById(state.plate.dishId).name} went cold!`);
        state.plate = null;
        state.combo = 0;
        events |= EVENT_SPOILED;
      }
    }

    if (state.timeLeft <= 0) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step, addIngredient, trashWok, servePlate, say };
}
