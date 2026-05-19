import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/state.js';

test('createInitialState returns picker at 0', () => {
  const s = createInitialState();
  assert.equal(s.pickerIndex, 0);
});

test('createInitialState returns three zero scores', () => {
  const s = createInitialState();
  assert.deepEqual(s.scores, [0, 0, 0]);
});

test('createInitialState returns 5x6 grid of false', () => {
  const s = createInitialState();
  assert.equal(s.answered.length, 5);
  for (const row of s.answered) {
    assert.equal(row.length, 6);
    assert.ok(row.every(v => v === false));
  }
});

test('createInitialState view is INTRO with revealed=0', () => {
  const s = createInitialState();
  assert.deepEqual(s.view, { name: 'INTRO', revealed: 0 });
});

test('createInitialState answered rows are independent (no aliasing)', () => {
  const s = createInitialState();
  s.answered[0][0] = true;
  assert.equal(s.answered[1][0], false);
});

import { applyVerdict } from '../src/state.js';

test('applyVerdict correct adds points to picking team', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 0, 0, 'correct', 200);
  assert.equal(s2.scores[0], 200);
  assert.deepEqual(s2.scores.slice(1), [0, 0]);
});

test('applyVerdict wrong does not change scores', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 0, 0, 'wrong', 200);
  assert.deepEqual(s2.scores, [0, 0, 0]);
});

test('applyVerdict marks tile answered', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 2, 4, 'wrong', 300);
  assert.equal(s2.answered[2][4], true);
  assert.equal(s2.answered[2][3], false);
  assert.equal(s2.answered[0][0], false);
});

test('applyVerdict rotates picker 0 → 1', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 0, 0, 'correct', 100);
  assert.equal(s2.pickerIndex, 1);
});

test('applyVerdict rotates picker 2 → 0', () => {
  const s = { ...createInitialState(), pickerIndex: 2 };
  const s2 = applyVerdict(s, 0, 0, 'correct', 100);
  assert.equal(s2.pickerIndex, 0);
});

test('applyVerdict rotates picker on wrong verdict too', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 0, 0, 'wrong', 100);
  assert.equal(s2.pickerIndex, 1);
});

test('applyVerdict does not mutate input state', () => {
  const s = createInitialState();
  const before = JSON.stringify(s);
  applyVerdict(s, 0, 0, 'correct', 500);
  assert.equal(JSON.stringify(s), before);
});

test('applyVerdict accumulates score across multiple corrects', () => {
  let s = createInitialState();
  s = applyVerdict(s, 0, 0, 'correct', 100);  // T1 = 100, picker → 1
  s = applyVerdict(s, 0, 1, 'correct', 200);  // T2 = 200, picker → 2
  s = applyVerdict(s, 0, 2, 'correct', 300);  // T3 = 300, picker → 0
  s = applyVerdict(s, 0, 3, 'correct', 400);  // T1 = 500, picker → 1
  assert.deepEqual(s.scores, [500, 200, 300]);
  assert.equal(s.pickerIndex, 1);
});

import { allAnswered, answeredCount } from '../src/state.js';

test('allAnswered is false for fresh state', () => {
  assert.equal(allAnswered(createInitialState()), false);
});

test('allAnswered is true when every tile is true', () => {
  const s = createInitialState();
  s.answered = Array.from({ length: 5 }, () => Array(6).fill(true));
  assert.equal(allAnswered(s), true);
});

test('allAnswered is false when one tile is false', () => {
  const s = createInitialState();
  s.answered = Array.from({ length: 5 }, () => Array(6).fill(true));
  s.answered[3][2] = false;
  assert.equal(allAnswered(s), false);
});

test('answeredCount is 0 for fresh state', () => {
  assert.equal(answeredCount(createInitialState()), 0);
});

test('answeredCount is 30 when all answered', () => {
  const s = createInitialState();
  s.answered = Array.from({ length: 5 }, () => Array(6).fill(true));
  assert.equal(answeredCount(s), 30);
});

test('answeredCount counts a partial board', () => {
  let s = createInitialState();
  s = applyVerdict(s, 0, 0, 'correct', 100);
  s = applyVerdict(s, 1, 2, 'wrong', 100);
  s = applyVerdict(s, 4, 5, 'correct', 100);
  assert.equal(answeredCount(s), 3);
});
