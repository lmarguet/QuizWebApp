# Jeopardy App — Design

A single-screen, locally-run web app for hosting a multiple-choice Jeopardy-style game over Zoom screenshare during a work event.

## Goals

- Host runs the app locally and screenshares the browser tab over Zoom.
- 3 teams take turns picking from a 5-category × 6-question board (30 questions total).
- Each question shows one prompt and 3–5 multiple-choice options.
- Each question has its own point value (encodes difficulty).
- Teams, categories, and questions are fully driven by a hand-edited `game.json` file.
- Scores and answered-tile state survive an accidental tab refresh.
- One-shot tool for one event — no auth, no users, no backend, no analytics.

## Out of scope

- Wagering, Daily Doubles, Final Jeopardy.
- Per-question timers (may be added later; explicitly deferred).
- Separate host/player views, buzzers, or any networked multi-device interaction.
- Question editing inside the app (the JSON is the source of truth).
- Sound effects, animations beyond the minimum needed for clarity.

## Tech stack

Vanilla HTML / CSS / JavaScript. No framework, no build step, no package.json required for runtime. Served as static files by any local HTTP server (e.g. `npx serve .` or `python3 -m http.server`).

The only reason a static server is needed is that `fetch('./game.json')` from a `file://` page is blocked in modern browsers.

## File structure

```
Jeopardy-App/
├── index.html        # app shell, single page
├── style.css         # all styles
├── app.js            # all game logic — state, rendering, event handlers
├── game.json         # editable: teams, categories, questions
├── README.md         # how to run, how to edit game.json
└── .gitignore        # ignores .superpowers/
```

`app.js` is a single file. It can be organized into top-level functions (`loadConfig`, `validateConfig`, `renderBoard`, `renderQuestion`, `renderGameOver`, `handleTileClick`, `handleScore`, `saveState`, `loadState`, `resetGame`) but does not need to be modularized further at this scope.

## JSON config format

`game.json` is the authoritative source for everything content-related.

```json
{
  "teams": [
    { "name": "The Bug Squashers", "color": "#E63946" },
    { "name": "Null Pointers",     "color": "#2A9D8F" },
    { "name": "Stack Overflows",   "color": "#F4A261" }
  ],
  "categories": [
    {
      "name": "Movies",
      "questions": [
        {
          "points": 100,
          "question": "Which 1994 film features a character named Forrest?",
          "options": [
            "Pulp Fiction",
            "Forrest Gump",
            "The Lion King",
            "Speed"
          ],
          "correctIndex": 1
        }
        // 5 more questions in this category, 6 total
      ]
    }
    // 4 more categories, 5 total
  ]
}
```

### Field rules

- `teams`: exactly 3 entries. Each has `name` (string) and `color` (any valid CSS color string).
- `categories`: exactly 5 entries. Each has `name` (string) and `questions` (exactly 6 entries).
- `questions[].points`: integer ≥ 0. Each question carries its own value; there is no per-row convention.
- `questions[].question`: the prompt text shown to all players.
- `questions[].options`: array of 3 to 5 strings.
- `questions[].correctIndex`: integer, 0-based, must satisfy `0 <= correctIndex < options.length`.

### Identification

Teams and questions are identified by array position. There are no IDs in the JSON.

### Validation

On app start, after `fetch('./game.json')` resolves, the config is validated against the rules above. On any violation, the app renders a clear error screen listing every problem (e.g. "categories[2].questions[4].correctIndex is 5 but only 4 options were provided") rather than the board, so problems are discovered before the event begins.

## Game flow

### Screens (states)

1. **BOARD** — main game view. Shows the 5×6 grid of point tiles, the sidebar scoreboard, and which team is up next.
2. **QUESTION_TEXT** — a tile has been opened. Shows the question prompt large, with a host button: **Show options**.
3. **QUESTION_OPTIONS** — same question, with the 3–5 multiple-choice options revealed (labelled A, B, C, …). Host buttons: **Correct**, **Wrong**.
4. **GAME_OVER** — replaces BOARD once all 30 questions have been answered. Shows teams ranked by score, winning team's name and color featured at the top, and a **New game** button.

### Per-question flow

```
BOARD
  └─ host clicks an un-answered tile
     └─ QUESTION_TEXT
        ├─ host clicks "Show options"  → QUESTION_OPTIONS
        └─ host clicks "Back to board" → BOARD (tile NOT marked answered)

QUESTION_OPTIONS
  ├─ host clicks "Correct"
  │    ├─ correct option is highlighted (visual confirmation), ~1.5s pause
  │    ├─ picking team's score += question.points
  │    ├─ tile is marked answered
  │    ├─ picker rotates 1 → 2 → 3 → 1
  │    ├─ state saved to localStorage
  │    └─ return to BOARD (or GAME_OVER if all 30 answered)
  ├─ host clicks "Wrong"
  │    ├─ correct option is highlighted (visual confirmation), ~1.5s pause
  │    ├─ no score change
  │    ├─ tile is marked answered
  │    ├─ picker rotates 1 → 2 → 3 → 1
  │    ├─ state saved to localStorage
  │    └─ return to BOARD (or GAME_OVER if all 30 answered)
  └─ host clicks "Back to board"
       └─ return to BOARD (tile NOT marked answered, no score change, picker does not rotate)
```

