import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderIntro } from '../../src/render/intro.js';

function cfg() {
  return {
    teams: [
      { name: 'A', color: '#f00' },
      { name: 'B', color: '#0f0' },
      { name: 'C', color: '#00f' },
    ],
    categories: ['Movies', 'History', 'Code', 'Music', 'Food'].map(name => ({
      name,
      questions: Array.from({ length: 6 }, () => ({
        points: 100, question: 'q', options: ['a','b','c','d'], correctIndex: 0,
      })),
    })),
  };
}

function introState(revealed) {
  return {
    pickerIndex: 0,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => Array(6).fill(false)),
    view: { name: 'INTRO', revealed },
  };
}

test('renderIntro with revealed=0 shows no category names', () => {
  const html = renderIntro(cfg(), introState(0));
  assert.ok(!html.includes('Movies'));
  assert.ok(!html.includes('History'));
});

test('renderIntro with revealed=1 shows only the first category', () => {
  const html = renderIntro(cfg(), introState(1));
  assert.ok(html.includes('Movies'));
  assert.ok(!html.includes('History'));
  assert.ok(!html.includes('Code'));
});

test('renderIntro with revealed=3 shows first three categories in order', () => {
  const html = renderIntro(cfg(), introState(3));
  const iMovies = html.indexOf('Movies');
  const iHistory = html.indexOf('History');
  const iCode = html.indexOf('Code');
  assert.ok(iMovies !== -1 && iHistory !== -1 && iCode !== -1);
  assert.ok(iMovies < iHistory && iHistory < iCode, 'expected category order Movies < History < Code');
  assert.ok(!html.includes('Music'));
  assert.ok(!html.includes('Food'));
});

test('renderIntro with revealed=5 shows all categories', () => {
  const html = renderIntro(cfg(), introState(5));
  for (const name of ['Movies', 'History', 'Code', 'Music', 'Food']) {
    assert.ok(html.includes(name), `expected "${name}" in output`);
  }
});

test('renderIntro shows exactly 5 slots regardless of how many revealed', () => {
  for (const r of [0, 1, 3, 5]) {
    const html = renderIntro(cfg(), introState(r));
    const slots = (html.match(/class="intro-slot/g) || []).length;
    assert.equal(slots, 5, `expected 5 slots when revealed=${r}, got ${slots}`);
  }
});

test('renderIntro Next button when revealed < 5', () => {
  const html = renderIntro(cfg(), introState(2));
  assert.ok(html.includes('data-action="intro-advance"'));
  assert.ok(/>\s*Next\s*</.test(html), 'button label should be "Next" while categories remain');
});

test('renderIntro Start game button when revealed === 5', () => {
  const html = renderIntro(cfg(), introState(5));
  assert.ok(html.includes('data-action="intro-advance"'));
  assert.ok(/Start game/i.test(html), 'button label should be "Start game" when all revealed');
});

test('renderIntro escapes category names', () => {
  const c = cfg();
  c.categories[0].name = '<script>x</script>';
  const html = renderIntro(c, introState(1));
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
