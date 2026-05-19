export function createInitialState() {
  return {
    pickerIndex: 0,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => [false, false, false, false, false, false]),
    view: { name: 'BOARD' },
  };
}