### Picker rotation

- Picker starts at team index 0.
- Advances by `+1 (mod 3)` after every scored question (Correct or Wrong). Not affected by the "Back to board" escape hatch.
- The current picker is shown by name in the header and outlined in their team color in the sidebar scoreboard.

### Reset

- A **Reset game** button is always visible in the footer.
- Clicking it prompts for confirmation, then: zeros all scores, marks all tiles unanswered, resets picker to team 0, returns to BOARD, and clears `localStorage`.

## UI layout

**Layout B (sidebar scoreboard):**

```
┌──────────────────────────────────────────────────────────────┐
│  JEOPARDY — Up next: Null Pointers                           │  ← header
├──────────────────────────────────────────────┬───────────────┤
│                                              │ Bug Squashers │
│   Movies   History   Code   Music   Food     │ 300           │
│   ────────────────────────────────────       │               │
│    100      100      100     —      100      │ Null Pointers │
│    200       —       200    200     200      │ 500    ← up   │
│    300      300       —     300     300      │               │
│    400      400      400    400      —       │ Stack Overflw │
│    500      500      500    500     500      │ 200           │
│                                              │               │
├──────────────────────────────────────────────┴───────────────┤
│  [ Reset game ]                       Question 6 / 30        │  ← footer
└──────────────────────────────────────────────────────────────┘
```

- Board takes roughly 3/4 of the horizontal space; sidebar takes 1/4.
- Each team panel in the sidebar has a colored left border (the team's `color`).
- The picking team gets an additional bright outline (orange) so it pops on screenshare.
- Answered tiles show a dash (`—`) on a darker background and are not clickable.

**On QUESTION screens** the sidebar scoreboard and footer remain visible; only the central board area is replaced by the question/options display and the host action buttons.

### Visual design

- Dark background (classic game-show feel, easier on eyes during a long meeting).
- Large type for question text and option labels — must be readable when the browser tab is scaled down in a Zoom share.
- Options are labelled A, B, C, D, E in the order they appear in the JSON.
- The "Correct" highlight is the only state where any option is tinted (green, distinctive). All other times the options are visually equal — no spoilers.

## State and persistence

### Runtime state shape

```js
{
  pickerIndex: 0,             // 0, 1, or 2
  scores: [0, 0, 0],          // index aligns with teams[]
  answered: [                 // 5 categories × 6 questions of booleans
    [false, false, false, false, false, false],
    // ...4 more
  ],
  view: { name: 'BOARD' }
  // or { name: 'QUESTION_TEXT', category: 2, question: 3 }
  // or { name: 'QUESTION_OPTIONS', category: 2, question: 3 }
  // or { name: 'GAME_OVER' }
}
```

### Persistence

- After every state mutation that affects scores, answered tiles, or picker, the relevant slice is written to `localStorage` under the key `jeopardy-app:state`.
- The `view` field is **not** persisted — on reload, the app always returns to `BOARD` (or `GAME_OVER` if all tiles are answered). This avoids a refresh landing the host mid-question with no context.
- On app load: if `localStorage` has saved state and the loaded `game.json` still has the same shape (3 teams, 5 categories × 6 questions), restore scores/answered/picker. If the shape changed (e.g. host edited the JSON between sessions), discard saved state and start fresh — with a small notice in the footer for one BOARD render: "Saved state discarded (game.json changed)".

## Edge cases and decisions

- **Mis-clicked tile:** the "Back to board" button on question screens reverts cleanly. Tile stays unanswered, picker doesn't rotate, no score change.
- **Reload mid-question:** returns to BOARD with the tile still unanswered (since view isn't persisted, and we only mark tiles answered after scoring).
- **Browser closed mid-game:** scores and answered tiles survive in `localStorage`. Reopen the tab → resume from BOARD.
- **Invalid JSON or schema violation:** error screen lists every problem; app does not start.
- **All 30 answered:** GAME_OVER replaces BOARD. The only way out is **New game**, which is a full reset (same as the Reset button + confirmation).
- **Ties at end:** GAME_OVER shows tied teams sharing the top rank, both featured.

## README contents

- One-paragraph description.
- "Run it": the static-server command and the URL.
- "Edit `game.json`": the full field rules above, plus a worked example that explicitly shows `correctIndex: 1` selecting the second option.
- "Reset / new game": where the buttons are.
- "Troubleshooting": what to do if the validation error screen appears (read the error, fix the JSON, refresh).
