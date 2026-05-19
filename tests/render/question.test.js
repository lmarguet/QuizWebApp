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

function stateInQuestion(viewName, category, question, verdict) {
  const view = { name: viewName, category, question };
  if (verdict) view.verdict = verdict;
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
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0));
  assert.ok(html.includes('Alpha'));
  assert.ok(html.includes('Beta'));
  assert.ok(html.includes('Gamma'));
  assert.ok(html.includes('Delta'));
  assert.ok(html.includes('>A<') || html.includes('>A '));
  assert.ok(html.includes('>D<') || html.includes('>D '));
});

test('renderQuestionOptions does NOT highlight any option', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0));
  assert.ok(!html.includes('data-correct="true"'));
});

test('renderQuestionOptions has Correct/Wrong/Back buttons', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0));
  assert.ok(html.includes('data-action="verdict-correct"'));
  assert.ok(html.includes('data-action="verdict-wrong"'));
  assert.ok(html.includes('data-action="back-to-board"'));
});

// QUESTION_REVIEW

test('renderQuestionReview highlights correct option', () => {
  // category 0, question 1 → correctIndex = 1 (Beta)
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, 'correct'));
  assert.ok(/data-option="1"[^>]*data-correct="true"/.test(html)
    || /data-correct="true"[^>]*data-option="1"/.test(html));
});

test('renderQuestionReview correct verdict banner mentions points and team', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, 'correct'));
  // question (0,1) has points 200; picker is 1 (Null Pointers)
  assert.ok(html.includes('200'));
  assert.ok(html.includes('Null Pointers'));
  assert.ok(html.toLowerCase().includes('correct'));
});

test('renderQuestionReview wrong verdict banner does not mention points', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, 'wrong'));
  assert.ok(html.toLowerCase().includes('wrong'));
});

test('renderQuestionReview has Continue button', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 0, 'wrong'));
  assert.ok(html.includes('data-action="continue"'));
});

test('renderQuestionText escapes question text', () => {
  const c = cfg();
  c.categories[0].questions[0].question = '<b>X</b>';
  const html = renderQuestionText(c, stateInQuestion('QUESTION_TEXT', 0, 0));
  assert.ok(!html.includes('<b>X</b>'));
  assert.ok(html.includes('&lt;b&gt;'));
});
