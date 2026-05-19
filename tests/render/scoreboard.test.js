import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderScoreboard } from '../../src/render/scoreboard.js';

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

function stateAt(pickerIndex, scores = [0, 0, 0]) {
  return {
    pickerIndex,
    scores,
    answered: Array.from({ length: 5 }, () => Array(6).fill(false)),
    view: { name: 'BOARD' },
  };
}

test('renderScoreboard shows all three team names', () => {
  const html = renderScoreboard(cfg(), stateAt(0));
  assert.ok(html.includes('Bug Squashers'));
  assert.ok(html.includes('Null Pointers'));
  assert.ok(html.includes('Stack Overflows'));
});

test('renderScoreboard shows scores', () => {
  const html = renderScoreboard(cfg(), stateAt(0, [300, 500, 200]));
  assert.ok(html.includes('300'));
  assert.ok(html.includes('500'));
  assert.ok(html.includes('200'));
});

test('renderScoreboard applies team colors as left border', () => {
  const html = renderScoreboard(cfg(), stateAt(0));
  assert.ok(html.includes('#E63946'));
  assert.ok(html.includes('#2A9D8F'));
  assert.ok(html.includes('#F4A261'));
});

test('renderScoreboard marks picker with data-active', () => {
  const html = renderScoreboard(cfg(), stateAt(1));
  const team1Marked = /data-team="1"[^>]*data-active="true"/.test(html)
    || /data-active="true"[^>]*data-team="1"/.test(html);
  assert.ok(team1Marked, 'team 1 should be active when pickerIndex=1');
});

test('renderScoreboard only one team active at a time', () => {
  const html = renderScoreboard(cfg(), stateAt(2));
  const activeCount = (html.match(/data-active="true"/g) || []).length;
  assert.equal(activeCount, 1);
});

test('renderScoreboard escapes team names', () => {
  const c = cfg();
  c.teams[0].name = '<img>';
  const html = renderScoreboard(c, stateAt(0));
  assert.ok(!html.includes('<img>'));
  assert.ok(html.includes('&lt;img&gt;'));
});
