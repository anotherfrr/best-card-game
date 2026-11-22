// render.js — every pixel of Ember Court, drawn on one canvas (1280x800).
// The table, the hands, the HUD and the title/win/loss screens all live here.
// Hotspots rebuilt each frame tell main.js what a click or hover lands on.

import { SUITS } from './cards.js';

export const W = 1280;
export const H = 800;

export const hotspots = [];

const CARD_W = 118;
const CARD_H = 164;
const SLOT_W = 124;
const SLOT_H = 168;
const SLOT_GAP = 18;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.2, y, x - s * 0.55, y - s, x, y - s * 0.25);
  ctx.bezierCurveTo(x + s * 0.55, y - s, x + s * 1.2, y, x, y + s * 0.9);
  ctx.fill();
}

function diamond(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.7, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s * 0.7, y);
  ctx.closePath();
  ctx.fill();
}

// Suit symbols, drawn as paths so they read at any size and need no font.
export function drawSuit(ctx, suit, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (suit === 'ember') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.7, -s * 0.3, s * 0.9, s * 0.2, s * 0.45, s * 0.75);
    ctx.bezierCurveTo(s * 0.2, s * 0.95, -s * 0.2, s * 0.95, -s * 0.45, s * 0.75);
    ctx.bezierCurveTo(-s * 0.9, s * 0.2, -s * 0.7, -s * 0.3, 0, -s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,120,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.25);
    ctx.bezierCurveTo(s * 0.35, s * 0.1, s * 0.4, s * 0.45, 0, s * 0.65);
    ctx.bezierCurveTo(-s * 0.4, s * 0.45, -s * 0.35, s * 0.1, 0, -s * 0.25);
    ctx.fill();
  } else if (suit === 'tide') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.75, -s * 0.1, s * 0.8, s * 0.45, 0, s * 0.85);
    ctx.bezierCurveTo(-s * 0.8, s * 0.45, -s * 0.75, -s * 0.1, 0, -s);
    ctx.fill();
  } else if (suit === 'thorn') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.9);
    ctx.bezierCurveTo(s * 0.9, -s * 0.4, s * 0.9, s * 0.6, 0, s * 0.9);
    ctx.bezierCurveTo(-s * 0.9, s * 0.6, -s * 0.9, -s * 0.4, 0, -s * 0.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.75);
    ctx.lineTo(0, s * 0.75);
    ctx.stroke();
  } else {
    // gale bolt
    ctx.beginPath();
    ctx.moveTo(s * 0.15, -s);
    ctx.lineTo(-s * 0.45, s * 0.15);
    ctx.lineTo(-s * 0.05, s * 0.15);
    ctx.lineTo(-s * 0.15, s);
    ctx.lineTo(s * 0.45, -s * 0.15);
    ctx.lineTo(s * 0.05, -s * 0.15);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function slotRect(side, slot) {
  const total = SLOT_W * 4 + SLOT_GAP * 3;
  const x0 = (W - total) / 2;
  const y = side === 'enemy' ? 168 : 372;
  return { x: x0 + slot * (SLOT_W + SLOT_GAP), y, w: SLOT_W, h: SLOT_H };
}

export function heroRect(side) {
  return side === 'enemy'
    ? { x: 36, y: 22, w: 330, h: 96 }
    : { x: 36, y: 758, w: 330, h: 34 };
}

export function anchorPoint(game, anchor) {
  if (!anchor) return null;
  if (anchor.x !== undefined) return { x: anchor.x, y: anchor.y };
  if (anchor.kind === 'hero') {
    const r = heroRect(anchor.side);
    return { x: r.x + r.w - 60, y: r.y + r.h / 2 };
  }
  if (anchor.kind === 'slot') {
    const r = slotRect(anchor.side, anchor.slot);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }
  return null;
}

function drawCardBack(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#2b1d4e';
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, x + 8, y + 8, w - 16, h - 16, 7);
  ctx.strokeStyle = 'rgba(201,162,39,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawSuit(ctx, 'ember', x + w / 2, y + h / 2, Math.min(w, h) * 0.22, '#c9a227');
}

