// recipes.js — one clear job: the dishes of Ember Kitchen Rush and how a pile of
// ingredients becomes one. Every dish is a distinct set of exactly three
// ingredients, so the wok can only ever match one recipe at a time.

import { INGREDIENTS } from './config.js';

export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', needs: ['rice', 'egg', 'chilli'], reward: 30, cook: 4, blurb: 'Wok-fried rice, egg, chilli' },
  { id: 'mie-ayam', name: 'Mie Ayam', needs: ['noodle', 'chicken', 'greens'], reward: 35, cook: 4, blurb: 'Chicken noodles with greens' },
  { id: 'soto-ayam', name: 'Soto Ayam', needs: ['chicken', 'egg', 'greens'], reward: 40, cook: 5, blurb: 'Golden chicken soup' },
  { id: 'nasi-padang', name: 'Nasi Padang', needs: ['rice', 'chicken', 'chilli'], reward: 45, cook: 5, blurb: 'Spicy chicken over rice' },
  { id: 'mie-goreng', name: 'Mie Goreng', needs: ['noodle', 'egg', 'chilli'], reward: 35, cook: 4, blurb: 'Fried noodles, egg, chilli' },
];

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id) ?? null;
}

export function ingredientById(id) {
  return INGREDIENTS.find((ingredient) => ingredient.id === id) ?? null;
}

/** The recipe whose ingredient set equals `items` (order-free), or null. */
export function matchRecipe(items) {
  if (items.length !== 3) return null;
  const have = [...items].sort().join(',');
  return RECIPES.find((recipe) => [...recipe.needs].sort().join(',') === have) ?? null;
}

/** Dishes that could still be made from the ingredients already in the wok. */
export function possibleRecipes(items) {
  return RECIPES.filter((recipe) => items.every((item) => recipe.needs.includes(item)));
}

/** One missing ingredient that would keep a dish possible, or null. */
export function nextNeeded(items) {
  const possible = possibleRecipes(items);
  if (possible.length === 0) return null;
  const missing = new Set();
  for (const recipe of possible) {
    for (const need of recipe.needs) if (!items.includes(need)) missing.add(need);
  }
  return [...missing];
}
