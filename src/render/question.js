import { escapeHtml } from './board.js';

function getQuestion(config, state) {
  return config.categories[state.view.category].questions[state.view.question];
}

function renderImage(question) {
  if (!question.image) return '';
  return `<img class="question-image" src="${escapeHtml(question.image)}" alt="">`;
}

function renderOptions(question, mode) {
  return question.options.map((opt, i) => {
    const label = String.fromCharCode(65 + i); // A, B, C, ...
    const attrs = [`data-option="${i}"`];

    if (mode.name === 'select') {
      attrs.push('data-action="select-option"');
      if (mode.selectedIndex === i) attrs.push('data-selected="true"');
    } else { // 'review'
      if (i === question.correctIndex) attrs.push('data-correct="true"');
      if (mode.selectedIndex !== question.correctIndex && i === mode.selectedIndex) {
        attrs.push('data-wrong-selection="true"');
      }
    }

    return `<div class="option" ${attrs.join(' ')}>
      <span class="option-letter">${label}</span>
      <span class="option-text">${escapeHtml(opt)}</span>
    </div>`;
  }).join('');
}

export function renderQuestionText(config, state) {
  const q = getQuestion(config, state);
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    ${renderImage(q)}
    <div class="question-actions">
      <button class="btn" data-action="show-options">Show options</button>
      <button class="btn btn-secondary" data-action="back-to-board">Back to board</button>
    </div>
  </div>`;
}

export function renderQuestionOptions(config, state) {
  const q = getQuestion(config, state);
  const selectedIndex = state.view.selectedIndex ?? null;
  const submitDisabled = selectedIndex === null ? ' disabled' : '';
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    ${renderImage(q)}
    <div class="options-list">${renderOptions(q, { name: 'select', selectedIndex })}</div>
    <div class="question-actions">
      <button class="btn" data-action="submit"${submitDisabled}>Submit</button>
      <button class="btn btn-secondary" data-action="back-to-board">Back to board</button>
    </div>
  </div>`;
}

export function renderQuestionReview(config, state) {
  const q = getQuestion(config, state);
  const team = config.teams[state.pickerIndex];
  const verdict = state.view.verdict;
  const selectedIndex = state.view.selectedIndex;
  const banner = verdict === 'correct'
    ? `<div class="verdict verdict-correct">Correct! +${q.points} to ${escapeHtml(team.name)}</div>`
    : `<div class="verdict verdict-wrong">Wrong — 0 points</div>`;
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    ${renderImage(q)}
    <div class="options-list">${renderOptions(q, { name: 'review', selectedIndex })}</div>
    ${banner}
    <div class="question-actions">
      <button class="btn" data-action="back-to-board">Back to board</button>
    </div>
  </div>`;
}
