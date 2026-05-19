import { loadConfig } from './src/config.js';
import {
  createInitialState,
  applyVerdict,
  allAnswered,
  answeredCount,
} from './src/state.js';
import { saveState, loadState, clearState } from './src/persistence.js';
import { renderBoard } from './src/render/board.js';
import { renderScoreboard } from './src/render/scoreboard.js';
import {
  renderQuestionText,
  renderQuestionOptions,
  renderQuestionReview,
} from './src/render/question.js';
import { renderGameOver } from './src/render/gameOver.js';
import { renderErrorScreen } from './src/render/errorScreen.js';
import { renderIntro } from './src/render/intro.js';

const root = document.getElementById('root');

let config = null;
let state = null;

function render() {
  if (state.view.name === 'GAME_OVER') {
    root.innerHTML = `
      <div class="app">
        <header class="app-header">
          <span>Jeopardy</span>
        </header>
        <main class="app-main full-width">
          ${renderGameOver(config, state)}
        </main>
        <footer class="app-footer">
          <button class="btn btn-secondary" data-action="reset">Reset game</button>
          <span>${answeredCount(state)} of 30 answered</span>
        </footer>
      </div>
    `;
    return;
  }

  if (state.view.name === 'INTRO') {
    root.innerHTML = `
      <div class="app">
        <header class="app-header">
          <span>Jeopardy</span>
        </header>
        <main class="app-main full-width">
          ${renderIntro(config, state)}
        </main>
        <footer class="app-footer">
          <span></span>
          <span></span>
        </footer>
      </div>
    `;
    return;
  }

  const pickerName = config.teams[state.pickerIndex].name;
  let center;
  switch (state.view.name) {
    case 'BOARD':
      center = renderBoard(config, state);
      break;
    case 'QUESTION_TEXT':
      center = renderQuestionText(config, state);
      break;
    case 'QUESTION_OPTIONS':
      center = renderQuestionOptions(config, state);
      break;
    case 'QUESTION_REVIEW':
      center = renderQuestionReview(config, state);
      break;
    default:
      center = `<div>Unknown view: ${state.view.name}</div>`;
  }

  root.innerHTML = `
    <div class="app">
      <header class="app-header">
        <span>Jeopardy</span>
        <span class="picker">Up next: <span class="picker-name">${escapeText(pickerName)}</span></span>
      </header>
      <main class="app-main">
        <section class="app-board">${center}</section>
        ${renderScoreboard(config, state)}
      </main>
      <footer class="app-footer">
        <button class="btn btn-secondary" data-action="reset">Reset game</button>
        <span>${answeredCount(state)} of 30 answered</span>
      </footer>
    </div>
  `;
}

function escapeText(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : updater;
  if (state.view.name === 'BOARD' && allAnswered(state)) {
    state = { ...state, view: { name: 'GAME_OVER' } };
  }
  if (state.view.name !== 'INTRO') {
    saveState(state, window.localStorage);
  }
  render();
}

function handleTileClick(target) {
  if (target.getAttribute('data-answered') === 'true') return;
  const ci = Number(target.getAttribute('data-cat'));
  const qi = Number(target.getAttribute('data-q'));
  setState({ ...state, view: { name: 'QUESTION_TEXT', category: ci, question: qi } });
}

function handleAction(action, actionEl) {
  if (action === 'intro-advance') {
    if (state.view.name !== 'INTRO') return;
    const total = config.categories.length;
    if (state.view.revealed < total) {
      setState({ ...state, view: { ...state.view, revealed: state.view.revealed + 1 } });
    } else {
      setState({ ...state, view: { name: 'BOARD' } });
    }
    return;
  }
  if (action === 'show-options') {
    setState({ ...state, view: { ...state.view, name: 'QUESTION_OPTIONS', selectedIndex: null } });
    return;
  }
  if (action === 'select-option') {
    if (state.view.name !== 'QUESTION_OPTIONS') return;
    const idx = Number(actionEl.getAttribute('data-option'));
    setState({ ...state, view: { ...state.view, selectedIndex: idx } });
    return;
  }
  if (action === 'submit') {
    if (state.view.name !== 'QUESTION_OPTIONS') return;
    const { category, question, selectedIndex } = state.view;
    if (selectedIndex == null) return;
    const correctIndex = config.categories[category].questions[question].correctIndex;
    const verdict = selectedIndex === correctIndex ? 'correct' : 'wrong';
    setState({ ...state, view: { name: 'QUESTION_REVIEW', category, question, selectedIndex, verdict } });
    return;
  }
  if (action === 'back-to-board') {
    if (state.view.name === 'QUESTION_REVIEW') {
      const { category, question, verdict } = state.view;
      const points = config.categories[category].questions[question].points;
      const next = applyVerdict(state, category, question, verdict, points);
      setState({ ...next, view: { name: 'BOARD' } });
    } else {
      setState({ ...state, view: { name: 'BOARD' } });
    }
    return;
  }
  if (action === 'reset' || action === 'new-game') {
    if (!confirm('Reset game? All scores and answered tiles will be cleared.')) return;
    clearState(window.localStorage);
    setState({ ...createInitialState() });
    return;
  }
}

root.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (actionEl && root.contains(actionEl)) {
    if (actionEl.disabled) return;
    handleAction(actionEl.getAttribute('data-action'), actionEl);
    return;
  }
  const tile = e.target.closest('.tile');
  if (tile && root.contains(tile)) {
    handleTileClick(tile);
    return;
  }
});

async function init() {
  const result = await loadConfig(window.fetch.bind(window));
  if (!result.ok) {
    root.innerHTML = renderErrorScreen(result.errors);
    return;
  }
  config = result.config;
  const restored = loadState(window.localStorage);
  if (restored) {
    state = { ...restored, view: { name: 'BOARD' } };
    if (allAnswered(state)) {
      state = { ...state, view: { name: 'GAME_OVER' } };
    }
  } else {
    state = createInitialState();
  }
  render();
}

init();
