import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBoard } from '../../src/render/board.js';

function exampleConfig() {
  return {
    teams: [
      { name: 'T1', color: '#f00' },
      { name: 'T2', color: '#0f0' },
      { name: 'T3', color: '#00f' },
    ],
    categories: ['Movies', 'History', 'Code', 'Music', 'Food'].map(name => ({
      name,
      questions: [100, 200, 300, 400, 500, 600].map(points => ({
        points,
        question: `Q ${name} ${points}`,
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
      })),
    })),
  };
}

function exampleState() {
  return {
    pickerIndex: 0,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => Array(6).fill(false)),
    view: { name: 'BOARD' },
  };
}

test('renderBoard shows all 5 category names', () => {
  const html = renderBoard(exampleConfig(), exampleState());
  for (const name of ['Movies', 'History', 'Code', 'Music', 'Food']) {
    assert.ok(html.includes(name), `expected "${name}" in output`);
  }
});

test('renderBoard shows all 30 point values', () => {
  const html = renderBoard(exampleConfig(), exampleState());
  // 5 categories × each value (100/200/.../600) = 5 occurrences per value
  for (const v of [100, 200, 300, 400, 500, 600]) {
    const matches = (html.match(new RegExp(`>${v}<`, 'g')) || []).length;
    assert.equal(matches, 5, `expected 5 tiles with value ${v}, got ${matches}`);
  }
});

test('renderBoard tiles have data-cat and data-q attributes', () => {
  const html = renderBoard(exampleConfig(), exampleState());
  assert.ok(html.includes('data-cat="0"'));
  assert.ok(html.includes('data-cat="4"'));
  assert.ok(html.includes('data-q="0"'));
  assert.ok(html.includes('data-q="5"'));
});

test('renderBoard shows dash for answered tiles', () => {
  const state = exampleState();
  state.answered[2][3] = true;
  const html = renderBoard(exampleConfig(), state);
  // The answered tile should not show its points value as a clickable tile
  // It should show a dash. Use a markup-aware substring check:
  assert.ok(html.includes('data-cat="2" data-q="3" data-answered="true"'),
    'expected answered tile to be marked with data-answered="true"');
});

test('renderBoard escapes HTML in category names', () => {
  const cfg = exampleConfig();
  cfg.categories[0].name = '<script>x</script>';
  const html = renderBoard(cfg, exampleState());
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
