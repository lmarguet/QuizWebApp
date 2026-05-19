import { escapeHtml } from './board.js';

export function renderIntro(config, state) {
  const revealed = state.view.revealed;
  const slots = config.categories.map((cat, i) => {
    if (i < revealed) {
      return `<div class="intro-slot intro-slot-revealed">${escapeHtml(cat.name)}</div>`;
    }
    return `<div class="intro-slot intro-slot-hidden">?</div>`;
  }).join('');

  const buttonLabel = revealed >= config.categories.length ? 'Start game' : 'Next';

  return `<div class="intro">
    <h2 class="intro-title">Tonight's categories</h2>
    <div class="intro-list">${slots}</div>
    <button class="btn" data-action="intro-advance">${buttonLabel}</button>
  </div>`;
}
