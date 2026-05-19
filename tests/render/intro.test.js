import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderIntro } from '../../src/render/intro.js';

function cfg() {
  return {
    teams: [
      { name: 'Bug Squashers', color: '#E63946', members: ['Alice', 'Bob'] },
      { name: 'Null Pointers', color: '#2A9D8F', members: ['Carol', 'Dave', 'Eve'] },
      { name: 'Stack Overflows', color: '#F4A261', members: ['Frank'] },
    ],
    categories: ['Movies', 'History', 'Code', 'Music', 'Food'].map(name => ({
      name,
      questions: Array.from({ length: 6 }, () => ({
        points: 100, question: 'q', options: ['a','b','c','d'], correctIndex: 0,
      })),
    })),
  };
}

function introState(phase, revealed) {
  return {
    pickerIndex: 0,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => Array(6).fill(false)),
    view: { name: 'INTRO', phase, revealed },
  };
}

// ---- TEAMS phase ----

test('renderIntro teams phase with revealed=0 shows no team names', () => {
  const html = renderIntro(cfg(), introState('teams', 0));
  assert.ok(!html.includes('Bug Squashers'));
  assert.ok(!html.includes('Null Pointers'));
});

test('renderIntro teams phase with revealed=1 shows only the first team', () => {
  const html = renderIntro(cfg(), introState('teams', 1));
  assert.ok(html.includes('Bug Squashers'));
  assert.ok(!html.includes('Null Pointers'));
  assert.ok(!html.includes('Stack Overflows'));
});

test('renderIntro teams phase reveals members of revealed teams', () => {
  const html = renderIntro(cfg(), introState('teams', 2));
  // Team 0 revealed → Alice and Bob should appear
  assert.ok(html.includes('Alice'));
  assert.ok(html.includes('Bob'));
  // Team 1 revealed → Carol, Dave, Eve
  assert.ok(html.includes('Carol'));
  assert.ok(html.includes('Dave'));
  assert.ok(html.includes('Eve'));
  // Team 2 NOT revealed → Frank should not appear
  assert.ok(!html.includes('Frank'));
});

test('renderIntro teams phase always renders 3 slots', () => {
  for (const r of [0, 1, 3]) {
    const html = renderIntro(cfg(), introState('teams', r));
    const slots = (html.match(/class="intro-slot/g) || []).length;
    assert.equal(slots, 3, `expected 3 team slots when revealed=${r}, got ${slots}`);
  }
});

test('renderIntro teams phase uses team color on revealed slots', () => {
  const html = renderIntro(cfg(), introState('teams', 3));
  assert.ok(html.includes('#E63946'));
  assert.ok(html.includes('#2A9D8F'));
  assert.ok(html.includes('#F4A261'));
});

test('renderIntro teams phase Next button when revealed < 3', () => {
  const html = renderIntro(cfg(), introState('teams', 1));
  assert.ok(html.includes('data-action="intro-advance"'));
  assert.ok(/>\s*Next\s*</.test(html));
});

test('renderIntro teams phase keeps Next label after all teams revealed', () => {
  // After all teams revealed, next click moves to categories phase — still "Next"
  const html = renderIntro(cfg(), introState('teams', 3));
  assert.ok(html.includes('data-action="intro-advance"'));
  assert.ok(/>\s*Next\s*</.test(html));
  assert.ok(!/Start game/.test(html));
});

test('renderIntro teams phase escapes team names and members', () => {
  const c = cfg();
  c.teams[0].name = '<script>x</script>';
  c.teams[0].members = ['<b>Mal</b>'];
  const html = renderIntro(c, introState('teams', 1));
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(!html.includes('<b>Mal</b>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&lt;b&gt;'));
});

// ---- CATEGORIES phase ----

test('renderIntro categories phase with revealed=0 shows no category names', () => {
  const html = renderIntro(cfg(), introState('categories', 0));
  assert.ok(!html.includes('Movies'));
  assert.ok(!html.includes('History'));
});

test('renderIntro categories phase with revealed=3 shows first three in order', () => {
  const html = renderIntro(cfg(), introState('categories', 3));
  const iMovies = html.indexOf('Movies');
  const iHistory = html.indexOf('History');
  const iCode = html.indexOf('Code');
  assert.ok(iMovies !== -1 && iHistory !== -1 && iCode !== -1);
  assert.ok(iMovies < iHistory && iHistory < iCode);
  assert.ok(!html.includes('Music'));
  assert.ok(!html.includes('Food'));
});

test('renderIntro categories phase with revealed=5 shows all categories', () => {
  const html = renderIntro(cfg(), introState('categories', 5));
  for (const name of ['Movies', 'History', 'Code', 'Music', 'Food']) {
    assert.ok(html.includes(name), `expected "${name}" in output`);
  }
});

test('renderIntro categories phase always renders 5 slots', () => {
  for (const r of [0, 1, 5]) {
    const html = renderIntro(cfg(), introState('categories', r));
    const slots = (html.match(/class="intro-slot/g) || []).length;
    assert.equal(slots, 5, `expected 5 category slots when revealed=${r}, got ${slots}`);
  }
});

test('renderIntro categories phase Next while revealed < 5', () => {
  const html = renderIntro(cfg(), introState('categories', 2));
  assert.ok(/>\s*Next\s*</.test(html));
  assert.ok(!/Start game/.test(html));
});

test('renderIntro categories phase Start game when revealed === 5', () => {
  const html = renderIntro(cfg(), introState('categories', 5));
  assert.ok(/Start game/i.test(html));
});

test('renderIntro categories phase escapes category names', () => {
  const c = cfg();
  c.categories[0].name = '<script>x</script>';
  const html = renderIntro(c, introState('categories', 1));
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
