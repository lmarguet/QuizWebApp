# Jeopardy App

A single-screen, locally-run web app for hosting a multiple-choice Jeopardy-style game over Zoom screenshare. 3 teams pick from a 5-category × 6-question board (30 questions total). Each question has 2–5 multiple-choice options. **Content is fully driven by `game.json`** — edit that file to set up your own teams, categories, and questions.

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

## Editing `game.json`

`game.json` is the single source of truth for **teams** and **questions**. Open it in any text editor — it's plain JSON.

The file has two top-level keys: `teams` (exactly 3) and `categories` (exactly 5, each with exactly 6 questions). Customize the names, colors, and questions; the rest of the app picks up your changes on the next page load.

> Tip: after editing the JSON between game sessions, click **Reset game** in the footer to clear any leftover scores or answered tiles from the previous game.

### Editing teams

```json
"teams": [
  { "name": "Team Red",   "color": "#E63946", "members": ["Alice", "Bob", "Carol"] },
  { "name": "Team Green", "color": "#2A9D8F", "members": ["Dan", "Eve"] },
  { "name": "Team Blue",  "color": "#3A86FF", "members": ["Frank", "Grace", "Heidi", "Ivan"] }
]
```

- **Exactly 3 teams.** The app is built around a 3-team rotation.
- **`name`** — anything you want; shown in the header and scoreboard.
- **`color`** — any valid CSS color (`#E63946`, `red`, `rgb(230, 57, 70)`). Used as the team's accent color.
- **`members`** — at least 1 name. Shown during the opening teams reveal animation.

### Editing questions

Each of the 5 categories has exactly 6 questions, typically with point values `100, 200, 300, 500, 700, 1000` (use any non-negative integers you like). A question looks like this:

```json
{
  "points": 200,
  "question": "Which 1994 film features a character named Forrest?",
  "options": ["Pulp Fiction", "Forrest Gump", "The Lion King", "Speed"],
  "correctIndex": 1
}
```

- **`points`** — non-negative integer. This is what the team earns if they answer correctly.
- **`question`** — the prompt shown on screen.
- **`options`** — between 2 and 5 strings. The app labels them A through E in order.
- **`correctIndex`** — **0-based** index into `options`. In the example above, `correctIndex: 1` points to `"Forrest Gump"` (the second entry).

#### Adding an image to a question

Any question can include an optional `image` field. It's used directly as the `<img src>` and shown beneath the prompt on the question screens.

```json
{
  "points": 300,
  "question": "Which country's flag is shown here?",
  "options": ["Japan", "China", "South Korea", "Vietnam"],
  "correctIndex": 0,
  "image": "./images/example-flag.svg"
}
```

Either a relative path (drop the file into the `images/` folder next to `game.json`) or any URL works. The default `game.json` ships with one image example — see the Geography category.

### Full minimal example

```json
{
  "teams": [
    { "name": "Team Red",   "color": "#E63946", "members": ["Alice"] },
    { "name": "Team Green", "color": "#2A9D8F", "members": ["Bob"] },
    { "name": "Team Blue",  "color": "#3A86FF", "members": ["Carol"] }
  ],
  "categories": [
    {
      "name": "Geography",
      "questions": [
        { "points": 100,  "question": "Capital of France?",   "options": ["Berlin", "Paris", "Rome"], "correctIndex": 1 },
        { "points": 200,  "question": "Largest ocean?",       "options": ["Atlantic", "Pacific", "Indian"], "correctIndex": 1 },
        { "points": 300,  "question": "Continent of Egypt?",  "options": ["Asia", "Africa", "Europe"], "correctIndex": 1 },
        { "points": 500,  "question": "Capital of Japan?",    "options": ["Kyoto", "Osaka", "Tokyo"], "correctIndex": 2 },
        { "points": 700,  "question": "Longest river?",       "options": ["Nile", "Amazon", "Yangtze"], "correctIndex": 0 },
        { "points": 1000, "question": "Smallest country?",    "options": ["Monaco", "Vatican City", "San Marino"], "correctIndex": 1 }
      ]
    }
    // ... 4 more categories with the same shape
  ]
}
```

## Game flow

1. Board appears. Header shows whose turn it is to pick.
2. Click a tile. The question prompt appears alone.
3. Click **Show options** when the team is ready to commit. Options A–E appear.
4. Listen to the team's verbal answer. Click **Correct** or **Wrong**.
5. The correct option highlights green and a verdict banner appears. Click **Continue**.
6. Points are awarded (if correct), the tile is greyed out, and the next team becomes the picker.
7. After all 30 questions are answered, a Game Over screen shows the final ranking.

A **Back to board** button is available on the question screens in case you click the wrong tile. It returns to the board without marking the tile answered or rotating the picker.

## Reset / new game

- **Reset game** (footer button) — wipes scores, marks all tiles unanswered, returns the picker to Team 1, clears saved state.
- **New game** (Game Over screen) — same as Reset.

## Troubleshooting

### "Cannot start: game.json has problems"

The app couldn't load `game.json`. Read each error message (e.g. `"categories[2].questions[4].correctIndex is 5 but options has 4 entries"`), open `game.json`, fix the listed issues, then refresh the browser. The list shows every problem at once so you can fix them in one pass.

Common mistakes:

- Trailing comma after the last item in an array or object — JSON doesn't allow it.
- `correctIndex` written as 1-based (e.g. `1` for the first option) — it's **0-based**, so the first option is `0`.
- The wrong number of teams (must be 3), categories (must be 5), or questions per category (must be 6).

### Scores or tiles unexpectedly persist

The app saves state to `localStorage` between page loads so an accidental refresh doesn't wipe your event. To start fresh, click **Reset game** in the footer. If you've cleared site data in your browser, the state will also be gone.
