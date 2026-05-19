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
    { "name": "The Bug Squashers", "color": "#E63946", "members": ["Alice", "Bob", "Carol"] },
    { "name": "Null Pointers",     "color": "#2A9D8F", "members": ["Dave", "Eve", "Frank"] },
    { "name": "Stack Overflows",   "color": "#F4A261", "members": ["Grace", "Heidi", "Ivan"] }
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

- `teams`: exactly 3 entries. Each has `name` (string), `color` (any valid CSS color string), and `members` (non-empty array of non-empty strings — the people on the team, used in the teams-intro reveal).
- `categories`: exactly 5 entries. Each has `name` (string) and `questions` (exactly 6 entries).
- `questions[].points`: integer ≥ 0. Each question carries its own value; there is no per-row convention.
- `questions[].question`: the prompt text shown to all players.
- `questions[].options`: array of 2 to 5 strings.
- `questions[].correctIndex`: integer, 0-based, must satisfy `0 <= correctIndex < options.length`.
- `questions[].image` (optional): string. If present, it's used directly as the `src` of an `<img>` shown below the prompt on all three question screens. Can be a relative path (e.g. `./images/foo.jpg`) or any URL.

### Identification

Teams and questions are identified by array position. There are no IDs in the JSON.

### Validation

On app start, after `fetch('./game.json')` resolves, the config is validated against the rules above. On any violation, the app renders a clear error screen listing every problem (e.g. "categories[2].questions[4].correctIndex is 5 but only 4 options were provided") rather than the board, so problems are discovered before the event begins.

## Game flow

### Screens (states)

0. **INTRO** — opening reveal in two phases (`phase: 'teams' | 'categories'`). Shown on the very first load (no saved state) and after every Reset / New game.
   - **Teams phase** (first): vertical list of 3 slots, one per team. Each unrevealed slot shows "?". The host clicks **Next** to reveal the next team — its name and roster of members appear, accented with the team's color. Once all 3 are revealed, the next click moves to the categories phase.
   - **Categories phase** (second): vertical list of 5 slots, one per category, same reveal flow. Once all 5 are revealed the button becomes **Start game**, which transitions to BOARD.
   - Persistence is intentionally skipped during INTRO so a refresh mid-intro restarts from the beginning rather than landing in a half-revealed state.
1. **BOARD** — main game view. Shows the 5×6 grid of point tiles, the sidebar scoreboard, and which team is up next.
2. **QUESTION_TEXT** — a tile has been opened. Shows the question prompt large, with a host button: **Show options**.
3. **QUESTION_OPTIONS** — same question, with the 3–5 multiple-choice options revealed (labelled A, B, C, …). Options are clickable: the host clicks the answer the team committed to, and it becomes the selection (visually outlined in the accent color). Host buttons: **Submit** (disabled until an option is selected) and **Back to board** (escape).
4. **QUESTION_REVIEW** — Submit has been pressed. Scoring, tile-marking, picker rotation, and save all happen on Submit, so the sidebar score animates and the celebration (bounce + confetti for a correct answer) happens on this screen. The correct option is highlighted green; if the team's selection was wrong, it's outlined in red so both the pick and the correct answer are visible. A banner shows what happened ("Correct! +200 to Null Pointers" or "Wrong — 0 points") — it names the team that just answered, captured in `view.answeringTeam` (since `state.pickerIndex` has already advanced). Single button **Back to board** is pure navigation.
5. **GAME_OVER** — shows teams ranked by score. The header announces the result: "Winner: *Team*" (in their color) for a sole winner, or "It's a tie!" with the tied teams listed for a draw. Reachable two ways: automatically when all 30 questions are answered, or manually via the **Show results** footer button on BOARD/QUESTION screens. When reached manually before all tiles are answered, a **Back to board** button appears alongside **New game** so the host can resume play; when reached automatically (all answered), only **New game** is offered.

### Per-question flow

