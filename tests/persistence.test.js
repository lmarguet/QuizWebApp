import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveState, loadState, clearState, STORAGE_KEY } from '../src/persistence.js';
import { createInitialState } from '../src/state.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    _map: map,
  };
}

test('STORAGE_KEY is exported and stable', () => {
  assert.equal(typeof STORAGE_KEY, 'string');
  assert.equal(STORAGE_KEY, 'jeopardy-app:state');
});

test('saveState writes JSON to storage under STORAGE_KEY', () => {
  const storage = memoryStorage();
  const s = createInitialState();
  s.scores = [100, 200, 300];
  saveState(s, storage);
  const raw = storage.getItem(STORAGE_KEY);
  assert.ok(raw);
  const parsed = JSON.parse(raw);
  assert.deepEqual(parsed.scores, [100, 200, 300]);
});

test('saveState omits view field', () => {
  const storage = memoryStorage();
  const s = createInitialState();
  s.view = { name: 'QUESTION_TEXT', category: 1, question: 2 };
  saveState(s, storage);
  const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(parsed.view, undefined);
});

test('loadState returns null when no saved state', () => {
  const storage = memoryStorage();
  assert.equal(loadState(storage), null);
});

test('loadState returns null for unparseable JSON', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, 'not-json{{{');
  assert.equal(loadState(storage), null);
});

test('loadState returns null for missing required fields', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ scores: [0, 0, 0] }));
  assert.equal(loadState(storage), null);
});

test('loadState round-trips a saved state', () => {
  const storage = memoryStorage();
  const s = createInitialState();
  s.pickerIndex = 2;
  s.scores = [400, 100, 700];
  s.answered[1][3] = true;
  saveState(s, storage);
  const loaded = loadState(storage);
  assert.equal(loaded.pickerIndex, 2);
  assert.deepEqual(loaded.scores, [400, 100, 700]);
  assert.equal(loaded.answered[1][3], true);
});

test('clearState removes the saved state', () => {
  const storage = memoryStorage();
  saveState(createInitialState(), storage);
  clearState(storage);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});
