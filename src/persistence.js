export const STORAGE_KEY = 'jeopardy-app:state';

export function saveState(state, storage) {
  const payload = {
    pickerIndex: state.pickerIndex,
    scores: state.scores,
    answered: state.answered,
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadState(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw == null) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  if (typeof parsed.pickerIndex !== 'number') return null;
  if (!Array.isArray(parsed.scores) || parsed.scores.length !== 3) return null;
  if (!Array.isArray(parsed.answered) || parsed.answered.length !== 5) return null;
  if (!parsed.answered.every(r => Array.isArray(r) && r.length === 6)) return null;
  return {
    pickerIndex: parsed.pickerIndex,
    scores: parsed.scores,
    answered: parsed.answered,
  };
}

export function clearState(storage) {
  storage.removeItem(STORAGE_KEY);
}
