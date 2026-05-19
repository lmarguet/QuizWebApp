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

test('createInitialState view is BOARD', () => {
  const s = createInitialState();
  assert.deepEqual(s.view, { name: 'BOARD' });
});

test('createInitialState answered rows are independent (no aliasing)', () => {
  const s = createInitialState();
  s.answered[0][0] = true;
  assert.equal(s.answered[1][0], false);
});
