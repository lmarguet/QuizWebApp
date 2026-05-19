import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderGameOver } from '../../src/render/gameOver.js';

function cfg() {
  return {
    teams: [
      { name: 'Bug Squashers', color: '#E63946' },
      { name: 'Null Pointers', color: '#2A9D8F' },
      { name: 'Stack Overflows', color: '#F4A261' },
    ],
    categories: [],
  };
}

function endState(scores) {
  return {
    pickerIndex: 0,
    scores,
    answered: Array.from({ length: 5 }, () => Array(6).fill(true)),
    view: { name: 'GAME_OVER' },
  };
}

function partialEndState(scores, answeredCount = 5) {
  const answered = Array.from({ length: 5 }, () => Array(6).fill(false));
  let n = answeredCount;
  outer: for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      if (n-- <= 0) break outer;
      answered[r][c] = true;
    }
  }
  return {
    pickerIndex: 0,
    scores,
    answered,
    view: { name: 'GAME_OVER' },
  };
}

test('renderGameOver lists teams in descending score order', () => {
  const html = renderGameOver(cfg(), endState([100, 500, 300]));
  const i1 = html.indexOf('Null Pointers');
  const i2 = html.indexOf('Stack Overflows');
  const i3 = html.indexOf('Bug Squashers');
  assert.ok(i1 < i2 && i2 < i3, `expected Null < Stack < Bug, got ${i1}, ${i2}, ${i3}`);
});

test('renderGameOver features winning team', () => {
  const html = renderGameOver(cfg(), endState([100, 500, 300]));
  assert.ok(/data-rank="1"[^>]*data-team="1"/.test(html)
    || /data-team="1"[^>]*data-rank="1"/.test(html));
});

test('renderGameOver shows tied winners at same rank', () => {
  const html = renderGameOver(cfg(), endState([500, 500, 200]));
  const rank1Count = (html.match(/data-rank="1"/g) || []).length;
  assert.equal(rank1Count, 2, 'two teams should share rank 1');
});

test('renderGameOver includes New game button', () => {
  const html = renderGameOver(cfg(), endState([0, 0, 0]));
  assert.ok(html.includes('data-action="new-game"'));
});

test('renderGameOver shows each team\'s score', () => {
  const html = renderGameOver(cfg(), endState([100, 500, 300]));
  assert.ok(html.includes('100'));
  assert.ok(html.includes('500'));
  assert.ok(html.includes('300'));
});

test('renderGameOver header announces the sole winner by name', () => {
  const html = renderGameOver(cfg(), endState([100, 500, 300]));
  assert.ok(/Winner/i.test(html), 'expected "Winner" wording in header');
  assert.ok(html.includes('Null Pointers'));
});

test('renderGameOver header announces a tie when two teams share top score', () => {
  const html = renderGameOver(cfg(), endState([500, 500, 200]));
  assert.ok(/tie/i.test(html), 'expected "tie" wording in header');
  assert.ok(html.includes('Bug Squashers'));
  assert.ok(html.includes('Null Pointers'));
});

test('renderGameOver header announces a 3-way tie', () => {
  const html = renderGameOver(cfg(), endState([300, 300, 300]));
  assert.ok(/tie/i.test(html));
  for (const name of ['Bug Squashers', 'Null Pointers', 'Stack Overflows']) {
    assert.ok(html.includes(name));
  }
});

test('renderGameOver shows Back to board button when not all tiles answered', () => {
  const html = renderGameOver(cfg(), partialEndState([100, 200, 300], 5));
  assert.ok(html.includes('data-action="back-to-board"'),
    'Back to board button should appear on early-results view');
});

test('renderGameOver does NOT show Back to board when all tiles answered', () => {
  const html = renderGameOver(cfg(), endState([100, 200, 300]));
  assert.ok(!html.includes('data-action="back-to-board"'),
    'no Back to board button when game is truly complete');
});
