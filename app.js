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
let previousScores = null;
let previousViewKey = null;

function fireConfetti() {
  const baseColors = ['#f4a261', '#2A9D8F', '#E63946', '#ffffff', '#ffd166', '#06d6a0', '#118ab2'];
  const teamColors = (config && config.teams) ? config.teams.map(t => t.color) : [];
  const palette = [...teamColors, ...baseColors];
  const count = 90;
  const container = document.createElement('div');
  container.className = 'confetti-container';

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.backgroundColor = palette[Math.floor(Math.random() * palette.length)];
    piece.style.left = (Math.random() * 100) + 'vw';
    piece.style.setProperty('--delay', (Math.random() * 0.4) + 's');
    piece.style.setProperty('--duration', (2.2 + Math.random() * 1.8) + 's');
    piece.style.setProperty('--drift', ((Math.random() * 400) - 200) + 'px');
    piece.style.setProperty('--rotation', ((Math.random() * 1440) - 720) + 'deg');
    container.appendChild(piece);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), 5000);
}

function viewKey(view) {
  return [view.name, view.category, view.question, view.verdict, view.phase, view.revealed].join('|');
}

function animateScoreCount(el, from, to, duration = 700) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.classList.remove('score-animating');
    }
  }
  el.classList.add('score-animating');
  el.textContent = String(from);
  requestAnimationFrame(step);
}

function applyScoreAnimations() {
  if (!previousScores) return;
  state.scores.forEach((newScore, i) => {
    if (newScore > previousScores[i]) {
      const el = root.querySelector(`.team-panel[data-team="${i}"] .team-score`);
      if (el) animateScoreCount(el, previousScores[i], newScore);
    }
  });
}

function renderHTML() {
  if (state.view.name === 'GAME_OVER') {
    return `
      <div class="app">
        <header class="app-header">
          <span>Team Quiz</span>
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
  }

  if (state.view.name === 'INTRO') {
    return `
      <div class="app">
        <header class="app-header">
          <span>Team Quiz</span>
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

  return `
    <div class="app">
      <header class="app-header">
        <span>Team Quiz</span>
        <span class="picker">Up next: <span class="picker-name">${escapeText(pickerName)}</span></span>
      </header>
      <main class="app-main">
        <section class="app-board">${center}</section>
        ${renderScoreboard(config, state)}
      </main>
      <footer class="app-footer">
        <div class="footer-actions">
          <button class="btn btn-secondary" data-action="reset">Reset game</button>
          <button class="btn btn-secondary" data-action="show-results">Show results</button>
        </div>
        <span>${answeredCount(state)} of 30 answered</span>
      </footer>
    </div>
  `;
}

function render() {
  root.innerHTML = renderHTML();
  applyScoreAnimations();
  previousScores = state.scores.slice();

  const currentKey = viewKey(state.view);
  if (
    state.view.name === 'QUESTION_REVIEW'
    && state.view.verdict === 'correct'
    && currentKey !== previousViewKey
  ) {
    fireConfetti();
  }
  previousViewKey = currentKey;
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
    const { phase, revealed } = state.view;
    const total = phase === 'teams' ? config.teams.length : config.categories.length;
    if (revealed < total) {
      setState({ ...state, view: { ...state.view, revealed: revealed + 1 } });
    } else if (phase === 'teams') {
      setState({ ...state, view: { name: 'INTRO', phase: 'categories', revealed: 0 } });
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
  if (action === 'show-results') {
    setState({ ...state, view: { name: 'GAME_OVER' } });
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
