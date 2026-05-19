import { escapeHtml } from './board.js';

function renderTeamSlot(team, revealed) {
  if (!revealed) {
    return `<div class="intro-slot intro-slot-team intro-slot-hidden">?</div>`;
  }
  const members = team.members.map(m => escapeHtml(m)).join(' · ');
  return `<div class="intro-slot intro-slot-team intro-slot-revealed" style="border-left-color: ${escapeHtml(team.color)}">
    <div class="intro-team-name">${escapeHtml(team.name)}</div>
    <div class="intro-team-members">${members}</div>
  </div>`;
}

function renderCategorySlot(name, revealed) {
  if (!revealed) {
    return `<div class="intro-slot intro-slot-category intro-slot-hidden">?</div>`;
  }
  return `<div class="intro-slot intro-slot-category intro-slot-revealed">${escapeHtml(name)}</div>`;
}

export function renderIntro(config, state) {
  const { phase, revealed } = state.view;

  let title;
  let slots;
  let buttonLabel;

  if (phase === 'teams') {
    title = "Tonight's teams";
    slots = config.teams
      .map((team, i) => renderTeamSlot(team, i < revealed))
      .join('');
    // Next click after all teams shown moves to categories phase — still "Next"
    buttonLabel = 'Next';
  } else {
    title = "Tonight's categories";
    slots = config.categories
      .map((cat, i) => renderCategorySlot(cat.name, i < revealed))
      .join('');
    buttonLabel = revealed >= config.categories.length ? 'Start game' : 'Next';
  }

  return `<div class="intro">
    <h2 class="intro-title">${title}</h2>
    <div class="intro-list">${slots}</div>
    <button class="btn" data-action="intro-advance">${buttonLabel}</button>
  </div>`;
}
