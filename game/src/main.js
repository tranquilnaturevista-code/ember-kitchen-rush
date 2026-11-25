// main.js — one clear job: boot and the one loop. Input is read every frame,
// the world advances in fixed 1/60 s steps (several in a slow frame, none in
// a fast one), and the renderer paints what is there. The game moves between
// four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, INGREDIENTS, LAYOUT, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_COOKED, EVENT_EXPIRED, EVENT_OVER, EVENT_SERVED, EVENT_SPOILED } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_SERVE, ACTION_TRASH, createInput, inside } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, false, performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let muted = false;
  let accumulator = 0;
  let last = performance.now();
  const boot = last;

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve every order before it walks out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Shift over. ${world.state.coins} coins, ${world.state.served} dishes served. Best ${best}.`);
  }

  function binAt(point) {
    const b = LAYOUT.bins;
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const rect = { x: b.x + i * (b.w + b.gap), y: b.y, w: b.w, h: b.h };
      if (inside(point, rect)) return INGREDIENTS[i].id;
    }
    return null;
  }

  function handleClick(point) {
    if (!point) return;
    sound.unlock();
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (inside(point, LAYOUT.pause)) {
      screen = screen === SCREEN_PAUSED ? SCREEN_PLAY : SCREEN_PAUSED;
      announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const bin = binAt(point);
    if (bin) {
      const events = world.addIngredient(bin);
      if (events) sound.add();
      return;
    }
    if (inside(point, LAYOUT.plate)) {
      if (world.servePlate()) sound.served();
      return;
    }
    if (inside(point, LAYOUT.trash)) {
      if (world.trashWok()) sound.click();
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      muted = sound.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      sound.unlock();
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const ingredient = input.takeIngredient();
    if (ingredient) {
      sound.unlock();
      if (world.addIngredient(ingredient)) sound.add();
    }
    if (actions & ACTION_SERVE) {
      if (world.servePlate()) sound.served();
    }
    if (actions & ACTION_TRASH) {
      if (world.trashWok()) sound.click();
    }
  }

  function react(events) {
    if (events & EVENT_COOKED) sound.cooked();
    if (events & EVENT_SERVED) sound.served();
    if (events & (EVENT_EXPIRED | EVENT_SPOILED)) sound.expired();
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleClick(input.takeClick());
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        react(world.step(STEP, false));
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      // The title screen's kitchen simmers in the background, frozen in time.
      if (screen === SCREEN_TITLE) world.step(0, true);
    }
    renderer.draw(world.state, screen, best, muted, (now - boot) / 1000);
  }

  // Leaving the tab pauses a running game rather than letting orders walk out unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Ember Kitchen Rush. Press Space or click to start the shift.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
