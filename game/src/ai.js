// ai.js — Sable, the rival. One function: look at the board and pick the
// next play, or null when nothing is worth doing. Value-ordered, with a few
// common-sense rules: finish a lethal burst, mend when hurt, gust a wide
// board, snare the biggest threat, otherwise play the best creature that fits.

import { firstEmptySlot } from './deck.js';

function biggest(board) {
  return board
    .map((c, i) => (c ? { c, i } : null))
    .filter(Boolean)
    .sort((a, b) => b.c.hp - a.c.hp)[0];
}

export function aiPick(game) {
  const me = game.enemy;
  const foe = game.player;
  const affordable = me.hand.filter((c) => c.cost <= me.mana);
  if (!affordable.length) return null;
  const foeBiggest = biggest(foe.board);
  const boardFull = firstEmptySlot(me.board) === -1;

  for (const card of affordable) {
    if (card.id === 'ember_burst') {
      if (foe.life <= 3) return { card, target: { kind: 'face' } };
      if (foeBiggest && foeBiggest.c.hp <= 3) {
        return { card, target: { kind: 'creature', side: foe, slot: foeBiggest.i } };
      }
      continue;
    }
    if (card.id === 'tide_mend') {
      if (me.life <= 18) return { card, target: null };
      continue;
    }
    if (card.id === 'gale_gust') {
      if (foe.board.filter(Boolean).length >= 2) return { card, target: null };
      continue;
    }
    if (card.id === 'thorn_snare') {
      if (foeBiggest && foeBiggest.c.atk >= 3) {
        return { card, target: { kind: 'creature', side: foe, slot: foeBiggest.i } };
      }
      continue;
    }
    if (card.kind === 'creature' && !boardFull) return { card, target: null };
  }
  // Fallback: any affordable creature that fits.
  const creature = affordable.find((c) => c.kind === 'creature' && !boardFull);
  if (creature) return { card: creature, target: null };
  return null;
}
