import { escapeHtml } from './board.js';

export function renderScoreboard(config, state) {
  const panels = config.teams.map((team, i) => {
    const active = i === state.pickerIndex ? ' data-active="true"' : '';
    const score = state.scores[i] ?? 0;
    return `<div class="team-panel" data-team="${i}"${active} style="border-left-color: ${escapeHtml(team.color)}">
      <div class="team-name">${escapeHtml(team.name)}</div>
      <div class="team-score">${score}</div>
    </div>`;
  }).join('');
  return `<aside class="scoreboard">${panels}</aside>`;
}
