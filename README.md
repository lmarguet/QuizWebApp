# Jeopardy App

A single-screen, locally-run web app for hosting a multiple-choice Jeopardy-style game over Zoom screenshare. 3 teams pick from a 5-category × 6-question board (30 questions total). Each question has 3–5 multiple-choice options. Content is fully driven by `game.json`.

## Run it

You need a local static HTTP server (any will do). Examples:

```bash
# Option A: Node (npx, no install)
npx serve . -l 3000

# Option B: Python 3
python3 -m http.server 3000
```

Open `http://localhost:3000` in your browser, then screenshare that browser tab in Zoom.

To run the tests:

```bash
npm test
```

## Edit `game.json`

`game.json` is the source of truth for teams, categories, and questions. Edit it in any text editor.

### Schema rules

- **`teams`** — exactly 3 entries. Each is `{ "name": string, "color": string, "members": [string, ...] }`. `color` is any valid CSS color (`#E63946`, `red`, `rgb(...)`). `members` is a non-empty list of names that gets shown during the opening teams reveal.
- **`categories`** — exactly 5 entries. Each is `{ "name": string, "questions": [...] }`.
- **`questions`** — exactly 6 entries per category. Each question is:
  ```json
  {
    "points": 100,
    "question": "Which 1994 film features a character named Forrest?",
    "options": ["Pulp Fiction", "Forrest Gump", "The Lion King", "Speed"],
    "correctIndex": 1
  }
  ```
  - `points` — non-negative integer. Each question carries its own value (use this to encode difficulty).
  - `options` — 3 to 5 strings.
  - `correctIndex` — **0-based** index into `options`. In the example above, `correctIndex: 1` means **"Forrest Gump"** is correct (because it is the second entry, at index `1`).

If you change the JSON between game sessions and want a clean slate (no leftover scores/answered tiles from a previous game), click **Reset game** in the footer after the page loads.

## Game flow

1. Board appears. Header shows whose turn it is to pick.
2. Click a tile. Question prompt appears alone.
3. Click **Show options** when the team is ready to commit. Options A–E appear.
4. Listen to the team's verbal answer. Click **Correct** or **Wrong**.
5. The correct option highlights green and a verdict banner appears. Click **Continue**.
6. Points are awarded (if correct), tile is greyed out, and the next team becomes the picker.
7. After all 30 questions are answered, a Game Over screen shows the final ranking.

A **Back to board** button is available on the question screens in case you click the wrong tile. It returns to the board without marking the tile answered or rotating the picker.

## Reset / new game

- **Reset game** (footer button) — wipes scores, marks all tiles unanswered, returns the picker to Team 1, clears saved state.
- **New game** (Game Over screen) — same as Reset.

## Troubleshooting

### "Cannot start: game.json has problems"

The app couldn't load `game.json`. Read each error message (e.g. `"categories[2].questions[4].correctIndex is 5 but options has 4 entries"`), open `game.json`, fix the listed issues, then refresh the browser. The list shows every problem at once so you can fix them in one pass.

### Scores or tiles unexpectedly persist

The app saves state to `localStorage` between page loads so an accidental refresh doesn't wipe your event. To start fresh, click **Reset game** in the footer. If you've cleared site data in your browser, the state will also be gone.