function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  const dim = opts.dim;
  ctx.save();
  if (opts.glow) {
    ctx.shadowColor = suit.glow;
    ctx.shadowBlur = 22;
  }
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = dim ? '#cfc8bd' : '#f7f1e3';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = opts.selected ? 4 : 2.5;
  ctx.strokeStyle = opts.selected ? '#ffd94a' : suit.color;
  ctx.stroke();
  // suit band
  rr(ctx, x, y, w, 30, 10);
  ctx.fillStyle = suit.color;
  ctx.fill();
  ctx.fillRect(x, y + 20, w, 10);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(w * 0.093)}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name.toUpperCase(), x + 10, y + 16, w - 46);
  // cost gem
  ctx.beginPath();
  ctx.arc(x + w - 20, y + 15, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#1d2a4a';
  ctx.fill();
  ctx.strokeStyle = '#ffd94a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + w - 20, y + 16);
  // big suit symbol
  drawSuit(ctx, card.suit, x + w / 2, y + h * 0.44, Math.min(w, h) * 0.21, suit.color);
  // rules text
  ctx.fillStyle = '#3a3226';
  ctx.font = `italic ${Math.round(w * 0.092)}px Georgia, serif`;
  ctx.textAlign = 'center';
  wrapText(ctx, card.text, x + 10, y + h * 0.66, w - 20, 15);
  if (card.kind === 'creature') {
    // attack pip (sword triangle) + health pip (heart)
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(x + 14, y + h - 30);
    ctx.lineTo(x + 26, y + h - 30);
    ctx.lineTo(x + 20, y + h - 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(card.atk), x + 30, y + h - 16);
    heart(ctx, x + w - 30, y + h - 20, 9, '#c0392b');
    ctx.fillStyle = '#222';
    ctx.textAlign = 'right';
    ctx.fillText(String(card.hp), x + w - 44, y + h - 14);
  } else {
    ctx.fillStyle = suit.dark;
    ctx.font = `bold ${Math.round(w * 0.1)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SPELL', x + w / 2, y + h - 18);
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, x + maxW / 2, y + i * lineH));
}

function drawMana(ctx, x, y, mana, maxMana) {
  for (let i = 0; i < 10; i++) {
    const cx = x + i * 22;
    if (i < maxMana) diamond(ctx, cx, y, 8, i < mana ? '#37b6ff' : '#3a4a63');
    else diamond(ctx, cx, y, 8, 'rgba(255,255,255,0.12)');
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, y - 8);
    ctx.lineTo(cx + 5.6, y);
    ctx.lineTo(cx, y + 8);
    ctx.lineTo(cx - 5.6, y);
    ctx.closePath();
    ctx.stroke();
  }
}

function drawHero(ctx, game, side) {
  const s = side === 'player' ? game.player : game.enemy;
  const r = heroRect(side);
  const isEnemy = side === 'enemy';
  if (!isEnemy) {
    // Player hero: a compact strip along the bottom, under the hand.
    ctx.fillStyle = 'rgba(10,14,12,0.72)';
    rr(ctx, r.x, r.y, 1210, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r.x + 26, r.y + r.h / 2, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#274a35';
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.stroke();
    drawSuit(ctx, 'ember', r.x + 26, r.y + r.h / 2, 7, '#ff8a7a');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('YOU', r.x + 48, r.y + 23);
    heart(ctx, r.x + 112, r.y + 17, 9, '#e5484d');
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(String(Math.max(0, s.life)), r.x + 126, r.y + 24);
    drawMana(ctx, r.x + 176, r.y + 17, s.mana, s.maxMana);
    ctx.fillStyle = '#cbbf9a';
    ctx.font = '14px Georgia, serif';
    ctx.fillText(`Turn ${game.turn}  ·  M: mute  ·  1–7: play card  ·  Space: end turn`, r.x + 420, r.y + 23);
    hotspots.push({ kind: 'hero', side, ...r, w: 1210 });
    return;
  }
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = 'rgba(20,16,40,0.85)';
  ctx.fill();
  ctx.strokeStyle = '#8f7bd8';
  ctx.lineWidth = 2;
  ctx.stroke();
  // portrait medallion
  ctx.beginPath();
  ctx.arc(r.x + 44, r.y + r.h / 2, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#3d2b63';
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawSuit(ctx, 'gale', r.x + 44, r.y + r.h / 2, 15, '#ffd97a');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('SABLE', r.x + 86, r.y + 34);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#cbbf9a';
  ctx.fillText('Warden of the Gale Court', r.x + 86, r.y + 54);
  // life
  heart(ctx, r.x + 100, r.y + 78, 11, '#e5484d');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(String(Math.max(0, s.life)), r.x + 118, r.y + 85);
  ctx.fillStyle = '#cbbf9a';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`${s.hand.length} cards in hand`, r.x + 170, r.y + 83);
  hotspots.push({ kind: 'hero', side, ...r });
}

function drawTable(ctx, game, ui) {
  // felt
  const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 720);
  g.addColorStop(0, '#1e5c46');
  g.addColorStop(1, '#0d2b20');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // gold frame
  ctx.strokeStyle = 'rgba(201,162,39,0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.strokeStyle = 'rgba(201,162,39,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  // centre emblem
  ctx.save();
  ctx.globalAlpha = 0.08;
  drawSuit(ctx, 'ember', W / 2, 350, 90, '#ffd94a');
  ctx.restore();

  // enemy hand (card backs)
  const eHand = game.enemy.hand.length;
  for (let i = 0; i < eHand; i++) {
    drawCardBack(ctx, 880 + i * 34, 30, 64, 88);
  }
  // decks: enemy's top-right, player's mid-right (clear of END TURN)
  drawCardBack(ctx, 1180, 30, 64, 88);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(game.enemy.deck.length), 1212, 136);
  drawCardBack(ctx, 1180, 556, 64, 88);
  ctx.fillText(String(game.player.deck.length), 1212, 660);

  // boards
  for (const side of ['enemy', 'player']) {
    const s = side === 'enemy' ? game.enemy : game.player;
    for (let slot = 0; slot < 4; slot++) {
      const r = slotRect(side, slot);
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      const card = s.board[slot];
      if (card) {
        const attacking = ui.attackSlot === slot && ui.attackSide === side;
        const oy = attacking ? (side === 'enemy' ? 14 : -14) : 0;
        drawCard(ctx, card, r.x + 3, r.y + 2 + oy, r.w - 6, r.h - 4);
      }
      hotspots.push({ kind: 'slot', side, slot, ...r });
    }
  }

  // log line (only during play — the end screens carry their own text)
  if (game.screen === 'play') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, 380, 340, 520, 28, 8);
    ctx.fill();
    ctx.fillStyle = '#e8dfc5';
    ctx.font = 'italic 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.log[0] || '', W / 2, 359);
  }

  drawHero(ctx, game, 'enemy');
  drawHero(ctx, game, 'player');
}

function drawHand(ctx, game, ui) {
  const hand = game.player.hand;
  const n = hand.length;
  if (!n) return;
  // Cards sit side by side with a small gap — no card ever hides the next
  // one's name or text. Seven cards at most, so they always fit.
  const gap = 10;
  const totalW = CARD_W * n + gap * (n - 1);
  let x = (W - totalW) / 2;
  const y = 576;
  for (let i = 0; i < n; i++) {
    const card = hand[i];
    const hovered = ui.hoverUid === card.uid;
    const selected = game.selected === card.uid;
    const playable = game.phase === 'player' && card.cost <= game.player.mana;
    const cy = hovered ? y - 26 : y;
    drawCard(ctx, card, x, cy, CARD_W, CARD_H, {
      dim: !playable,
      glow: hovered || selected,
      selected,
    });
    hotspots.push({ kind: 'hand', uid: card.uid, x, y: cy, w: CARD_W, h: CARD_H });
    x += CARD_W + gap;
  }
}

function drawEndTurn(ctx, game) {
  // Right edge, mid-table — the whole bottom row stays free for the hand.
  const r = { x: 1050, y: 336, w: 190, h: 56 };
  const enabled = game.phase === 'player' && !game.over;
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = enabled ? '#c9a227' : '#4a4436';
  ctx.fill();
  ctx.strokeStyle = '#fff2c0';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = enabled ? '#241c05' : '#8a8270';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.phase === 'ai' ? 'SABLE…' : 'END TURN', r.x + r.w / 2, r.y + 40);
  if (enabled) hotspots.push({ kind: 'endturn', ...r });
}

function drawTargeting(ctx, game) {
  const card = game.player.hand.find((c) => c.uid === game.selected);
  if (!card) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255,217,74,0.12)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${card.name} — click a target (right-click to cancel)`, W / 2, 150);
  const targets = card.target === 'any' ? ['hero-enemy', 'slot-enemy-0', 'slot-enemy-1', 'slot-enemy-2', 'slot-enemy-3'] : ['slot-enemy-0', 'slot-enemy-1', 'slot-enemy-2', 'slot-enemy-3'];
  ctx.strokeStyle = '#ffd94a';
  ctx.lineWidth = 3;
  for (const t of targets) {
    if (t === 'hero-enemy') {
      const r = heroRect('enemy');
      ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
    } else {
      const slot = Number(t.split('-')[2]);
      if (game.enemy.board[slot]) {
        const r = slotRect('enemy', slot);
        ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
      }
    }
  }
  ctx.restore();
}

