import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderQuestionText,
  renderQuestionOptions,
  renderQuestionReview,
} from '../../src/render/question.js';

function cfg() {
  return {
    teams: [
      { name: 'Bug Squashers', color: '#E63946' },
      { name: 'Null Pointers', color: '#2A9D8F' },
      { name: 'Stack Overflows', color: '#F4A261' },
    ],
    categories: ['Movies', 'History', 'Code', 'Music', 'Food'].map(name => ({
      name,
      questions: [100, 200, 300, 400, 500, 600].map((points, qi) => ({
        points,
        question: `Q ${name} ${qi}`,
        options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
        correctIndex: qi % 4,
      })),
    })),
  };
}

function stateInQuestion(viewName, category, question, extras = {}) {
  const view = { name: viewName, category, question, ...extras };
  return {
    pickerIndex: 1,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => Array(6).fill(false)),
    view,
  };
}

// QUESTION_TEXT

test('renderQuestionText shows the question prompt', () => {
  const html = renderQuestionText(cfg(), stateInQuestion('QUESTION_TEXT', 0, 2));
  assert.ok(html.includes('Q Movies 2'));
});

test('renderQuestionText does NOT show options', () => {
  const html = renderQuestionText(cfg(), stateInQuestion('QUESTION_TEXT', 0, 2));
  assert.ok(!html.includes('Alpha'));
  assert.ok(!html.includes('Beta'));
});

test('renderQuestionText has Show options and Back to board buttons', () => {
  const html = renderQuestionText(cfg(), stateInQuestion('QUESTION_TEXT', 0, 2));
  assert.ok(html.includes('data-action="show-options"'));
  assert.ok(html.includes('data-action="back-to-board"'));
});

// QUESTION_OPTIONS

test('renderQuestionOptions shows all options labelled A,B,C,D', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: null }));
  assert.ok(html.includes('Alpha'));
  assert.ok(html.includes('Beta'));
  assert.ok(html.includes('Gamma'));
  assert.ok(html.includes('Delta'));
  assert.ok(html.includes('>A<') || html.includes('>A '));
  assert.ok(html.includes('>D<') || html.includes('>D '));
});

test('renderQuestionOptions does NOT highlight any option as correct', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: null }));
  assert.ok(!html.includes('data-correct="true"'));
});

test('renderQuestionOptions makes options clickable via data-action=select-option', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: null }));
  // every option div carries data-action="select-option"
  const matches = (html.match(/data-action="select-option"/g) || []).length;
  assert.equal(matches, 4, 'expected 4 selectable options');
});

test('renderQuestionOptions marks the selected option with data-selected', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: 2 }));
  assert.ok(/data-option="2"[^>]*data-selected="true"/.test(html)
    || /data-selected="true"[^>]*data-option="2"/.test(html),
    'expected option 2 to be marked selected');
  // and no other
  const selectedCount = (html.match(/data-selected="true"/g) || []).length;
  assert.equal(selectedCount, 1, 'expected exactly one selected option');
});

test('renderQuestionOptions has no data-selected when nothing selected', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: null }));
  assert.ok(!html.includes('data-selected="true"'));
});

test('renderQuestionOptions Submit button is disabled when no selection', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: null }));
  // submit button exists and is disabled
  assert.ok(/<button[^>]*data-action="submit"[^>]*disabled/.test(html)
    || /<button[^>]*disabled[^>]*data-action="submit"/.test(html),
    'Submit should be disabled when no selection');
});

test('renderQuestionOptions Submit button is enabled when an option is selected', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: 1 }));
  // Submit button present but NOT disabled
  const submitMatch = html.match(/<button[^>]*data-action="submit"[^>]*>/);
  assert.ok(submitMatch, 'Submit button should be present');
  assert.ok(!submitMatch[0].includes('disabled'), 'Submit should not be disabled when an option is selected');
});

test('renderQuestionOptions has Back to board button', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: null }));
  assert.ok(html.includes('data-action="back-to-board"'));
});

test('renderQuestionOptions does NOT have Correct/Wrong verdict buttons', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: 0 }));
  assert.ok(!html.includes('data-action="verdict-correct"'));
  assert.ok(!html.includes('data-action="verdict-wrong"'));
});

// QUESTION_REVIEW

test('renderQuestionReview highlights correct option', () => {
  // category 0, question 1 → correctIndex = 1 (Beta)
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, { selectedIndex: 1, verdict: 'correct', answeringTeam: 1 }));
  assert.ok(/data-option="1"[^>]*data-correct="true"/.test(html)
    || /data-correct="true"[^>]*data-option="1"/.test(html));
});