```
BOARD
  └─ host clicks an un-answered tile
     └─ QUESTION_TEXT
        ├─ host clicks "Show options"  → QUESTION_OPTIONS
        └─ host clicks "Back to board" → BOARD (tile NOT marked answered)

QUESTION_OPTIONS
  ├─ host clicks an option        → selectedIndex updates; option visually outlined; Submit becomes enabled
  ├─ host clicks a different option → selectedIndex updates; previous selection cleared
  ├─ host clicks "Submit"
  │    ├─ verdict derived: selectedIndex === correctIndex ? 'correct' : 'wrong'
  │    ├─ answeringTeam captured = current pickerIndex (before rotation)
  │    ├─ if verdict == correct: answering team's score += question.points
  │    ├─ tile is marked answered
  │    ├─ picker rotates 1 → 2 → 3 → 1
  │    ├─ state saved to localStorage
  │    └─ QUESTION_REVIEW (carries selectedIndex, verdict, answeringTeam)
  └─ host clicks "Back to board"
       └─ BOARD (tile NOT marked answered, no score change, picker does not rotate)

QUESTION_REVIEW
  ├─ correct option highlights green
  ├─ if verdict == wrong: selected option also outlined in red (so both pick and answer are visible)
  ├─ banner shows "Correct! +200 to Null Pointers" (using view.answeringTeam) or "Wrong — 0 points"
  ├─ if verdict == correct: sidebar score animates up; confetti and bounce animation fire on entry
  ├─ single host button: "Back to board"
  └─ host clicks "Back to board" → BOARD (pure navigation, no state mutation; or GAME_OVER if all 30 answered)
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
│  [ Reset game ]                       6 of 30 answered       │  ← footer
└──────────────────────────────────────────────────────────────┘
```

- Board takes roughly 3/4 of the horizontal space; sidebar takes 1/4.
- Each team panel in the sidebar has a colored left border (the team's `color`).
- The picking team gets an additional bright outline (orange) so it pops on screenshare.
- Answered tiles show a dash (`—`) on a darker background and are not clickable.

**On QUESTION_TEXT, QUESTION_OPTIONS, and QUESTION_REVIEW screens** the sidebar scoreboard and footer remain visible; only the central board area is replaced by the question/options display, the verdict banner (REVIEW only), and the host action buttons. The header continues to show "Up next: *Team Name*" — the team currently answering this question. Because picker rotation is deferred until Continue, the header label stays consistent throughout the question's lifecycle.

### Visual design

- Dark background (classic game-show feel, easier on eyes during a long meeting).
- Large type for question text and option labels — must be readable when the browser tab is scaled down in a Zoom share.
- Options are labelled A, B, C, D, E in the order they appear in the JSON.
- On QUESTION_OPTIONS, the team's current selection is outlined in the accent color. The correct answer is never indicated before Submit — no spoilers.
- On QUESTION_REVIEW, the correct option is tinted green (distinctive). If the selection was wrong, the selected option is outlined in red so both the team's pick and the right answer are visible.

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
  view: { name: 'INTRO', phase: 'teams', revealed: 0 }      // fresh state — reveal teams first
  // or { name: 'INTRO', phase: 'categories', revealed: 0 } // then reveal categories
  // or { name: 'BOARD' }
  // or { name: 'QUESTION_TEXT', category: 2, question: 3 }
  // or { name: 'QUESTION_OPTIONS', category: 2, question: 3, selectedIndex: null | 0..options.length-1 }
  // or { name: 'QUESTION_REVIEW', category: 2, question: 3, selectedIndex: number, verdict: 'correct' | 'wrong', answeringTeam: 0..2 }
  // or { name: 'GAME_OVER' }
}
```

### Persistence

- After every state mutation that affects scores, answered tiles, or picker, the relevant slice is written to `localStorage` under the key `jeopardy-app:state`. Mutations during the INTRO view are NOT persisted, so closing the tab mid-intro and reopening always restarts the intro cleanly.
- The `view` field is **not** persisted — on reload, the app always returns to `BOARD` (or `GAME_OVER` if all tiles are answered). This avoids a refresh landing the host mid-question with no context.
- On app load: if `localStorage` has saved state, restore `scores`, `answered`, and `pickerIndex`. The schema is fixed (3 teams, 5 categories, 6 questions each), so shape mismatch is impossible.
- If the host edits `game.json` between sessions (changes question text, points, team names, etc.), saved tile/score state still loads against the new content. This is acceptable because: (a) "answered" is positional and edits typically don't shuffle positions, and (b) if the host wants a clean slate, the **Reset game** button (always visible) clears `localStorage` and starts over.

## Edge cases and decisions

- **Mis-clicked tile:** the "Back to board" button on question screens reverts cleanly. Tile stays unanswered, picker doesn't rotate, no score change.
- **Reload mid-question (before Submit):** returns to BOARD with the tile still unanswered. The tile/score mutation only happens on Submit, so a reload before Submit loses the in-flight question but not the game.
- **Reload mid-review (after Submit):** returns to BOARD with the tile already marked answered and the score already applied. The celebration (animation, confetti) is lost on reload, but the result stands.
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