function drawFloaters(ctx, game) {
  const now = performance.now();
  game.floaters = game.floaters.filter((f) => now - f.born < 1100);
  for (const f of game.floaters) {
    const p = anchorPoint(game, f.anchor);
    if (!p) continue;
    const age = (now - f.born) / 1100;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = f.color;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, p.x, p.y - age * 46);
    ctx.restore();
  }
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(10,8,20,0.82)';
  ctx.fillRect(0, 0, W, H);
  for (const [suit, dx] of [['ember', -210], ['tide', -70], ['thorn', 70], ['gale', 210]]) {
    drawSuit(ctx, suit, W / 2 + dx, 200, 34, SUITS[suit].color);
  }
  ctx.fillStyle = '#f5e9c8';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBER COURT', W / 2, 320);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('A duel of the four courts — flame, tide, thorn and gale', W / 2, 362);
  ctx.fillStyle = '#e8dfc5';
  ctx.font = '18px Georgia, serif';
  const lines = [
    'You and Sable, Warden of the Gale Court, each hold 30 life.',
    'Spend mana crystals to play creatures and spells. Creatures strike at the end of your turn.',
    'Click a card to play it. Spells with a target ask you to pick one. Space ends your turn.',
    'Empty your rival’s life first — and take the court.',
  ];
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 430 + i * 30));
  const pulse = 0.65 + 0.35 * Math.sin(performance.now() / 350);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('— CLICK TO BEGIN —', W / 2, 620);
  ctx.restore();
  hotspots.push({ kind: 'title', x: 0, y: 0, w: W, h: H });
}

