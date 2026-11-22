// cards.js — every card in Ember Court: its suit, cost, body and rules text.
// Suits are told apart by colour AND shape, never by text alone:
//   ember — red flame, tide — blue droplet, thorn — green leaf, gale — amber bolt.

export const SUITS = {
  ember: { name: 'Ember', color: '#e5484d', dark: '#8f1d22', light: '#ff8a7a', glow: 'rgba(229,72,77,0.45)' },
  tide: { name: 'Tide', color: '#3e8fe8', dark: '#174a80', light: '#8ec2ff', glow: 'rgba(62,143,232,0.45)' },
  thorn: { name: 'Thorn', color: '#46a758', dark: '#1e5c2e', light: '#8fd6a0', glow: 'rgba(70,167,88,0.45)' },
  gale: { name: 'Gale', color: '#f5a524', dark: '#8a5c06', light: '#ffd97a', glow: 'rgba(245,165,36,0.45)' },
};

// kind: 'creature' (stays on the table, attacks at end of its owner's turn)
//       'spell'    (instant effect, then gone)
// target: 'any' (creature or hero), 'creature', 'face', 'self', 'none'
export const CARD_DEFS = [
  { id: 'ember_imp', name: 'Ember Imp', suit: 'ember', kind: 'creature', cost: 1, atk: 2, hp: 1, text: 'A quick spark of the court.' },
  { id: 'cinder_wolf', name: 'Cinder Wolf', suit: 'ember', kind: 'creature', cost: 2, atk: 3, hp: 2, text: 'It hunts in the smoke.' },
  { id: 'flame_drake', name: 'Flame Drake', suit: 'ember', kind: 'creature', cost: 5, atk: 6, hp: 5, text: 'The court bows when it lands.' },
  { id: 'tide_sprite', name: 'Tide Sprite', suit: 'tide', kind: 'creature', cost: 1, atk: 1, hp: 2, text: 'Battlecry: restore 2 life.' },
  { id: 'reef_turtle', name: 'Reef Turtle', suit: 'tide', kind: 'creature', cost: 2, atk: 1, hp: 4, text: 'Slow, shelled, unbothered.' },
  { id: 'deep_leviathan', name: 'Deep Leviathan', suit: 'tide', kind: 'creature', cost: 6, atk: 7, hp: 7, text: 'The whole sea, wearing a crown.' },
  { id: 'thorn_sprout', name: 'Thorn Sprout', suit: 'thorn', kind: 'creature', cost: 1, atk: 1, hp: 3, text: 'Small now. Give it a turn.' },
  { id: 'briar_stag', name: 'Briar Stag', suit: 'thorn', kind: 'creature', cost: 3, atk: 4, hp: 4, text: 'Its antlers bloom in spring.' },
  { id: 'elder_oak', name: 'Elder Oak', suit: 'thorn', kind: 'creature', cost: 4, atk: 3, hp: 7, text: 'Older than the court itself.' },
  { id: 'gale_sparrow', name: 'Gale Sparrow', suit: 'gale', kind: 'creature', cost: 1, atk: 2, hp: 1, text: 'Here, then gone, then here.' },
  { id: 'storm_hawk', name: 'Storm Hawk', suit: 'gale', kind: 'creature', cost: 3, atk: 4, hp: 3, text: 'It rides the wind it makes.' },
  { id: 'ember_burst', name: 'Ember Burst', suit: 'ember', kind: 'spell', cost: 2, text: 'Deal 3 damage.', target: 'any' },
  { id: 'tide_mend', name: 'Tide Mend', suit: 'tide', kind: 'spell', cost: 2, text: 'Restore 5 life.', target: 'self' },
  { id: 'gale_gust', name: 'Gale Gust', suit: 'gale', kind: 'spell', cost: 2, text: 'Deal 1 damage to all enemy creatures. Draw a card.', target: 'none' },
  { id: 'thorn_snare', name: 'Thorn Snare', suit: 'thorn', kind: 'spell', cost: 2, text: 'Deal 2 damage to a creature.', target: 'creature' },
];

export function buildDeck() {
  // 30 cards: two copies of each of the 15 designs.
  const deck = [];
  for (const def of CARD_DEFS) {
    deck.push({ ...def, uid: def.id + '-a' });
    deck.push({ ...def, uid: def.id + '-b' });
  }
  return deck;
}

export function cardById(id) {
  return CARD_DEFS.find((c) => c.id === id);
}
