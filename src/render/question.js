import { escapeHtml } from './board.js';

function getQuestion(config, state) {
  return config.categories[state.view.category].questions[state.view.question];
}

function renderOptions(question, { highlightCorrect }) {
  return question.options.map((opt, i) => {
    const label = String.fromCharCode(65 + i); // A, B, C, ...
    const correctAttr = highlightCorrect && i === question.correctIndex ? ' data-correct="true"' : '';
    return `<div class="option" data-option="${i}"${correctAttr}>
      <span class="option-letter">${label}</span>
      <span class="option-text">${escapeHtml(opt)}</span>
    </div>`;
  }).join('');
}

export function renderQuestionText(config, state) {
  const q = getQuestion(config, state);
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    <div class="question-actions">
      <button class="btn" data-action="show-options">Show options</button>
      <button class="btn btn-secondary" data-action="back-to-board">Back to board</button>
    </div>
  </div>`;
}

export function renderQuestionOptions(config, state) {
  const q = getQuestion(config, state);
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    <div class="options-list">${renderOptions(q, { highlightCorrect: false })}</div>
    <div class="question-actions">
      <button class="btn btn-correct" data-action="verdict-correct">Correct</button>
      <button class="btn btn-wrong" data-action="verdict-wrong">Wrong</button>
      <button class="btn btn-secondary" data-action="back-to-board">Back to board</button>
    </div>
  </div>`;
}

export function renderQuestionReview(config, state) {
  const q = getQuestion(config, state);
  const team = config.teams[state.pickerIndex];
  const verdict = state.view.verdict;
  let banner;
  if (verdict === 'correct') {
    banner = `<div class="verdict verdict-correct">Correct! +${q.points} to ${escapeHtml(team.name)}</div>`;
  } else {
    banner = `<div class="verdict verdict-wrong">Wrong — no change</div>`;
  }
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    <div class="options-list">${renderOptions(q, { highlightCorrect: true })}</div>
    ${banner}
    <div class="question-actions">
      <button class="btn" data-action="continue">Continue</button>
    </div>
  </div>`;
}