function drawEnd(ctx, game) {
  const won = game.screen === 'win';
  ctx.fillStyle = won ? 'rgba(40,30,4,0.78)' : 'rgba(30,4,8,0.8)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = won ? '#ffd94a' : '#ff8a7a';
  ctx.font = 'bold 76px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', W / 2, 330);
  ctx.fillStyle = '#f5e9c8';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText(
    won ? 'The Ember Court is yours. Sable bows and deals you in again.' : 'Sable keeps the court… for now. Shuffle up and try again.',
    W / 2,
    384,
  );
  ctx.fillStyle = '#e8dfc5';
  ctx.font = '20px Georgia, serif';
  ctx.fillText(`Final life — You ${Math.max(0, game.player.life)}  ·  Sable ${Math.max(0, game.enemy.life)}  ·  ${game.turn} turns`, W / 2, 436);
  const r = { x: W / 2 - 130, y: 500, w: 260, h: 64 };
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = '#c9a227';
  ctx.fill();
  ctx.strokeStyle = '#fff2c0';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#241c05';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('PLAY AGAIN', W / 2, r.y + 41);
  hotspots.push({ kind: 'again', ...r });
}

export function draw(ctx, game, ui) {
  hotspots.length = 0;
  ctx.clearRect(0, 0, W, H);
  if (game.screen === 'title') {
    drawTable(ctx, game, ui);
    drawTitle(ctx);
    return;
  }
  drawTable(ctx, game, ui);
  if (game.screen === 'play') {
    drawHand(ctx, game, ui);
    drawEndTurn(ctx, game);
    if (game.selected) drawTargeting(ctx, game);
  }
  drawFloaters(ctx, game);
  if (game.screen === 'win' || game.screen === 'loss') drawEnd(ctx, game);
}
