// main.js — boots Ember Court: canvas scaling, the render loop, mouse and
// keyboard input, and the sound hooks. ?shot=start|play|win|loss stages a
// fixed table for screenshots; without it, the game opens on the title screen.

import { Game } from './state.js';
import { Sound } from './audio.js';
import { W, H, draw, hotspots, slotRect, heroRect } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);

const game = new Game(seed);
const sound = new Sound();
const ui = { hoverUid: null, attackSlot: -1, attackSide: null, mouse: { x: 0, y: 0 } };

game.onEvent = (kind, detail) => {
  if (kind === 'attack' && detail) {
    ui.attackSlot = detail.slot;
    ui.attackSide = detail.side;
    setTimeout(() => { ui.attackSlot = -1; ui.attackSide = null; }, 420);
    sound.hit();
    return;
  }
  if (kind === 'play') sound.play();
  else if (kind === 'hit') sound.hit();
  else if (kind === 'heal') sound.heal();
  else if (kind === 'turn') sound.turn();
  else if (kind === 'win') sound.win();
  else if (kind === 'loss') sound.loss();
  else if (kind === 'start') sound.turn();
};

function resize() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}

function toGameCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * W,
    y: ((e.clientY - rect.top) / rect.height) * H,
  };
}

function hitAt(x, y) {
  for (let i = hotspots.length - 1; i >= 0; i--) {
    const h = hotspots[i];
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
  }
  return null;
}

function announce() {
  const line = game.log[0] || '';
  const screen = game.screen === 'play'
    ? `Turn ${game.turn}. You have ${game.player.life} life, ${game.player.mana} mana. Sable has ${game.enemy.life} life. ${line}`
    : game.screen;
  if (statusEl.textContent !== screen) statusEl.textContent = screen;
}

function frame() {
  draw(ctx, game, ui);
  announce();
  requestAnimationFrame(frame);
}

canvas.addEventListener('mousemove', (e) => {
  const p = toGameCoords(e);
  ui.mouse = p;
  const h = hitAt(p.x, p.y);
  ui.hoverUid = h && h.kind === 'hand' ? h.uid : null;
  canvas.style.cursor = h ? 'pointer' : 'default';
});

canvas.addEventListener('click', (e) => {
  sound.ensure();
  const p = toGameCoords(e);
  const h = hitAt(p.x, p.y);
  if (game.screen === 'title') {
    game.start();
    return;
  }
  if (game.screen === 'win' || game.screen === 'loss') {
    if (h && h.kind === 'again') location.href = location.pathname;
    return;
  }
  if (!h) {
    game.cancelTargeting();
    return;
  }
  if (h.kind === 'endturn') {
    sound.click();
    game.endTurn();
    return;
  }
  if (h.kind === 'hand') {
    const card = game.player.hand.find((c) => c.uid === h.uid);
    if (!card) return;
    if (game.selected === card.uid) {
      game.cancelTargeting();
      return;
    }
    const res = game.playCard(game.player, card.uid);
    if (res === 'played') sound.play();
    else if (res === 'targeting') sound.click();
    return;
  }
  if (game.selected) {
    const card = game.player.hand.find((c) => c.uid === game.selected);
    if (!card) return;
    if (h.kind === 'hero' && h.side === 'enemy' && card.target === 'any') {
      const r = heroRect('enemy');
      game.playTargeted(game.player, card.uid, { kind: 'face', x: r.x + r.w / 2, y: r.y + r.h / 2 });
    } else if (h.kind === 'slot' && h.side === 'enemy' && (card.target === 'any' || card.target === 'creature')) {
      const targetCard = game.enemy.board[h.slot];
      if (targetCard) {
        const r = slotRect('enemy', h.slot);
        game.playTargeted(game.player, card.uid, {
          kind: 'creature', side: game.enemy, slot: h.slot, x: r.x + r.w / 2, y: r.y + r.h / 2,
        });
      }
    }
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  game.cancelTargeting();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    sound.muted = !sound.muted;
    return;
  }
  if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    sound.ensure();
    game.start();
    return;
  }
  if (game.screen === 'play' && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault();
    game.endTurn();
    return;
  }
  if (game.screen === 'play' && /^[1-7]$/.test(e.key)) {
    const card = game.player.hand[Number(e.key) - 1];
    if (card) game.playCard(game.player, card.uid);
  }
  if (e.key === 'Escape') game.cancelTargeting();
});

if (shot) applyShot(game, shot);
resize();
window.addEventListener('resize', resize);
requestAnimationFrame(frame);
