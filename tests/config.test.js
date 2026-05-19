import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../src/config.js';

function validQuestion(overrides = {}) {
  return {
    points: 100,
    question: 'Q?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    ...overrides,
  };
}

function validCategory(name = 'Cat') {
  return { name, questions: Array.from({ length: 6 }, () => validQuestion()) };
}

function validConfig() {
  return {
    teams: [
      { name: 'T1', color: '#f00' },
      { name: 'T2', color: '#0f0' },
      { name: 'T3', color: '#00f' },
    ],
    categories: Array.from({ length: 5 }, (_, i) => validCategory(`Cat${i}`)),
  };
}

test('valid config passes', () => {
  const result = validateConfig(validConfig());
  assert.deepEqual(result, { valid: true, errors: [] });
});

test('rejects wrong team count', () => {
  const c = validConfig();
  c.teams.pop();
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('teams')), `expected teams error, got ${JSON.stringify(result.errors)}`);
});

test('rejects wrong category count', () => {
  const c = validConfig();
  c.categories.push(validCategory('Extra'));
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('categories')));
});

test('rejects wrong question count in a category', () => {
  const c = validConfig();
  c.categories[1].questions.pop();
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('categories[1]')));
});

test('rejects options array too short', () => {
  const c = validConfig();
  c.categories[0].questions[0].options = ['A', 'B'];
  c.categories[0].questions[0].correctIndex = 0;
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('options')));
});

test('rejects options array too long', () => {
  const c = validConfig();
  c.categories[0].questions[0].options = ['A', 'B', 'C', 'D', 'E', 'F'];
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('options')));
});

test('rejects correctIndex out of range', () => {
  const c = validConfig();
  c.categories[2].questions[4].correctIndex = 5;
  c.categories[2].questions[4].options = ['A', 'B', 'C', 'D'];
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('categories[2].questions[4].correctIndex')));
});

test('rejects negative points', () => {
  const c = validConfig();
  c.categories[0].questions[0].points = -10;
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('points')));
});

test('rejects missing team name', () => {
  const c = validConfig();
  c.teams[1].name = '';
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('teams[1].name')));
});

test('reports multiple errors at once (does not short-circuit)', () => {
  const c = validConfig();
  c.teams.pop();
  c.categories[0].questions[0].correctIndex = 99;
  c.categories[0].questions[0].options = ['A', 'B'];
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 2, `expected 2+ errors, got ${result.errors.length}`);
});

test('rejects null/undefined config', () => {
  assert.equal(validateConfig(null).valid, false);
  assert.equal(validateConfig(undefined).valid, false);
});

import { loadConfig } from '../src/config.js';

function mockFetch(response) {
  return async () => response;
}

test('loadConfig returns ok with valid config', async () => {
  const cfg = validConfig();
  const fetchFn = mockFetch({
    ok: true,
    json: async () => cfg,
  });
  const result = await loadConfig(fetchFn);
  assert.equal(result.ok, true);
  assert.deepEqual(result.config, cfg);
});

test('loadConfig returns errors for invalid config', async () => {
  const cfg = validConfig();
  cfg.teams.pop();
  const fetchFn = mockFetch({
    ok: true,
    json: async () => cfg,
  });
  const result = await loadConfig(fetchFn);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test('loadConfig returns error on fetch failure', async () => {
  const fetchFn = mockFetch({ ok: false, status: 404, statusText: 'Not Found' });
  const result = await loadConfig(fetchFn);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.includes('404')));
});

test('loadConfig returns error on JSON parse failure', async () => {
  const fetchFn = mockFetch({
    ok: true,
    json: async () => { throw new SyntaxError('Unexpected token'); },
  });
  const result = await loadConfig(fetchFn);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.toLowerCase().includes('json')));
});
