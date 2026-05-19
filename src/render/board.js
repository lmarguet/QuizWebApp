export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderBoard(config, state) {
  const headers = config.categories
    .map(cat => `<div class="cat">${escapeHtml(cat.name)}</div>`)
    .join('');

  const tiles = [];
  for (let qi = 0; qi < 6; qi++) {
    for (let ci = 0; ci < 5; ci++) {
      const answered = state.answered[ci][qi];
      const points = config.categories[ci].questions[qi].points;
      if (answered) {
        tiles.push(
          `<div class="tile done" data-cat="${ci}" data-q="${qi}" data-answered="true">—</div>`
        );
      } else {
        tiles.push(
          `<div class="tile" data-cat="${ci}" data-q="${qi}">${points}</div>`
        );
      }
    }
  }

  return `<div class="board">${headers}${tiles.join('')}</div>`;
}
