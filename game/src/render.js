// render.js — one clear job: paint the kitchen. It reads the world state and the
// screen and draws everything on one canvas: the wall and counter, the order
// board with its tickets, the six ingredient bins, the wok on its stove, the
// pass with its plate, the trash, and the HUD with the shift timer, coins,
// hearts and combo. It never changes state; animation comes from the `time`
// argument (seconds since boot) and the world's own steam particles.

import { FIELD, FONT, INGREDIENTS, LAYOUT, PALETTE } from './config.js';
import { ingredientById, recipeById, RECIPES, possibleRecipes, nextNeeded } from './recipes.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, colour, weight = '700', align = 'left') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function mmss(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** One ingredient drawn as a little food picture, centred at (x, y), radius r. */
export function drawIngredient(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'rice') {
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d9cfae';
    for (let i = -2; i <= 2; i += 1) {
      ctx.fillRect(i * r * 0.32 - 1, -r * 0.25 + Math.abs(i) * 1.5, 2, r * 0.5);
    }
  } else if (id === 'noodle') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = Math.max(2, r * 0.22);
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      const yy = -r * 0.5 + i * r * 0.5;
      ctx.moveTo(-r * 0.8, yy);
      ctx.bezierCurveTo(-r * 0.4, yy - r * 0.35, r * 0.4, yy + r * 0.35, r * 0.8, yy);
      ctx.stroke();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a13c';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7c65c';
    ctx.beginPath();
    ctx.arc(-r * 0.12, -r * 0.12, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'chicken') {
    ctx.fillStyle = '#e8a06a';
    ctx.beginPath();
    ctx.ellipse(-r * 0.1, 0, r * 0.75, r * 0.6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b06a2e';
    ctx.beginPath();
    ctx.ellipse(-r * 0.1, 0, r * 0.45, r * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f5efe0';
    ctx.lineWidth = Math.max(2, r * 0.18);
    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 0.25);
    ctx.lineTo(r * 1.05, -r * 0.6);
    ctx.moveTo(r * 0.55, r * 0.25);
    ctx.lineTo(r * 1.05, r * 0.6);
    ctx.stroke();
  } else if (id === 'chilli') {
    ctx.strokeStyle = '#e5493a';
    ctx.lineWidth = Math.max(3, r * 0.3);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.3);
    ctx.quadraticCurveTo(0, r * 0.9, r * 0.85, -r * 0.5);
    ctx.stroke();
    ctx.strokeStyle = '#2f7d3d';
    ctx.lineWidth = Math.max(2, r * 0.16);
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.3);
    ctx.lineTo(-r * 0.95, -r * 0.75);
    ctx.stroke();
  } else if (id === 'greens') {
    ctx.fillStyle = '#58b368';
    for (let i = 0; i < 3; i += 1) {
      const angle = -Math.PI / 2 + (i - 1) * 0.6;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * r * 0.4, Math.sin(angle) * r * 0.4, r * 0.55, r * 0.3, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#2f7d3d';
    ctx.lineWidth = Math.max(2, r * 0.14);
    ctx.beginPath();
    ctx.moveTo(0, r * 0.2);
    ctx.lineTo(0, r * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

/** A finished dish in a bowl, centred at (x, y), radius r. */
function drawDish(ctx, dishId, x, y, r) {
  const recipe = recipeById(dishId);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4f1e6';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.15, r, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8d2bd';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.05, r * 0.82, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  if (recipe) {
    const spots = [[-0.4, -0.1], [0.35, -0.15], [0, 0.2]];
    recipe.needs.forEach((need, i) => {
      const [sx, sy] = spots[i % spots.length];
      drawIngredient(ctx, need, sx * r, sy * r - r * 0.1, r * 0.34);
    });
  }
  ctx.restore();
}

function drawTicket(ctx, order, x, y, w, h, time) {
  const recipe = recipeById(order.dishId);
  const urgent = order.patience < 10;
  const blink = urgent && Math.floor(time * 3) % 2 === 0;
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = blink ? '#ffe3d6' : PALETTE.ticket;
  ctx.fill();
  ctx.strokeStyle = urgent ? PALETTE.red : '#c9a86a';
  ctx.lineWidth = urgent ? 3 : 1.5;
  ctx.stroke();
  text(ctx, `#${order.id}`, x + 12, y + 22, 13, '#8a7a5c', '700');
  text(ctx, recipe.name, x + 12, y + 46, 21, PALETTE.ticketInk, '800');
  recipe.needs.forEach((need, i) => {
    drawIngredient(ctx, need, x + 26 + i * 34, y + 72, 12);
  });
  text(ctx, `+${order.reward}`, x + w - 14, y + 30, 20, '#8a6d1f', '800', 'right');
  ctx.fillStyle = '#8a6d1f';
  ctx.beginPath();
  ctx.arc(x + w - 52, y + 22, 7, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'c', x + w - 52, y + 26, 11, '#f7ead0', '800', 'center');
  // Patience bar.
  const frac = Math.max(0, order.patience / order.maxPatience);
  rr(ctx, x + 12, y + h - 18, w - 24, 9, 4);
  ctx.fillStyle = '#e3d3ae';
  ctx.fill();
  rr(ctx, x + 12, y + h - 18, (w - 24) * frac, 9, 4);
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
  ctx.fill();
}

function drawBin(ctx, ingredient, rect, time) {
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fill();
  ctx.strokeStyle = PALETTE.counterEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Bowl of the ingredient.
  ctx.fillStyle = '#2b1d16';
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w / 2, rect.y + 52, 58, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ingredient.colour;
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w / 2, rect.y + 46, 50, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  drawIngredient(ctx, ingredient.id, rect.x + rect.w / 2, rect.y + 44, 22);
  text(ctx, ingredient.name, rect.x + rect.w / 2, rect.y + 96, 17, PALETTE.text, '700', 'center');
  // Key cap.
  rr(ctx, rect.x + 8, rect.y + 8, 24, 24, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  text(ctx, ingredient.key, rect.x + 20, rect.y + 25, 14, '#fff', '800', 'center');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const scale = { x: 1, y: 1 };
  let viewW = FIELD.width;
  let viewH = FIELD.height;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    viewW = canvas.clientWidth || FIELD.width;
    viewH = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    scale.x = canvas.width / FIELD.width;
    scale.y = canvas.height / FIELD.height;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawKitchen(state, time) {
    // Warm wall, floor and the counter band the bins sit on.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Floor.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 660, FIELD.width, 60);
    // Counter band the bins sit on.
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(0, 350, FIELD.width, 22);
    ctx.fillStyle = PALETTE.counterEdge;
    ctx.fillRect(0, 370, FIELD.width, 4);
  }

  /** A chopping board with prepped greens and chilli, left of the stove. */
  function drawPrepStation() {
    rr(ctx, 44, 452, 216, 110, 12);
    ctx.fillStyle = '#b07a45';
    ctx.fill();
    ctx.strokeStyle = '#8a5f31';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, 'greens', 110, 500, 26);
    drawIngredient(ctx, 'chilli', 190, 492, 22);
    drawIngredient(ctx, 'chilli', 220, 520, 16);
    // Knife.
    ctx.fillStyle = '#c8ccd2';
    ctx.beginPath();
    ctx.moveTo(90, 540);
    ctx.lineTo(170, 540);
    ctx.lineTo(182, 548);
    ctx.lineTo(90, 548);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(170, 538, 26, 12);
    text(ctx, 'PREP', 152, 440, 14, PALETTE.muted, '700', 'center');
  }

  /** A stack of clean plates between the pass and the trash. */
  function drawPlateStack() {
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#f4f1e6' : '#e4dfcd';
      ctx.beginPath();
      ctx.ellipse(1022, 556 - i * 12, 30, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(1022, 508, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHud(state, screen, best, muted) {
    ctx.fillStyle = 'rgba(20,12,8,0.85)';
    ctx.fillRect(0, 0, FIELD.width, 64);
    text(ctx, 'EMBER KITCHEN', 24, 28, 22, PALETTE.gold, '800');
    text(ctx, 'a timed wok-rush cooking game', 24, 50, 13, PALETTE.muted, '600');
    // Shift timer.
    const frac = state.timeLeft / 150;
    const tx = 440;
    rr(ctx, tx, 16, 400, 18, 9);
    ctx.fillStyle = '#3a2a22';
    ctx.fill();
    rr(ctx, tx, 16, 400 * frac, 18, 9);
    ctx.fillStyle = frac > 0.3 ? PALETTE.gold : PALETTE.timerLow;
    ctx.fill();
    text(ctx, `SHIFT ${mmss(state.timeLeft)}`, tx + 200, 48, 15, PALETTE.text, '800', 'center');
    // Coins, hearts, combo.
    text(ctx, `🪙 ${state.coins}`, 900, 40, 24, PALETTE.gold, '800');
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < state.hearts ? PALETTE.heart : '#4a3428';
      ctx.beginPath();
      const hx = 1050 + i * 30;
      ctx.arc(hx, 32, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 8, 34);
      ctx.lineTo(hx, 44);
      ctx.lineTo(hx + 8, 34);
      ctx.fill();
    }
    if (state.combo >= 2) {
      rr(ctx, 1140, 14, 62, 34, 8);
      ctx.fillStyle = '#7a3b12';
      ctx.fill();
      text(ctx, `x${state.combo}`, 1171, 38, 18, '#ffd166', '800', 'center');
    }
    // Pause button.
    const pause = LAYOUT.pause;
    rr(ctx, pause.x, pause.y, pause.w, pause.h, 8);
    ctx.fillStyle = '#4a3428';
    ctx.fill();
    text(ctx, screen === SCREEN_PAUSED ? '▶' : 'II', pause.x + pause.w / 2, pause.y + 27, 17, PALETTE.text, '800', 'center');
    if (muted) text(ctx, 'muted (M)', 1212, 60, 11, PALETTE.muted, '600', 'right');
  }

  function drawBoard(state, time) {
    text(ctx, 'ORDER BOARD', LAYOUT.tickets.x, LAYOUT.tickets.y - 2, 12, PALETTE.boardFrame, '800');
    for (let i = 0; i < 3; i += 1) {
      const x = LAYOUT.tickets.x + i * (LAYOUT.tickets.w + LAYOUT.tickets.gap);
      const order = state.orders[i];
      if (order) {
        drawTicket(ctx, order, x, LAYOUT.tickets.y, LAYOUT.tickets.w, LAYOUT.tickets.h, time);
      } else {
        rr(ctx, x, LAYOUT.tickets.y, LAYOUT.tickets.w, LAYOUT.tickets.h, 10);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#6b4a2f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, 'waiting for orders…', x + LAYOUT.tickets.w / 2, LAYOUT.tickets.y + 62, 15, '#8a6f52', '600', 'center');
      }
    }
    // Specials board: every recipe, so planning a route is visible at a glance.
    const s = LAYOUT.specials;
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fillStyle = PALETTE.board;
    ctx.fill();
    ctx.strokeStyle = PALETTE.boardFrame;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, "TODAY'S SPECIALS", s.x + 12, s.y + 20, 13, PALETTE.boardFrame, '800');
    RECIPES.forEach((recipe, i) => {
      const y = s.y + 38 + i * 15;
      text(ctx, recipe.name, s.x + 12, y, 12, PALETTE.text, '700');
      recipe.needs.forEach((need, j) => {
        drawIngredient(ctx, need, s.x + s.w - 14 - (2 - j) * 20, y - 4, 6);
      });
    });
  }

  function drawBins(state, time) {
    const b = LAYOUT.bins;
    INGREDIENTS.forEach((ingredient, i) => {
      drawBin(ctx, ingredient, { x: b.x + i * (b.w + b.gap), y: b.y, w: b.w, h: b.h }, time);
    });
    text(ctx, 'INGREDIENTS — click a bin or press 1–6', b.x, b.y - 10, 14, PALETTE.muted, '700');
  }

  function drawStove(state, time) {
    const wok = LAYOUT.wok;
    // Stove top with two burners; the wok sits on the left burner.
    rr(ctx, wok.x - 20, wok.y + 30, wok.w + 40, 150, 14);
    ctx.fillStyle = PALETTE.stove;
    ctx.fill();
    ctx.strokeStyle = PALETTE.steelDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    const flame = 0.7 + Math.sin(time * 6) * 0.3;
    ctx.fillStyle = `rgba(242, 140, 60, ${0.25 + flame * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(wok.x + wok.w / 2, wok.y + 120, 86, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // The wok itself.
    ctx.fillStyle = PALETTE.wok;
    ctx.beginPath();
    ctx.ellipse(wok.x + wok.w / 2, wok.y + 100, 130, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d3d44';
    ctx.beginPath();
    ctx.ellipse(wok.x + wok.w / 2, wok.y + 92, 118, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ingredients mid-assembly inside the wok.
    const items = state.wok.items;
    items.forEach((id, i) => {
      const angle = -Math.PI / 2 + (i - (items.length - 1) / 2) * 0.7;
      drawIngredient(ctx, id, wok.x + wok.w / 2 + Math.cos(angle) * 52, wok.y + 92 + Math.sin(angle) * 18, 24);
    });
    // Steam.
    for (const puff of state.steam) {
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, puff.life) * 0.35})`;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Cook progress ring + hint of what the wok can become.
    if (state.wok.cooking) {
      const frac = 1 - state.wok.cookLeft / state.wok.cookTotal;
      rr(ctx, wok.x + 30, wok.y + 168, wok.w - 60, 14, 7);
      ctx.fillStyle = '#3a2a22';
      ctx.fill();
      rr(ctx, wok.x + 30, wok.y + 168, (wok.w - 60) * frac, 14, 7);
      ctx.fillStyle = PALETTE.gold;
      ctx.fill();
      text(ctx, `Cooking ${recipeById(state.wok.dishId).name}…`, wok.x + wok.w / 2, wok.y + 204, 15, PALETTE.text, '700', 'center');
    } else if (items.length > 0) {
      const possible = possibleRecipes(items);
      if (possible.length === 0) {
        text(ctx, 'No recipe from this mix — trash it (T)', wok.x + wok.w / 2, wok.y + 190, 14, PALETTE.red, '700', 'center');
      } else {
        const missing = nextNeeded(items);
        const names = missing.map((id) => ingredientById(id).name).join(' or ');
        text(ctx, `Add ${names} to cook ${possible.map((r) => r.name).join(' / ')}`, wok.x + wok.w / 2, wok.y + 190, 13, PALETTE.muted, '600', 'center');
      }
    } else {
      text(ctx, 'WOK — add 3 ingredients to start cooking', wok.x + wok.w / 2, wok.y + 190, 13, PALETTE.muted, '600', 'center');
    }
    text(ctx, 'STOVE', wok.x, wok.y + 16, 14, PALETTE.muted, '700');
  }

  function drawPass(state, time) {
    const plate = LAYOUT.plate;
    // The pass shelf.
    rr(ctx, plate.x - 10, plate.y + 150, plate.w + 20, 16, 6);
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fill();
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(plate.x - 10, plate.y + 166, plate.w + 20, 44);
    // The plate.
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(plate.x + plate.w / 2 - 30, plate.y + 118, 96, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8d2bd';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (state.plate) {
      const pulse = 1 + Math.sin(time * 5) * 0.06;
      drawDish(ctx, state.plate.dishId, plate.x + plate.w / 2 - 30, plate.y + 96, 52 * pulse);
      const frac = Math.max(0, state.plate.spoilLeft / 10);
      rr(ctx, plate.x + 20, plate.y + 168, 160, 8, 4);
      ctx.fillStyle = '#3a2a22';
      ctx.fill();
      rr(ctx, plate.x + 20, plate.y + 168, 160 * frac, 8, 4);
      ctx.fillStyle = frac > 0.4 ? PALETTE.green : PALETTE.red;
      ctx.fill();
      const glow = 0.6 + Math.sin(time * 5) * 0.4;
      text(ctx, 'SERVE!  (click or SPACE)', plate.x + plate.w / 2 - 10, plate.y + 60, 17, `rgba(242,193,78,${glow})`, '800', 'center');
    } else {
      text(ctx, 'PLATE — ready dishes wait here', plate.x + plate.w / 2 - 10, plate.y + 60, 13, PALETTE.muted, '600', 'center');
    }
    // Service bell.
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(plate.x + plate.w - 32, plate.y + 108, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(plate.x + plate.w - 50, plate.y + 108, 36, 6);
    text(ctx, 'PASS', plate.x, plate.y + 16, 14, PALETTE.muted, '700');
  }

  function drawTrash(state) {
    const t = LAYOUT.trash;
    rr(ctx, t.x + 58, t.y + 30, 80, 130, 10);
    ctx.fillStyle = PALETTE.steel;
    ctx.fill();
    ctx.strokeStyle = PALETTE.steelDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    rr(ctx, t.x + 48, t.y + 18, 100, 18, 8);
    ctx.fillStyle = PALETTE.steelDark;
    ctx.fill();
    text(ctx, 'TRASH', t.x + t.w / 2, t.y + 185, 14, PALETTE.muted, '700', 'center');
    text(ctx, 'clear the wok (T)', t.x + t.w / 2, t.y + 204, 12, PALETTE.muted, '600', 'center');
  }

  function drawToast(state) {
    if (state.toastTimer <= 0 || !state.toast) return;
    const alpha = Math.min(1, state.toastTimer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 16px ${FONT}`;
    const w = ctx.measureText(state.toast).width + 40;
    rr(ctx, FIELD.width / 2 - w / 2, 632, w, 34, 17);
    ctx.fillStyle = 'rgba(20,12,8,0.9)';
    ctx.fill();
    text(ctx, state.toast, FIELD.width / 2, 655, 16, PALETTE.text, '700', 'center');
    ctx.restore();
  }

  function drawHints() {
    text(ctx, 'Click a bin (1–6) to add • SPACE serve • T trash • P pause • M mute', FIELD.width / 2, 700, 13, PALETTE.muted, '600', 'center');
  }

  function drawTitle(state, best, time) {
    ctx.fillStyle = 'rgba(20,10,6,0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'EMBER KITCHEN', FIELD.width / 2, 300, 64, PALETTE.gold, '800', 'center');
    text(ctx, 'RUSH', FIELD.width / 2, 352, 64, '#ff8c42', '800', 'center');
    text(ctx, 'One shift. Three hearts. Five recipes. Serve every order before it walks out.', FIELD.width / 2, 396, 19, PALETTE.text, '600', 'center');
    const pulse = 0.65 + Math.sin(time * 3) * 0.35;
    text(ctx, 'Press SPACE or click to start the shift', FIELD.width / 2, 448, 20, `rgba(247,234,208,${pulse})`, '800', 'center');
    if (best > 0) text(ctx, `Best shift: ${best} coins`, FIELD.width / 2, 486, 16, PALETTE.muted, '600', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20,10,6,0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'PAUSED', FIELD.width / 2, 340, 48, PALETTE.text, '800', 'center');
    text(ctx, 'Press P or click II to keep cooking', FIELD.width / 2, 384, 18, PALETTE.muted, '600', 'center');
  }

  function drawOver(state, best, time) {
    ctx.fillStyle = 'rgba(20,10,6,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    rr(ctx, 390, 170, 500, 380, 18);
    ctx.fillStyle = '#f7ead0';
    ctx.fill();
    text(ctx, 'SHIFT OVER', 640, 228, 40, PALETTE.ticketInk, '800', 'center');
    text(ctx, `Coins earned: ${state.coins}`, 640, 292, 26, '#8a6d1f', '800', 'center');
    text(ctx, `Dishes served: ${state.served}`, 640, 332, 20, PALETTE.ticketInk, '700', 'center');
    text(ctx, `Best combo: x${state.bestCombo}`, 640, 362, 20, PALETTE.ticketInk, '700', 'center');
    text(ctx, `Best shift: ${best} coins`, 640, 392, 20, '#8a7a5c', '700', 'center');
    if (state.coins >= best && state.coins > 0) {
      text(ctx, '★ New best shift! ★', 640, 432, 20, '#b06a2e', '800', 'center');
    }
    const pulse = 0.65 + Math.sin(time * 3) * 0.35;
    text(ctx, 'Press SPACE to cook another shift', 640, 496, 18, `rgba(58,42,34,${pulse})`, '800', 'center');
  }

  function draw(state, screen, best, muted, time) {
    ctx.setTransform(scale.x, 0, 0, scale.y, 0, 0);
    drawKitchen(state, time);
    drawBoard(state, time);
    drawBins(state, time);
    drawPrepStation();
    drawStove(state, time);
    drawPass(state, time);
    drawPlateStack();
    drawTrash(state);
    drawHud(state, screen, best, muted);
    drawToast(state);
    drawHints();
    if (screen === SCREEN_TITLE) drawTitle(state, best, time);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best, time);
  }

  return { draw, resize };
}