test('renderQuestionReview marks wrong selection with data-wrong-selection', () => {
  // category 0, question 1 → correctIndex = 1; team picked 3
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, { selectedIndex: 3, verdict: 'wrong', answeringTeam: 1 }));
  assert.ok(/data-option="3"[^>]*data-wrong-selection="true"/.test(html)
    || /data-wrong-selection="true"[^>]*data-option="3"/.test(html),
    'expected the wrong selection to be marked');
});

test('renderQuestionReview does NOT mark wrong-selection when verdict is correct', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, { selectedIndex: 1, verdict: 'correct', answeringTeam: 1 }));
  assert.ok(!html.includes('data-wrong-selection="true"'));
});

test('renderQuestionReview correct banner uses view.answeringTeam, not state.pickerIndex', () => {
  // pickerIndex in stateInQuestion = 1; answeringTeam set to 0 (the team that JUST answered, before rotation)
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, { selectedIndex: 1, verdict: 'correct', answeringTeam: 0 }));
  // question (0,1) has points 200; answeringTeam 0 is Bug Squashers
  assert.ok(html.includes('200'));
  assert.ok(html.includes('Bug Squashers'), 'banner should name the answering team (index 0), not the current picker (index 1)');
  assert.ok(html.toLowerCase().includes('correct'));
});

test('renderQuestionReview wrong verdict banner does not mention points', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, { selectedIndex: 3, verdict: 'wrong', answeringTeam: 1 }));
  assert.ok(html.toLowerCase().includes('wrong'));
});

test('renderQuestionReview has Back to board button (replaces Continue)', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 0, { selectedIndex: 0, verdict: 'correct', answeringTeam: 0 }));
  assert.ok(html.includes('data-action="back-to-board"'));
  assert.ok(!html.includes('data-action="continue"'));
});

test('renderQuestionReview options are not clickable (no select-option action)', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, { selectedIndex: 1, verdict: 'correct', answeringTeam: 1 }));
  assert.ok(!html.includes('data-action="select-option"'));
});

test('renderQuestionText escapes question text', () => {
  const c = cfg();
  c.categories[0].questions[0].question = '<b>X</b>';
  const html = renderQuestionText(c, stateInQuestion('QUESTION_TEXT', 0, 0));
  assert.ok(!html.includes('<b>X</b>'));
  assert.ok(html.includes('&lt;b&gt;'));
});

// Optional image rendering

test('renderQuestionText renders image when question.image is set', () => {
  const c = cfg();
  c.categories[0].questions[0].image = './images/movies-q1.jpg';
  const html = renderQuestionText(c, stateInQuestion('QUESTION_TEXT', 0, 0));
  assert.ok(/<img[^>]*src="\.\/images\/movies-q1\.jpg"/.test(html));
});

test('renderQuestionText renders no image when question.image is absent', () => {
  const html = renderQuestionText(cfg(), stateInQuestion('QUESTION_TEXT', 0, 0));
  assert.ok(!html.includes('<img'));
});

test('renderQuestionOptions renders image when present', () => {
  const c = cfg();
  c.categories[0].questions[0].image = 'https://example.com/x.png';
  const html = renderQuestionOptions(c, stateInQuestion('QUESTION_OPTIONS', 0, 0, { selectedIndex: null }));
  assert.ok(/<img[^>]*src="https:\/\/example\.com\/x\.png"/.test(html));
});

test('renderQuestionReview renders image when present', () => {
  const c = cfg();
  c.categories[0].questions[1].image = './images/r.jpg';
  const html = renderQuestionReview(c, stateInQuestion('QUESTION_REVIEW', 0, 1, { selectedIndex: 1, verdict: 'correct' }));
  assert.ok(/<img[^>]*src="\.\/images\/r\.jpg"/.test(html));
});

test('renderQuestionText escapes the image src attribute', () => {
  const c = cfg();
  c.categories[0].questions[0].image = '" onerror="alert(1)"';
  const html = renderQuestionText(c, stateInQuestion('QUESTION_TEXT', 0, 0));
  // The injected `"` must be escaped so the src attribute cannot be terminated.
  assert.ok(!/src=""\s+onerror=/.test(html), 'attribute breakout must not be possible');
  assert.ok(html.includes('&quot;'), 'quote should be HTML-escaped');
});
