[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/tranquilnaturevista-code/ember-kitchen-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/tranquilnaturevista-code/ember-kitchen-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Ember Kitchen Rush — a timed wok-rush cooking game

One shift, three hearts, five recipes. Orders arrive on the board with a
patience bar; toss three ingredients into the wok, cook the dish, and serve it
from the plate before the order walks out. Serve fast in a row to build a
combo worth extra coins.

**Entry for the [make.fun bounty "Make the best cooking game"](https://make.fun/bounty/best-cooking-game-20261125-0137)** ($250, 10 places, closes 2026-11-25 13:37 UTC).

## How to play

Open `game/index.html` in desktop Chrome (or run `node serve.ts` and open http://localhost:8080). No network, no install, no build step.

- **Add an ingredient:** click a bin on the counter, or press **1–6** (Rice, Noodle, Egg, Chicken, Chilli, Greens).
- **Cook:** three ingredients that match a recipe start cooking on their own — watch the wok's progress bar. The specials board (top right) lists every recipe.
- **Serve:** when the dish is ready it waits on the plate — click the plate or press **SPACE** to serve it to the matching order. A dish left on the plate goes cold after 10 seconds.
- **Trash:** click the trash can or press **T** to clear the wok (only while it is not cooking).
- **Lose a heart** when an order's patience runs out. Three hearts gone, or the 150-second shift timer at zero, ends the shift.
- **Pause:** **P** or the II button. **M** mutes the synthesized sizzle and chimes.

## Recipes

| Dish | Ingredients | Reward |
| --- | --- | --- |
| Nasi Goreng | Rice + Egg + Chilli | 30 |
| Mie Ayam | Noodle + Chicken + Greens | 35 |
| Soto Ayam | Chicken + Egg + Greens | 40 |
| Nasi Padang | Rice + Chicken + Chilli | 45 |
| Mie Goreng | Noodle + Egg + Chilli | 35 |

Serving in a row builds a combo: each consecutive serve adds +2 coins per combo level. Orders arrive faster and grow less patient as the shift goes on.

## Files

- `game/index.html` — the game page (canvas, no network requests)
- `game/src/config.js` — all tuning numbers, colours and layout slots
- `game/src/recipes.js` — the five dishes and recipe matching
- `game/src/world.js` — orders, wok, cooking, serving, scoring (no drawing, no browser)
- `game/src/input.js` — mouse clicks and keyboard
- `game/src/sound.js` — synthesized Web Audio sounds (sizzle, chimes)
- `game/src/render.js` — every drawing: kitchen, order board, bins, wok, plate
- `game/src/shots.js` — the staged scenes behind `?shot=start|play|rush|end`
- `game/src/main.js` — boot and the fixed-step game loop
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `serve.ts` — serves `game/` locally for play-testing
- `shots.json` — the four screenshot scenes
- `screenshots/` — real renders of the game's own code (cover first)

## Screenshots

The cover shows the game mid-service: Nasi Goreng half-built in the wok, a
finished Mie Ayam on the plate ready to serve, two orders on the board and the
shift timer running. The other shots show the title screen, the late-shift
rush (three orders, a dish cooking, combo x4) and the shift-over panel.
