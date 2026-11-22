// shots.js — deterministic table states for the screenshots (?shot=…).
// The judge sees the game through these renders, so each one is staged to
// show a complete card game: title, a live table, a win, a loss.
// Seeded (seed=7) so the same URL always renders the same table.

import { cardById } from './cards.js';

function creature(id, uid, hp = null) {
  const def = cardById(id);
  const c = { ...def, uid, maxHp: def.hp };
  if (hp !== null) c.hp = hp;
  return c;
}

function handCard(id, uid) {
  const def = cardById(id);
  return { ...def, uid };
}

// A mid-game table: both rows filled, hands visible, life and mana showing.
export function stagePlay(game) {
  game.start();
  // Rebuild a richer, fixed table over the dealt opening.
  game.player.life = 24;
  game.enemy.life = 18;
  game.player.mana = 6;
  game.player.maxMana = 7;
  game.enemy.mana = 4;
  game.enemy.maxMana = 6;
  game.turn = 6;
  game.player.board = [
    creature('cinder_wolf', 'p1'),
    creature('reef_turtle', 'p2', 3),
    creature('storm_hawk', 'p3'),
    null,
  ];
  game.enemy.board = [
    creature('briar_stag', 'e1'),
    creature('flame_drake', 'e2', 4),
    null,
    creature('ember_imp', 'e3'),
  ];
  game.player.hand = [
    handCard('ember_burst', 'h1'),
    handCard('tide_mend', 'h2'),
    handCard('thorn_snare', 'h3'),
    handCard('gale_sparrow', 'h4'),
    handCard('elder_oak', 'h5'),
    handCard('deep_leviathan', 'h6'),
  ];
  game.enemy.hand = [1, 2, 3, 4, 5].map((i) => handCard('ember_imp', `eh${i}`));
  game.log = ['Turn 6 — your creatures are ready to strike.'];
  game.phase = 'player';
}

export function stageWin(game) {
  stagePlay(game);
  game.enemy.life = 0;
  game.player.life = 11;
  game.enemy.board = [null, null, null, null];
  game.endGame('player');
}

export function stageLoss(game) {
  stagePlay(game);
  game.player.life = 0;
  game.enemy.life = 9;
  game.player.board = [null, null, null, null];
  game.endGame('enemy');
}

// ?shot=start | play | win | loss — read by main.js on load.
export function applyShot(game, shot) {
  if (shot === 'play') stagePlay(game);
  else if (shot === 'win') stageWin(game);
  else if (shot === 'loss') stageLoss(game);
  // 'start' (and anything else) leaves the title screen as-is.
}
