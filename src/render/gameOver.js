import { escapeHtml } from './board.js';

export function renderGameOver(config, state) {
  const teamsWithScores = config.teams.map((team, i) => ({
    name: team.name,
    color: team.color,
    score: state.scores[i] ?? 0,
    teamIndex: i,
  }));

  const sorted = teamsWithScores.slice().sort((a, b) => b.score - a.score);

  // Assign ranks with ties sharing the same rank.
  let lastScore = null;
  let lastRank = 0;
  const ranked = sorted.map((t, i) => {
    if (t.score !== lastScore) {
      lastRank = i + 1;
      lastScore = t.score;
    }
    return { ...t, rank: lastRank };
  });

  const rows = ranked.map(t => `
    <div class="game-over-row" data-team="${t.teamIndex}" data-rank="${t.rank}" style="border-left-color: ${escapeHtml(t.color)}">
      <div class="rank">#${t.rank}</div>
      <div class="team-name">${escapeHtml(t.name)}</div>
      <div class="team-score">${t.score}</div>
    </div>`).join('');

  return `<div class="game-over">
    <h1>Game over</h1>
    ${rows}
    <button class="btn" data-action="new-game">New game</button>
  </div>`;
}
