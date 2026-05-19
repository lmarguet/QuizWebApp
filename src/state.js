export function createInitialState() {
  return {
    pickerIndex: 0,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => [false, false, false, false, false, false]),
    view: { name: 'BOARD' },
  };
}

export function applyVerdict(state, categoryIdx, questionIdx, verdict, points) {
  const scores = state.scores.slice();
  if (verdict === 'correct') {
    scores[state.pickerIndex] = scores[state.pickerIndex] + points;
  }
  const answered = state.answered.map(row => row.slice());
  answered[categoryIdx][questionIdx] = true;
  const pickerIndex = (state.pickerIndex + 1) % 3;
  return { ...state, scores, answered, pickerIndex };
}
