// shots.js — one clear job: the staged scenes behind `?shot=`. Screenshots must
// be real renders of the game's own code, so each scene builds a real world,
// puts its orders, wok and plate where the shot needs them, and lets the
// normal update + render loop run for a moment so steam and timers are alive.
//   ?shot=start — the title screen over a kitchen with two orders waiting.
//   ?shot=play  — the COVER: Nasi Goreng mid-assembly in the wok, a finished
//                 Mie Ayam on the plate ready to serve, two orders on the
//                 board, the shift timer running, coins and a combo showing.
//   ?shot=rush  — the rush: three orders, the wok cooking at 60%, combo x4.
//   ?shot=end   — the shift-over panel: coins, dishes served, best combo.
import { STEP } from './config.js';
import { recipeById } from './recipes.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function settle(world, seconds) {
  for (let t = 0; t < seconds; t += STEP) world.step(STEP, false);
}

function putOrder(world, dishId, patience, reward) {
  const recipe = recipeById(dishId);
  world.state.orders.push({
    id: world.state.orders.length + 1,
    dishId,
    patience,
    maxPatience: patience,
    reward: reward ?? recipe.reward,
  });
}

export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name === 'play') {
    // The cover: a dish mid-assembly, a plate ready to serve, orders waiting.
    state.timeLeft = 112;
    state.elapsed = 38;
    state.coins = 85;
    state.combo = 2;
    state.bestCombo = 2;
    state.served = 3;
    putOrder(world, 'nasi-goreng', 26, 30);
    putOrder(world, 'mie-ayam', 14, 35);
    state.wok.items = ['rice', 'egg'];
    state.plate = { dishId: 'mie-ayam', spoilLeft: 7 };
    state.toast = 'Mie Ayam is ready — serve it!';
    state.toastTimer = 3;
    settle(world, 0.6);
    state.wok.items = ['rice', 'egg'];
    state.plate = { dishId: 'mie-ayam', spoilLeft: 7 };
    return { screen: SCREEN_PLAY, best: 120 };
  }
  if (name === 'rush') {
    // Three tickets, the wok cooking, a hot combo.
    state.timeLeft = 64;
    state.elapsed = 86;
    state.coins = 240;
    state.combo = 4;
    state.bestCombo = 4;
    state.served = 8;
    putOrder(world, 'soto-ayam', 18, 40);
    putOrder(world, 'nasi-padang', 9, 45);
    putOrder(world, 'mie-goreng', 31, 35);
    state.wok.items = ['chicken', 'egg', 'greens'];
    state.wok.cooking = true;
    state.wok.cookTotal = 5;
    state.wok.cookLeft = 2;
    state.wok.dishId = 'soto-ayam';
    settle(world, 0.6);
    // settle() may have finished the cook; pin the scene back to mid-cook.
    if (!state.wok.cooking) {
      state.wok.items = ['chicken', 'egg', 'greens'];
      state.wok.cooking = true;
      state.wok.cookTotal = 5;
      state.wok.cookLeft = 2;
      state.wok.dishId = 'soto-ayam';
      state.plate = null;
    }
    return { screen: SCREEN_PLAY, best: 260 };
  }
  if (name === 'end') {
    state.timeLeft = 0;
    state.elapsed = 150;
    state.coins = 315;
    state.served = 11;
    state.combo = 0;
    state.bestCombo = 5;
    state.over = true;
    return { screen: SCREEN_OVER, best: 315 };
  }
  // start (and anything else): the title screen over a live-looking kitchen.
  putOrder(world, 'nasi-goreng', 38, 30);
  putOrder(world, 'mie-ayam', 30, 35);
  state.wok.items = ['rice', 'egg'];
  state.timeLeft = 150;
  return { screen: SCREEN_TITLE, best: 120 };
}
