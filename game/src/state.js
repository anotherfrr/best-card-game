// state.js — the duel itself: turns, mana, playing cards, combat, win/loss.
// One Game owns both sides. The renderer only reads; the AI only calls the
// public play methods. All damage flows through damage() so the log, the
// floating numbers and the win check stay in one place.

import { buildDeck, cardById } from './cards.js';
import { drawCards, firstEmptySlot, makeSide, mulberry32, shuffle } from './deck.js';
import { aiPick } from './ai.js';

export const BOARD_SLOTS = 4;
export const START_LIFE = 30;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Game {
  constructor(seed = 1) {
    this.rng = mulberry32(seed);
    this.seed = seed;
    this.screen = 'title'; // title | play | win | loss
    this.phase = 'player'; // player | ai | combat | over
    this.turn = 1;
    this.player = makeSide(shuffle(buildDeck(), this.rng));
    this.enemy = makeSide(shuffle(buildDeck(), this.rng));
    this.log = ['The Ember Court is open. Sable awaits.'];
    this.floaters = []; // {x, y, text, color, born}
    this.selected = null; // uid of a hand card awaiting a target
    this.over = false;
    this.winner = null;
    this.onEvent = null; // (kind, detail) => void — sounds + re-render hooks
    this.lastPlay = null; // {side, card} for the play animation
  }

  start() {
    this.screen = 'play';
    this.phase = 'player';
    this.player.maxMana = 1;
    this.player.mana = 1;
    this.enemy.maxMana = 0;
    drawCards(this.player, 3);
    drawCards(this.enemy, 3);
    this.say('Your turn — 3 cards, 1 mana crystal.');
    this.emit('start');
  }

  say(text) {
    this.log.unshift(text);
    if (this.log.length > 4) this.log.length = 4;
  }

  emit(kind, detail) {
    if (this.onEvent) this.onEvent(kind, detail);
  }

  floater(anchor, text, color) {
    this.floaters.push({ anchor, text, color, born: performance.now() });
  }

  sideName(side) {
    return side === this.player ? 'player' : 'enemy';
  }

  // --- damage & healing -------------------------------------------------
  damage(side, amount, anchor) {
    side.life -= amount;
    if (anchor) this.floater(anchor, `-${amount}`, '#ff6b5e');
    this.emit('hit');
    this.checkEnd();
  }

  damageCreature(side, slot, amount, anchor) {
    const c = side.board[slot];
    if (!c) return;
    c.hp -= amount;
    this.floater(anchor ?? { kind: 'slot', side: this.sideName(side), slot }, `-${amount}`, '#ffb020');
    this.emit('hit');
    if (c.hp <= 0) {
      side.board[slot] = null;
      this.say(`${c.name} shatters.`);
    }
    this.checkEnd();
  }

  heal(side, amount, anchor) {
    const before = side.life;
    side.life = Math.min(START_LIFE, side.life + amount);
    const gained = side.life - before;
    if (gained > 0) this.floater(anchor ?? { kind: 'hero', side: this.sideName(side) }, `+${gained}`, '#7ddc8f');
    this.emit('heal');
  }

  checkEnd() {
    if (this.over) return;
    if (this.enemy.life <= 0 && this.player.life <= 0) {
      this.endGame('player'); // simultaneous fall: the challenger takes the court
    } else if (this.enemy.life <= 0) {
      this.endGame('player');
    } else if (this.player.life <= 0) {
      this.endGame('enemy');
    }
  }

  endGame(winner) {
    this.over = true;
    this.winner = winner;
    this.phase = 'over';
    this.screen = winner === 'player' ? 'win' : 'loss';
    this.emit(winner === 'player' ? 'win' : 'loss');
    this.say(winner === 'player' ? 'Victory! The Ember Court is yours.' : 'Defeat. Sable keeps the court… for now.');
  }

  // --- playing cards ----------------------------------------------------
  canPlay(side, card) {
    if (this.phase !== 'player' || side !== this.player) return false;
    if (card.cost > side.mana) return false;
    if (card.kind === 'creature' && firstEmptySlot(side.board) === -1) return false;
    return true;
  }

  // Play a creature straight onto the table, or arm a spell that needs a target.
  // Returns 'played' | 'targeting' | 'nope'.
  playCard(side, uid) {
    const idx = side.hand.findIndex((c) => c.uid === uid);
    if (idx === -1) return 'nope';
    const card = side.hand[idx];
    if (!this.canPlay(side, card)) return 'nope';
    if (card.kind === 'spell' && (card.target === 'any' || card.target === 'creature')) {
      this.selected = uid;
      this.say(`${card.name} — choose a target.`);
      return 'targeting';
    }
    this.resolveCard(side, card);
    side.hand.splice(idx, 1);
    return 'played';
  }

  // Finish a targeted spell. tx/ty are screen coords for the floater.
  playTargeted(side, uid, target) {
    const idx = side.hand.findIndex((c) => c.uid === uid);
    if (idx === -1) return false;
    const card = side.hand[idx];
    this.resolveCard(side, card, target);
    side.hand.splice(idx, 1);
    this.selected = null;
    return true;
  }

  cancelTargeting() {
    this.selected = null;
  }

  resolveCard(side, card, target) {
    const foe = side === this.player ? this.enemy : this.player;
    side.mana -= card.cost;
    this.lastPlay = { side: side === this.player ? 'player' : 'enemy', card };
    this.emit('play', card);
    if (card.kind === 'creature') {
      const slot = firstEmptySlot(side.board);
      side.board[slot] = { ...card, maxHp: card.hp };
      this.say(`${side === this.player ? 'You play' : 'Sable plays'} ${card.name} (${card.atk}/${card.hp}).`);
      if (card.id === 'tide_sprite') this.heal(side, 2);
      return;
    }
    // spells
    switch (card.id) {
      case 'ember_burst': {
        if (target && target.kind === 'creature') {
          const victim = target.side.board[target.slot];
          const victimName = victim ? victim.name : 'a creature';
          this.damageCreature(target.side, target.slot, 3, target.x !== undefined ? { x: target.x, y: target.y } : undefined);
          this.say(`Ember Burst scorches ${victimName} for 3.`);
        } else {
          this.damage(foe, 3, target?.x !== undefined ? { x: target.x, y: target.y } : { kind: 'hero', side: this.sideName(foe) });
          this.say('Ember Burst hits Sable for 3.');
        }
        break;
      }
      case 'tide_mend':
        this.heal(side, 5);
        this.say(`${side === this.player ? 'You mend' : 'Sable mends'} 5 life.`);
        break;
      case 'gale_gust': {
        foe.board.forEach((c, i) => {
          if (c) this.damageCreature(foe, i, 1);
        });
        drawCards(side, 1);
        this.say('Gale Gust sweeps the enemy row — and you draw a card.');
        break;
      }
      case 'thorn_snare': {
        if (target && target.kind === 'creature') {
          this.damageCreature(target.side, target.slot, 2, target.x !== undefined ? { x: target.x, y: target.y } : undefined);
          this.say(`Thorn Snare tangles a creature for 2.`);
        }
        break;
      }
      default:
        break;
    }
  }

  // --- turns & combat ---------------------------------------------------
  async endTurn() {
    if (this.phase !== 'player' || this.over) return;
    this.selected = null;
    this.phase = 'combat';
    this.say('Your creatures strike!');
    await this.combat(this.player, this.enemy);
    if (this.over) return;
    await this.aiTurn();
    if (this.over) return;
    this.turn += 1;
    this.player.maxMana = Math.min(10, this.turn);
    this.player.mana = this.player.maxMana;
    drawCards(this.player, 1);
    this.phase = 'player';
    this.say(`Turn ${this.turn} — ${this.player.mana} mana, a fresh card.`);
    this.emit('turn');
  }

  // Each attacker hits the enemy creature in the same slot, or the hero.
  async combat(attacker, defender) {
    for (let slot = 0; slot < BOARD_SLOTS; slot++) {
      if (this.over) return;
      const c = attacker.board[slot];
      if (!c) continue;
      const target = defender.board[slot];
      this.emit('attack', { slot, side: attacker === this.player ? 'player' : 'enemy' });
      await sleep(420);
      if (this.over) return;
      if (target) {
        this.damageCreature(defender, slot, c.atk);
        // retaliation: the defender strikes back
        const survivor = defender.board[slot];
        if (survivor) this.damageCreature(attacker, slot, survivor.atk);
        this.say(`${c.name} clashes with ${target.name}.`);
      } else {
        this.damage(defender, c.atk, { kind: 'hero', side: defender === this.enemy ? 'enemy' : 'player' });
        this.say(`${c.name} hits ${defender === this.enemy ? 'Sable' : 'you'} for ${c.atk}.`);
      }
      await sleep(160);
    }
  }

  async aiTurn() {
    this.phase = 'ai';
    this.enemy.maxMana = Math.min(10, this.turn);
    this.enemy.mana = this.enemy.maxMana;
    drawCards(this.enemy, 1);
    this.say(`Sable's turn — ${this.enemy.mana} mana.`);
    await sleep(500);
    // Play cards until nothing affordable and useful remains.
    for (let guard = 0; guard < 12 && !this.over; guard++) {
      const pick = aiPick(this);
      if (!pick) break;
      const { card, target } = pick;
      if (card.kind === 'spell' && (card.target === 'any' || card.target === 'creature')) {
        this.resolveCard(this.enemy, card, target);
      } else {
        this.resolveCard(this.enemy, card, null);
      }
      const idx = this.enemy.hand.findIndex((c) => c.uid === card.uid);
      if (idx !== -1) this.enemy.hand.splice(idx, 1);
      await sleep(650);
    }
    if (this.over) return;
    this.say("Sable's creatures strike!");
    await this.combat(this.enemy, this.player);
  }

  // (The rival's picks live in ai.js.)
}

export { cardById };
