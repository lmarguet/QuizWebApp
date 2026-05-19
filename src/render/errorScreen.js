import { escapeHtml } from './board.js';

export function renderErrorScreen(errors) {
  const items = (errors || []).map(e => `<li>${escapeHtml(e)}</li>`).join('');
  return `<div class="error-screen">
    <h1>Cannot start: <code>game.json</code> has problems</h1>
    <p>Fix these issues and refresh the page.</p>
    <ul class="error-list">${items}</ul>
  </div>`;
}
