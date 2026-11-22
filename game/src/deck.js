// deck.js — shuffling and drawing. A mulberry32 PRNG keeps the ?shot=
// screenshots deterministic: the same seed always deals the same hands.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Draw n cards from the front of the deck into the hand. An empty deck
// costs 2 life per missing card (fatigue), the classic card-game clock.
export function drawCards(side, n) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (side.deck.length === 0) {
      side.life -= 2;
      drawn.push(null);
      continue;
    }
    const card = side.deck.shift();
    if (side.hand.length < 7) side.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

export function makeSide(deck) {
  return {
    life: 30,
    mana: 0,
    maxMana: 0,
    deck,
    hand: [],
    board: [null, null, null, null],
  };
}

export function firstEmptySlot(board) {
  return board.findIndex((c) => c === null);
}
