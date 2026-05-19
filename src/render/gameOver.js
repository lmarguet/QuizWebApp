import { escapeHtml } from './board.js';

function isAllAnswered(state) {
  return state.answered.every(row => row.every(v => v === true));
}

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

  const topTeams = ranked.filter(t => t.rank === 1);
  let header;
  if (topTeams.length === 1) {
    const w = topTeams[0];
    header = `<h1 class="game-over-title">Winner: <span class="winner-name" style="color: ${escapeHtml(w.color)}">${escapeHtml(w.name)}</span></h1>`;
  } else {
    const names = topTeams
      .map(t => `<span style="color: ${escapeHtml(t.color)}">${escapeHtml(t.name)}</span>`)
      .join(' &middot; ');
    header = `<h1 class="game-over-title">It's a tie!</h1>
      <div class="tie-names">${names}</div>`;
  }

  const rows = ranked.map(t => `
    <div class="game-over-row" data-team="${t.teamIndex}" data-rank="${t.rank}" style="border-left-color: ${escapeHtml(t.color)}">
      <div class="rank">#${t.rank}</div>
      <div class="team-name">${escapeHtml(t.name)}</div>
      <div class="team-score">${t.score}</div>
    </div>`).join('');

  const actions = isAllAnswered(state)
    ? `<button class="btn" data-action="new-game">New game</button>`
    : `<button class="btn btn-secondary" data-action="back-to-board">Back to board</button>
       <button class="btn" data-action="new-game">New game</button>`;

  return `<div class="game-over">
    ${header}
    ${rows}
    <div class="game-over-actions">${actions}</div>
  </div>`;
}
