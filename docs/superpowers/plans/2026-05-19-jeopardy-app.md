# Jeopardy App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-screen, locally-run web app to host a multiple-choice Jeopardy-style game over Zoom screenshare during a work event. 3 teams, 5 categories × 6 questions, configurable via `game.json`.

**Architecture:** Vanilla HTML/CSS/JS organized as ES modules. Pure logic (config validation, state transitions, persistence, HTML rendering) lives under `src/` and is tested with Node's built-in test runner (`node --test`, zero install). `app.js` is the browser entry point that wires modules together and manages event handlers. Render functions return HTML strings (pure functions from state → HTML), so they're both unit-testable and trivially swapped into the DOM via `innerHTML`. Event delegation on a single root element handles all clicks, so handlers survive innerHTML replacement.

**Tech Stack:** HTML5, CSS3, ES2022 JavaScript (modules). No build step. Static-served via `npx serve .` or `python3 -m http.server`. Node 18+ for `node --test`.

---

## File Structure

```
Jeopardy-App/
├── index.html                # app shell with single #root element
├── style.css                 # all styles, dark theme, layout B (sidebar scoreboard)
├── app.js                    # browser entry: load config + state, attach delegated handlers, render
├── package.json              # { "type": "module", "scripts": { "test": "node --test tests/" } }
├── game.json                 # editable content
├── README.md                 # how to run, JSON format, troubleshooting
├── .gitignore                # already exists (ignores .superpowers/)
├── src/
│   ├── config.js             # validateConfig, loadConfig
│   ├── state.js              # createInitialState, applyVerdict, allAnswered, answeredCount
│   ├── persistence.js        # saveState, loadState, clearState (storage injected for testability)
│   └── render/
│       ├── board.js          # renderBoard(config, state) → HTML string
│       ├── scoreboard.js     # renderScoreboard(config, state) → HTML string
│       ├── question.js       # renderQuestionText, renderQuestionOptions, renderQuestionReview
│       ├── gameOver.js       # renderGameOver(config, state) → HTML string
│       └── errorScreen.js    # renderErrorScreen(errors) → HTML string
└── tests/
    ├── config.test.js
    ├── state.test.js
    ├── persistence.test.js
    └── render/
        ├── board.test.js
        ├── scoreboard.test.js
        ├── question.test.js
        ├── gameOver.test.js
        └── errorScreen.test.js
```

**Spec deviation:** the spec said `app.js` is "a single file" but allowed organization into top-level functions. Splitting into `src/` modules is a small deviation made to enable unit testing without a build step. All modules are loaded directly by the browser via `<script type="module">`.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `style.css` (empty placeholder)
- Create: `app.js` (empty placeholder)
- Create: `src/config.js` (empty placeholder)
- Create: `src/state.js` (empty placeholder)
- Create: `src/persistence.js` (empty placeholder)
- Create: `src/render/board.js`, `src/render/scoreboard.js`, `src/render/question.js`, `src/render/gameOver.js`, `src/render/errorScreen.js` (empty placeholders)
- Create: `tests/.gitkeep`

No tests — pure scaffolding.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "jeopardy-app",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Jeopardy</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <div id="root">Loading…</div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create empty placeholder files**

Run these commands to create the empty files (each `touch` creates one file):

```bash
mkdir -p src/render tests/render
touch style.css app.js
touch src/config.js src/state.js src/persistence.js
touch src/render/board.js src/render/scoreboard.js src/render/question.js src/render/gameOver.js src/render/errorScreen.js
touch tests/.gitkeep
```

- [ ] **Step 4: Verify the scaffold runs**

Run: `npx serve . -l 3000 &` then `curl -s http://localhost:3000/ | grep -c "Loading"`
Expected: `1`
Then kill the server: `pkill -f "serve . -l 3000"`

- [ ] **Step 5: Commit**

```bash
git add package.json index.html style.css app.js src tests
git commit -m "feat: scaffold project structure"
```

---

## Task 2: Example `game.json`

**Files:**
- Create: `game.json`

No tests — content file. Provides a complete, working example used by every later task's manual verification.

- [ ] **Step 1: Create `game.json`**

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
        { "points": 100, "question": "Which 1994 film features a character named Forrest?", "options": ["Pulp Fiction", "Forrest Gump", "The Lion King", "Speed"], "correctIndex": 1 },
        { "points": 200, "question": "Who directed Inception?", "options": ["Christopher Nolan", "Steven Spielberg", "James Cameron", "Denis Villeneuve"], "correctIndex": 0 },
        { "points": 300, "question": "What year was The Matrix released?", "options": ["1997", "1998", "1999", "2000"], "correctIndex": 2 },
        { "points": 400, "question": "Which actor played the Joker in The Dark Knight?", "options": ["Jared Leto", "Joaquin Phoenix", "Heath Ledger", "Jack Nicholson"], "correctIndex": 2 },
        { "points": 500, "question": "Which Pixar film features a rat named Remy?", "options": ["Up", "Ratatouille", "Cars", "Wall-E"], "correctIndex": 1 },
        { "points": 600, "question": "How many films are in the original Star Wars trilogy?", "options": ["3", "4", "5", "6"], "correctIndex": 0 }
      ]
    },
    {
      "name": "History",
      "questions": [
        { "points": 100, "question": "In what year did the Berlin Wall fall?", "options": ["1987", "1989", "1991", "1993"], "correctIndex": 1 },
        { "points": 200, "question": "Who was the first president of the United States?", "options": ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"], "correctIndex": 2 },
        { "points": 300, "question": "The Great Fire of London occurred in which year?", "options": ["1666", "1766", "1566", "1866"], "correctIndex": 0 },
        { "points": 400, "question": "Which civilization built Machu Picchu?", "options": ["Aztec", "Maya", "Inca", "Olmec"], "correctIndex": 2 },
        { "points": 500, "question": "The Hundred Years War lasted approximately how long?", "options": ["100 years", "116 years", "85 years", "120 years"], "correctIndex": 1 },
        { "points": 600, "question": "Who was the longest-reigning British monarch before Elizabeth II?", "options": ["Victoria", "George III", "Henry VIII", "Edward VII"], "correctIndex": 0 }
      ]
    },
    {
      "name": "Code",
      "questions": [
        { "points": 100, "question": "What does HTML stand for?", "options": ["Hyper Trainer Marking Language", "HyperText Markup Language", "HyperText Marketing Language", "HyperText Modeling Language"], "correctIndex": 1 },
        { "points": 200, "question": "Which company developed TypeScript?", "options": ["Google", "Facebook", "Microsoft", "Apple"], "correctIndex": 2 },
        { "points": 300, "question": "What is the default port for HTTPS?", "options": ["80", "443", "8080", "22"], "correctIndex": 1 },
        { "points": 400, "question": "Who created the Linux kernel?", "options": ["Richard Stallman", "Linus Torvalds", "Ken Thompson", "Dennis Ritchie"], "correctIndex": 1 },
        { "points": 500, "question": "Which sorting algorithm has the best average-case time complexity?", "options": ["Bubble sort", "Insertion sort", "Quick sort", "Selection sort"], "correctIndex": 2 },
        { "points": 600, "question": "In Git, which command discards uncommitted changes in a file?", "options": ["git revert", "git reset", "git checkout --", "git clean"], "correctIndex": 2 }
      ]
    },
    {
      "name": "Music",
      "questions": [
        { "points": 100, "question": "How many strings does a standard guitar have?", "options": ["4", "5", "6", "7"], "correctIndex": 2 },
        { "points": 200, "question": "Who composed The Four Seasons?", "options": ["Bach", "Mozart", "Vivaldi", "Beethoven"], "correctIndex": 2 },
        { "points": 300, "question": "Which band released the album Dark Side of the Moon?", "options": ["Led Zeppelin", "The Who", "Pink Floyd", "The Rolling Stones"], "correctIndex": 2 },
        { "points": 400, "question": "What instrument did Miles Davis primarily play?", "options": ["Saxophone", "Trumpet", "Piano", "Drums"], "correctIndex": 1 },
        { "points": 500, "question": "Which Beatles album was released last?", "options": ["Abbey Road", "Let It Be", "The White Album", "Help!"], "correctIndex": 1 },
        { "points": 600, "question": "Which note is 'A' above middle C tuned to (Hz)?", "options": ["432", "440", "444", "448"], "correctIndex": 1 }
      ]
    },
    {
      "name": "Food",
      "questions": [
        { "points": 100, "question": "Which country is the origin of sushi?", "options": ["China", "Korea", "Japan", "Thailand"], "correctIndex": 2 },
        { "points": 200, "question": "What is the main ingredient in guacamole?", "options": ["Tomato", "Avocado", "Lime", "Onion"], "correctIndex": 1 },
        { "points": 300, "question": "Which spice is the most expensive by weight?", "options": ["Vanilla", "Cardamom", "Saffron", "Truffle"], "correctIndex": 2 },
        { "points": 400, "question": "Tiramisu is a traditional dessert from which country?", "options": ["France", "Italy", "Spain", "Greece"], "correctIndex": 1 },
        { "points": 500, "question": "Which type of pastry is used to make a croissant?", "options": ["Choux", "Filo", "Puff", "Shortcrust"], "correctIndex": 2 },
        { "points": 600, "question": "Kimchi is a staple of which country's cuisine?", "options": ["China", "Vietnam", "Korea", "Mongolia"], "correctIndex": 2 }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add game.json
git commit -m "feat: add example game.json with 3 teams, 5 categories, 30 questions"
```

---

## Task 3: Config validation (TDD)

**Files:**
- Modify: `src/config.js`
- Test: `tests/config.test.js`

`validateConfig(config)` returns `{ valid: true, errors: [] }` on success or `{ valid: false, errors: [string, ...] }` listing every problem found. Always reports every error — never short-circuits — so the host fixes all issues in one pass.

- [ ] **Step 1: Write failing tests for `validateConfig`**

Write `tests/config.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../src/config.js';

function validQuestion(overrides = {}) {
  return {
    points: 100,
    question: 'Q?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    ...overrides,
  };
}

function validCategory(name = 'Cat') {
  return { name, questions: Array.from({ length: 6 }, () => validQuestion()) };
}

function validConfig() {
  return {
    teams: [
      { name: 'T1', color: '#f00' },
      { name: 'T2', color: '#0f0' },
      { name: 'T3', color: '#00f' },
    ],
    categories: Array.from({ length: 5 }, (_, i) => validCategory(`Cat${i}`)),
  };
}

test('valid config passes', () => {
  const result = validateConfig(validConfig());
  assert.deepEqual(result, { valid: true, errors: [] });
});

test('rejects wrong team count', () => {
  const c = validConfig();
  c.teams.pop();
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('teams')), `expected teams error, got ${JSON.stringify(result.errors)}`);
});

test('rejects wrong category count', () => {
  const c = validConfig();
  c.categories.push(validCategory('Extra'));
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('categories')));
});

test('rejects wrong question count in a category', () => {
  const c = validConfig();
  c.categories[1].questions.pop();
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('categories[1]')));
});

test('rejects options array too short', () => {
  const c = validConfig();
  c.categories[0].questions[0].options = ['A', 'B'];
  c.categories[0].questions[0].correctIndex = 0;
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('options')));
});

test('rejects options array too long', () => {
  const c = validConfig();
  c.categories[0].questions[0].options = ['A', 'B', 'C', 'D', 'E', 'F'];
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('options')));
});

test('rejects correctIndex out of range', () => {
  const c = validConfig();
  c.categories[2].questions[4].correctIndex = 5;
  c.categories[2].questions[4].options = ['A', 'B', 'C', 'D'];
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('categories[2].questions[4].correctIndex')));
});

test('rejects negative points', () => {
  const c = validConfig();
  c.categories[0].questions[0].points = -10;
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('points')));
});

test('rejects missing team name', () => {
  const c = validConfig();
  c.teams[1].name = '';
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('teams[1].name')));
});

test('reports multiple errors at once (does not short-circuit)', () => {
  const c = validConfig();
  c.teams.pop();
  c.categories[0].questions[0].correctIndex = 99;
  c.categories[0].questions[0].options = ['A', 'B'];
  const result = validateConfig(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 2, `expected 2+ errors, got ${result.errors.length}`);
});

test('rejects null/undefined config', () => {
  assert.equal(validateConfig(null).valid, false);
  assert.equal(validateConfig(undefined).valid, false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: tests fail with "validateConfig is not a function" or similar.

- [ ] **Step 3: Implement `validateConfig`**

Write `src/config.js`:

```javascript
export function validateConfig(config) {
  const errors = [];

  if (config == null || typeof config !== 'object') {
    return { valid: false, errors: ['config must be an object'] };
  }

  if (!Array.isArray(config.teams)) {
    errors.push('teams must be an array');
  } else if (config.teams.length !== 3) {
    errors.push(`teams must have exactly 3 entries (got ${config.teams.length})`);
  } else {
    config.teams.forEach((team, i) => {
      if (!team || typeof team !== 'object') {
        errors.push(`teams[${i}] must be an object`);
        return;
      }
      if (typeof team.name !== 'string' || team.name.trim() === '') {
        errors.push(`teams[${i}].name must be a non-empty string`);
      }
      if (typeof team.color !== 'string' || team.color.trim() === '') {
        errors.push(`teams[${i}].color must be a non-empty string`);
      }
    });
  }

  if (!Array.isArray(config.categories)) {
    errors.push('categories must be an array');
  } else if (config.categories.length !== 5) {
    errors.push(`categories must have exactly 5 entries (got ${config.categories.length})`);
  } else {
    config.categories.forEach((cat, ci) => {
      if (!cat || typeof cat !== 'object') {
        errors.push(`categories[${ci}] must be an object`);
        return;
      }
      if (typeof cat.name !== 'string' || cat.name.trim() === '') {
        errors.push(`categories[${ci}].name must be a non-empty string`);
      }
      if (!Array.isArray(cat.questions)) {
        errors.push(`categories[${ci}].questions must be an array`);
        return;
      }
      if (cat.questions.length !== 6) {
        errors.push(`categories[${ci}].questions must have exactly 6 entries (got ${cat.questions.length})`);
      }
      cat.questions.forEach((q, qi) => {
        const prefix = `categories[${ci}].questions[${qi}]`;
        if (!q || typeof q !== 'object') {
          errors.push(`${prefix} must be an object`);
          return;
        }
        if (!Number.isInteger(q.points) || q.points < 0) {
          errors.push(`${prefix}.points must be a non-negative integer`);
        }
        if (typeof q.question !== 'string' || q.question.trim() === '') {
          errors.push(`${prefix}.question must be a non-empty string`);
        }
        if (!Array.isArray(q.options)) {
          errors.push(`${prefix}.options must be an array`);
        } else if (q.options.length < 3 || q.options.length > 5) {
          errors.push(`${prefix}.options must have 3 to 5 entries (got ${q.options.length})`);
        } else if (!q.options.every(o => typeof o === 'string' && o.trim() !== '')) {
          errors.push(`${prefix}.options must all be non-empty strings`);
        }
        if (!Number.isInteger(q.correctIndex)) {
          errors.push(`${prefix}.correctIndex must be an integer`);
        } else if (Array.isArray(q.options) && (q.correctIndex < 0 || q.correctIndex >= q.options.length)) {
          errors.push(`${prefix}.correctIndex is ${q.correctIndex} but options has ${q.options.length} entries`);
        }
      });
    });
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all `config.test.js` tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/config.js tests/config.test.js
git commit -m "feat: add validateConfig with full schema checks"
```

---

## Task 4: Config loading (TDD)

**Files:**
- Modify: `src/config.js`
- Modify: `tests/config.test.js`

`loadConfig(fetchFn)` fetches `./game.json`, parses it, validates, and returns `{ ok: true, config }` or `{ ok: false, errors }`. Takes `fetchFn` as a parameter so tests can inject a mock without touching the real network.

- [ ] **Step 1: Add failing tests for `loadConfig`**

Append to `tests/config.test.js`:

```javascript
import { loadConfig } from '../src/config.js';

function mockFetch(response) {
  return async () => response;
}

test('loadConfig returns ok with valid config', async () => {
  const cfg = validConfig();
  const fetchFn = mockFetch({
    ok: true,
    json: async () => cfg,
  });
  const result = await loadConfig(fetchFn);
  assert.equal(result.ok, true);
  assert.deepEqual(result.config, cfg);
});

test('loadConfig returns errors for invalid config', async () => {
  const cfg = validConfig();
  cfg.teams.pop();
  const fetchFn = mockFetch({
    ok: true,
    json: async () => cfg,
  });
  const result = await loadConfig(fetchFn);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test('loadConfig returns error on fetch failure', async () => {
  const fetchFn = mockFetch({ ok: false, status: 404, statusText: 'Not Found' });
  const result = await loadConfig(fetchFn);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.includes('404')));
});

test('loadConfig returns error on JSON parse failure', async () => {
  const fetchFn = mockFetch({
    ok: true,
    json: async () => { throw new SyntaxError('Unexpected token'); },
  });
  const result = await loadConfig(fetchFn);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.toLowerCase().includes('json')));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: 4 new failures with "loadConfig is not a function".

- [ ] **Step 3: Implement `loadConfig`**

Append to `src/config.js`:

```javascript
export async function loadConfig(fetchFn) {
  let response;
  try {
    response = await fetchFn('./game.json');
  } catch (e) {
    return { ok: false, errors: [`failed to fetch game.json: ${e.message}`] };
  }

  if (!response.ok) {
    return { ok: false, errors: [`failed to load game.json: ${response.status} ${response.statusText || ''}`.trim()] };
  }

  let parsed;
  try {
    parsed = await response.json();
  } catch (e) {
    return { ok: false, errors: [`game.json is not valid JSON: ${e.message}`] };
  }

  const validation = validateConfig(parsed);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }

  return { ok: true, config: parsed };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/config.js tests/config.test.js
git commit -m "feat: add loadConfig with fetch + parse + validate"
```

---

## Task 5: Initial state (TDD)

**Files:**
- Modify: `src/state.js`
- Test: `tests/state.test.js`

`createInitialState()` returns the starting game state (all zeros / all unanswered / picker at team 0 / view BOARD). The schema is fixed (3 teams, 5 categories, 6 questions each per spec), so it takes no parameters.

- [ ] **Step 1: Write failing tests**

Write `tests/state.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/state.js';

test('createInitialState returns picker at 0', () => {
  const s = createInitialState();
  assert.equal(s.pickerIndex, 0);
});

test('createInitialState returns three zero scores', () => {
  const s = createInitialState();
  assert.deepEqual(s.scores, [0, 0, 0]);
});

test('createInitialState returns 5x6 grid of false', () => {
  const s = createInitialState();
  assert.equal(s.answered.length, 5);
  for (const row of s.answered) {
    assert.equal(row.length, 6);
    assert.ok(row.every(v => v === false));
  }
});

test('createInitialState view is BOARD', () => {
  const s = createInitialState();
  assert.deepEqual(s.view, { name: 'BOARD' });
});

test('createInitialState answered rows are independent (no aliasing)', () => {
  const s = createInitialState();
  s.answered[0][0] = true;
  assert.equal(s.answered[1][0], false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures with "createInitialState is not a function".

- [ ] **Step 3: Implement `createInitialState`**

Write `src/state.js`:

```javascript
export function createInitialState() {
  return {
    pickerIndex: 0,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => [false, false, false, false, false, false]),
    view: { name: 'BOARD' },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/state.js tests/state.test.js
git commit -m "feat: add createInitialState"
```

---

## Task 6: Apply verdict (TDD)

**Files:**
- Modify: `src/state.js`
- Modify: `tests/state.test.js`

`applyVerdict(state, categoryIdx, questionIdx, verdict, points)` returns a NEW state with the verdict applied: marks tile answered, advances picker, and (if verdict === 'correct') adds points to the picking team's score. Pure / immutable — does not mutate input.

- [ ] **Step 1: Add failing tests**

Append to `tests/state.test.js`:

```javascript
import { applyVerdict } from '../src/state.js';

test('applyVerdict correct adds points to picking team', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 0, 0, 'correct', 200);
  assert.equal(s2.scores[0], 200);
  assert.deepEqual(s2.scores.slice(1), [0, 0]);
});

test('applyVerdict wrong does not change scores', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 0, 0, 'wrong', 200);
  assert.deepEqual(s2.scores, [0, 0, 0]);
});

test('applyVerdict marks tile answered', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 2, 4, 'wrong', 300);
  assert.equal(s2.answered[2][4], true);
  assert.equal(s2.answered[2][3], false);
  assert.equal(s2.answered[0][0], false);
});

test('applyVerdict rotates picker 0 → 1', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 0, 0, 'correct', 100);
  assert.equal(s2.pickerIndex, 1);
});

test('applyVerdict rotates picker 2 → 0', () => {
  const s = { ...createInitialState(), pickerIndex: 2 };
  const s2 = applyVerdict(s, 0, 0, 'correct', 100);
  assert.equal(s2.pickerIndex, 0);
});

test('applyVerdict rotates picker on wrong verdict too', () => {
  const s = createInitialState();
  const s2 = applyVerdict(s, 0, 0, 'wrong', 100);
  assert.equal(s2.pickerIndex, 1);
});

test('applyVerdict does not mutate input state', () => {
  const s = createInitialState();
  const before = JSON.stringify(s);
  applyVerdict(s, 0, 0, 'correct', 500);
  assert.equal(JSON.stringify(s), before);
});

test('applyVerdict accumulates score across multiple corrects', () => {
  let s = createInitialState();
  s = applyVerdict(s, 0, 0, 'correct', 100);  // T1 = 100, picker → 1
  s = applyVerdict(s, 0, 1, 'correct', 200);  // T2 = 200, picker → 2
  s = applyVerdict(s, 0, 2, 'correct', 300);  // T3 = 300, picker → 0
  s = applyVerdict(s, 0, 3, 'correct', 400);  // T1 = 500, picker → 1
  assert.deepEqual(s.scores, [500, 200, 300]);
  assert.equal(s.pickerIndex, 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: 8 failures with "applyVerdict is not a function".

- [ ] **Step 3: Implement `applyVerdict`**

Append to `src/state.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/state.js tests/state.test.js
git commit -m "feat: add applyVerdict for scoring + picker rotation"
```

---

## Task 7: All-answered helper + answered count (TDD)

**Files:**
- Modify: `src/state.js`
- Modify: `tests/state.test.js`

Two small helpers: `allAnswered(state)` returns true if every tile is answered. `answeredCount(state)` returns how many tiles are answered (for the footer "X of 30 answered" display).

- [ ] **Step 1: Add failing tests**

Append to `tests/state.test.js`:

```javascript
import { allAnswered, answeredCount } from '../src/state.js';

test('allAnswered is false for fresh state', () => {
  assert.equal(allAnswered(createInitialState()), false);
});

test('allAnswered is true when every tile is true', () => {
  const s = createInitialState();
  s.answered = Array.from({ length: 5 }, () => Array(6).fill(true));
  assert.equal(allAnswered(s), true);
});

test('allAnswered is false when one tile is false', () => {
  const s = createInitialState();
  s.answered = Array.from({ length: 5 }, () => Array(6).fill(true));
  s.answered[3][2] = false;
  assert.equal(allAnswered(s), false);
});

test('answeredCount is 0 for fresh state', () => {
  assert.equal(answeredCount(createInitialState()), 0);
});

test('answeredCount is 30 when all answered', () => {
  const s = createInitialState();
  s.answered = Array.from({ length: 5 }, () => Array(6).fill(true));
  assert.equal(answeredCount(s), 30);
});

test('answeredCount counts a partial board', () => {
  let s = createInitialState();
  s = applyVerdict(s, 0, 0, 'correct', 100);
  s = applyVerdict(s, 1, 2, 'wrong', 100);
  s = applyVerdict(s, 4, 5, 'correct', 100);
  assert.equal(answeredCount(s), 3);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures with "allAnswered is not a function" / "answeredCount is not a function".

- [ ] **Step 3: Implement helpers**

Append to `src/state.js`:

```javascript
export function allAnswered(state) {
  return state.answered.every(row => row.every(v => v === true));
}

export function answeredCount(state) {
  return state.answered.reduce((sum, row) => sum + row.filter(v => v).length, 0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/state.js tests/state.test.js
git commit -m "feat: add allAnswered and answeredCount helpers"
```

---

## Task 8: Persistence (TDD)

**Files:**
- Modify: `src/persistence.js`
- Test: `tests/persistence.test.js`

`saveState(state, storage)`, `loadState(storage)`, `clearState(storage)` — storage is injected (any object with `getItem`/`setItem`/`removeItem`) so the tests use an in-memory shim and the app uses `localStorage`. Only `pickerIndex`, `scores`, `answered` are persisted (NOT `view`).

- [ ] **Step 1: Write failing tests**

Write `tests/persistence.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveState, loadState, clearState, STORAGE_KEY } from '../src/persistence.js';
import { createInitialState } from '../src/state.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    _map: map,
  };
}

test('STORAGE_KEY is exported and stable', () => {
  assert.equal(typeof STORAGE_KEY, 'string');
  assert.equal(STORAGE_KEY, 'jeopardy-app:state');
});

test('saveState writes JSON to storage under STORAGE_KEY', () => {
  const storage = memoryStorage();
  const s = createInitialState();
  s.scores = [100, 200, 300];
  saveState(s, storage);
  const raw = storage.getItem(STORAGE_KEY);
  assert.ok(raw);
  const parsed = JSON.parse(raw);
  assert.deepEqual(parsed.scores, [100, 200, 300]);
});

test('saveState omits view field', () => {
  const storage = memoryStorage();
  const s = createInitialState();
  s.view = { name: 'QUESTION_TEXT', category: 1, question: 2 };
  saveState(s, storage);
  const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(parsed.view, undefined);
});

test('loadState returns null when no saved state', () => {
  const storage = memoryStorage();
  assert.equal(loadState(storage), null);
});

test('loadState returns null for unparseable JSON', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, 'not-json{{{');
  assert.equal(loadState(storage), null);
});

test('loadState returns null for missing required fields', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ scores: [0, 0, 0] }));
  assert.equal(loadState(storage), null);
});

test('loadState round-trips a saved state', () => {
  const storage = memoryStorage();
  const s = createInitialState();
  s.pickerIndex = 2;
  s.scores = [400, 100, 700];
  s.answered[1][3] = true;
  saveState(s, storage);
  const loaded = loadState(storage);
  assert.equal(loaded.pickerIndex, 2);
  assert.deepEqual(loaded.scores, [400, 100, 700]);
  assert.equal(loaded.answered[1][3], true);
});

test('clearState removes the saved state', () => {
  const storage = memoryStorage();
  saveState(createInitialState(), storage);
  clearState(storage);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures — none of the persistence functions exist yet.

- [ ] **Step 3: Implement persistence**

Write `src/persistence.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/persistence.js tests/persistence.test.js
git commit -m "feat: add localStorage persistence with injectable storage"
```

---

## Task 9: Render board (TDD)

**Files:**
- Modify: `src/render/board.js`
- Test: `tests/render/board.test.js`

`renderBoard(config, state)` returns an HTML string for the 5×6 grid. Tiles include `data-cat` and `data-q` attributes (used later by the delegated click handler). Answered tiles render as a dash and have `data-disabled` set. Category headers come from `config.categories[i].name`.

- [ ] **Step 1: Write failing tests**

Write `tests/render/board.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBoard } from '../../src/render/board.js';

function exampleConfig() {
  return {
    teams: [
      { name: 'T1', color: '#f00' },
      { name: 'T2', color: '#0f0' },
      { name: 'T3', color: '#00f' },
    ],
    categories: ['Movies', 'History', 'Code', 'Music', 'Food'].map(name => ({
      name,
      questions: [100, 200, 300, 400, 500, 600].map(points => ({
        points,
        question: `Q ${name} ${points}`,
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
      })),
    })),
  };
}

function exampleState() {
  return {
    pickerIndex: 0,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => Array(6).fill(false)),
    view: { name: 'BOARD' },
  };
}

test('renderBoard shows all 5 category names', () => {
  const html = renderBoard(exampleConfig(), exampleState());
  for (const name of ['Movies', 'History', 'Code', 'Music', 'Food']) {
    assert.ok(html.includes(name), `expected "${name}" in output`);
  }
});

test('renderBoard shows all 30 point values', () => {
  const html = renderBoard(exampleConfig(), exampleState());
  // 5 categories × each value (100/200/.../600) = 5 occurrences per value
  for (const v of [100, 200, 300, 400, 500, 600]) {
    const matches = (html.match(new RegExp(`>${v}<`, 'g')) || []).length;
    assert.equal(matches, 5, `expected 5 tiles with value ${v}, got ${matches}`);
  }
});

test('renderBoard tiles have data-cat and data-q attributes', () => {
  const html = renderBoard(exampleConfig(), exampleState());
  assert.ok(html.includes('data-cat="0"'));
  assert.ok(html.includes('data-cat="4"'));
  assert.ok(html.includes('data-q="0"'));
  assert.ok(html.includes('data-q="5"'));
});

test('renderBoard shows dash for answered tiles', () => {
  const state = exampleState();
  state.answered[2][3] = true;
  const html = renderBoard(exampleConfig(), state);
  // The answered tile should not show its points value as a clickable tile
  // It should show a dash. Use a markup-aware substring check:
  assert.ok(html.includes('data-cat="2" data-q="3" data-answered="true"'),
    'expected answered tile to be marked with data-answered="true"');
});

test('renderBoard escapes HTML in category names', () => {
  const cfg = exampleConfig();
  cfg.categories[0].name = '<script>x</script>';
  const html = renderBoard(cfg, exampleState());
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures — `renderBoard` not exported.

- [ ] **Step 3: Implement `renderBoard`**

Write `src/render/board.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/render/board.js tests/render/board.test.js
git commit -m "feat: add renderBoard with category headers and 5x6 tiles"
```

---

## Task 10: Render scoreboard (TDD)

**Files:**
- Modify: `src/render/scoreboard.js`
- Test: `tests/render/scoreboard.test.js`

`renderScoreboard(config, state)` returns HTML for the sidebar: three team panels with name, score, and team color. The team at `state.pickerIndex` gets `data-active="true"`. **Important:** when `state.view.name` is `QUESTION_TEXT`, `QUESTION_OPTIONS`, or `QUESTION_REVIEW`, the displayed "active" team should still be the picking team — picker rotation hasn't happened yet (it's deferred to Continue). For BOARD and GAME_OVER, `state.pickerIndex` already reflects who's up next. Same code path: just use `state.pickerIndex` in both cases.

- [ ] **Step 1: Write failing tests**

Write `tests/render/scoreboard.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderScoreboard } from '../../src/render/scoreboard.js';

function cfg() {
  return {
    teams: [
      { name: 'Bug Squashers', color: '#E63946' },
      { name: 'Null Pointers', color: '#2A9D8F' },
      { name: 'Stack Overflows', color: '#F4A261' },
    ],
    categories: [],
  };
}

function stateAt(pickerIndex, scores = [0, 0, 0]) {
  return {
    pickerIndex,
    scores,
    answered: Array.from({ length: 5 }, () => Array(6).fill(false)),
    view: { name: 'BOARD' },
  };
}

test('renderScoreboard shows all three team names', () => {
  const html = renderScoreboard(cfg(), stateAt(0));
  assert.ok(html.includes('Bug Squashers'));
  assert.ok(html.includes('Null Pointers'));
  assert.ok(html.includes('Stack Overflows'));
});

test('renderScoreboard shows scores', () => {
  const html = renderScoreboard(cfg(), stateAt(0, [300, 500, 200]));
  assert.ok(html.includes('300'));
  assert.ok(html.includes('500'));
  assert.ok(html.includes('200'));
});

test('renderScoreboard applies team colors as left border', () => {
  const html = renderScoreboard(cfg(), stateAt(0));
  assert.ok(html.includes('#E63946'));
  assert.ok(html.includes('#2A9D8F'));
  assert.ok(html.includes('#F4A261'));
});

test('renderScoreboard marks picker with data-active', () => {
  const html = renderScoreboard(cfg(), stateAt(1));
  const team1Marked = /data-team="1"[^>]*data-active="true"/.test(html)
    || /data-active="true"[^>]*data-team="1"/.test(html);
  assert.ok(team1Marked, 'team 1 should be active when pickerIndex=1');
});

test('renderScoreboard only one team active at a time', () => {
  const html = renderScoreboard(cfg(), stateAt(2));
  const activeCount = (html.match(/data-active="true"/g) || []).length;
  assert.equal(activeCount, 1);
});

test('renderScoreboard escapes team names', () => {
  const c = cfg();
  c.teams[0].name = '<img>';
  const html = renderScoreboard(c, stateAt(0));
  assert.ok(!html.includes('<img>'));
  assert.ok(html.includes('&lt;img&gt;'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures — `renderScoreboard` missing.

- [ ] **Step 3: Implement `renderScoreboard`**

Write `src/render/scoreboard.js`:

```javascript
import { escapeHtml } from './board.js';

export function renderScoreboard(config, state) {
  const panels = config.teams.map((team, i) => {
    const active = i === state.pickerIndex ? ' data-active="true"' : '';
    const score = state.scores[i] ?? 0;
    return `<div class="team-panel" data-team="${i}"${active} style="border-left-color: ${escapeHtml(team.color)}">
      <div class="team-name">${escapeHtml(team.name)}</div>
      <div class="team-score">${score}</div>
    </div>`;
  }).join('');
  return `<aside class="scoreboard">${panels}</aside>`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/render/scoreboard.js tests/render/scoreboard.test.js
git commit -m "feat: add renderScoreboard with active-picker highlight"
```

---

## Task 11: Render question views (TDD)

**Files:**
- Modify: `src/render/question.js`
- Test: `tests/render/question.test.js`

Three exports — one per view in the question lifecycle: `renderQuestionText`, `renderQuestionOptions`, `renderQuestionReview`. Each takes `(config, state)`, reads `state.view.category` / `state.view.question` (and `state.view.verdict` for REVIEW) and returns HTML.

Action buttons include `data-action` attributes:
- `data-action="show-options"` (text view)
- `data-action="back-to-board"` (text and options views)
- `data-action="verdict-correct"` and `data-action="verdict-wrong"` (options view)
- `data-action="continue"` (review view)

- [ ] **Step 1: Write failing tests**

Write `tests/render/question.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderQuestionText,
  renderQuestionOptions,
  renderQuestionReview,
} from '../../src/render/question.js';

function cfg() {
  return {
    teams: [
      { name: 'Bug Squashers', color: '#E63946' },
      { name: 'Null Pointers', color: '#2A9D8F' },
      { name: 'Stack Overflows', color: '#F4A261' },
    ],
    categories: ['Movies', 'History', 'Code', 'Music', 'Food'].map(name => ({
      name,
      questions: [100, 200, 300, 400, 500, 600].map((points, qi) => ({
        points,
        question: `Q ${name} ${qi}`,
        options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
        correctIndex: qi % 4,
      })),
    })),
  };
}

function stateInQuestion(viewName, category, question, verdict) {
  const view = { name: viewName, category, question };
  if (verdict) view.verdict = verdict;
  return {
    pickerIndex: 1,
    scores: [0, 0, 0],
    answered: Array.from({ length: 5 }, () => Array(6).fill(false)),
    view,
  };
}

// QUESTION_TEXT

test('renderQuestionText shows the question prompt', () => {
  const html = renderQuestionText(cfg(), stateInQuestion('QUESTION_TEXT', 0, 2));
  assert.ok(html.includes('Q Movies 2'));
});

test('renderQuestionText does NOT show options', () => {
  const html = renderQuestionText(cfg(), stateInQuestion('QUESTION_TEXT', 0, 2));
  assert.ok(!html.includes('Alpha'));
  assert.ok(!html.includes('Beta'));
});

test('renderQuestionText has Show options and Back to board buttons', () => {
  const html = renderQuestionText(cfg(), stateInQuestion('QUESTION_TEXT', 0, 2));
  assert.ok(html.includes('data-action="show-options"'));
  assert.ok(html.includes('data-action="back-to-board"'));
});

// QUESTION_OPTIONS

test('renderQuestionOptions shows all options labelled A,B,C,D', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0));
  assert.ok(html.includes('Alpha'));
  assert.ok(html.includes('Beta'));
  assert.ok(html.includes('Gamma'));
  assert.ok(html.includes('Delta'));
  assert.ok(html.includes('>A<') || html.includes('>A '));
  assert.ok(html.includes('>D<') || html.includes('>D '));
});

test('renderQuestionOptions does NOT highlight any option', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0));
  assert.ok(!html.includes('data-correct="true"'));
});

test('renderQuestionOptions has Correct/Wrong/Back buttons', () => {
  const html = renderQuestionOptions(cfg(), stateInQuestion('QUESTION_OPTIONS', 0, 0));
  assert.ok(html.includes('data-action="verdict-correct"'));
  assert.ok(html.includes('data-action="verdict-wrong"'));
  assert.ok(html.includes('data-action="back-to-board"'));
});

// QUESTION_REVIEW

test('renderQuestionReview highlights correct option', () => {
  // category 0, question 1 → correctIndex = 1 (Beta)
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, 'correct'));
  assert.ok(/data-option="1"[^>]*data-correct="true"/.test(html)
    || /data-correct="true"[^>]*data-option="1"/.test(html));
});

test('renderQuestionReview correct verdict banner mentions points and team', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, 'correct'));
  // question (0,1) has points 200; picker is 1 (Null Pointers)
  assert.ok(html.includes('200'));
  assert.ok(html.includes('Null Pointers'));
  assert.ok(html.toLowerCase().includes('correct'));
});

test('renderQuestionReview wrong verdict banner does not mention points', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 1, 'wrong'));
  assert.ok(html.toLowerCase().includes('wrong'));
});

test('renderQuestionReview has Continue button', () => {
  const html = renderQuestionReview(cfg(), stateInQuestion('QUESTION_REVIEW', 0, 0, 'wrong'));
  assert.ok(html.includes('data-action="continue"'));
});

test('renderQuestionText escapes question text', () => {
  const c = cfg();
  c.categories[0].questions[0].question = '<b>X</b>';
  const html = renderQuestionText(c, stateInQuestion('QUESTION_TEXT', 0, 0));
  assert.ok(!html.includes('<b>X</b>'));
  assert.ok(html.includes('&lt;b&gt;'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures — question render functions missing.

- [ ] **Step 3: Implement question renders**

Write `src/render/question.js`:

```javascript
import { escapeHtml } from './board.js';

function getQuestion(config, state) {
  return config.categories[state.view.category].questions[state.view.question];
}

function renderOptions(question, { highlightCorrect }) {
  return question.options.map((opt, i) => {
    const label = String.fromCharCode(65 + i); // A, B, C, ...
    const correctAttr = highlightCorrect && i === question.correctIndex ? ' data-correct="true"' : '';
    return `<div class="option" data-option="${i}"${correctAttr}>
      <span class="option-letter">${label}</span>
      <span class="option-text">${escapeHtml(opt)}</span>
    </div>`;
  }).join('');
}

export function renderQuestionText(config, state) {
  const q = getQuestion(config, state);
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    <div class="question-actions">
      <button class="btn" data-action="show-options">Show options</button>
      <button class="btn btn-secondary" data-action="back-to-board">Back to board</button>
    </div>
  </div>`;
}

export function renderQuestionOptions(config, state) {
  const q = getQuestion(config, state);
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    <div class="options-list">${renderOptions(q, { highlightCorrect: false })}</div>
    <div class="question-actions">
      <button class="btn btn-correct" data-action="verdict-correct">Correct</button>
      <button class="btn btn-wrong" data-action="verdict-wrong">Wrong</button>
      <button class="btn btn-secondary" data-action="back-to-board">Back to board</button>
    </div>
  </div>`;
}

export function renderQuestionReview(config, state) {
  const q = getQuestion(config, state);
  const team = config.teams[state.pickerIndex];
  const verdict = state.view.verdict;
  let banner;
  if (verdict === 'correct') {
    banner = `<div class="verdict verdict-correct">Correct! +${q.points} to ${escapeHtml(team.name)}</div>`;
  } else {
    banner = `<div class="verdict verdict-wrong">Wrong — no change</div>`;
  }
  return `<div class="question-view">
    <div class="question-prompt">${escapeHtml(q.question)}</div>
    <div class="options-list">${renderOptions(q, { highlightCorrect: true })}</div>
    ${banner}
    <div class="question-actions">
      <button class="btn" data-action="continue">Continue</button>
    </div>
  </div>`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/render/question.js tests/render/question.test.js
git commit -m "feat: add question text, options, and review renders"
```

---

## Task 12: Render game over (TDD)

**Files:**
- Modify: `src/render/gameOver.js`
- Test: `tests/render/gameOver.test.js`

`renderGameOver(config, state)` shows teams ranked by score (descending), with the winning team's name and color featured at the top. Ties share the top rank (the spec calls for both being featured).

- [ ] **Step 1: Write failing tests**

Write `tests/render/gameOver.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderGameOver } from '../../src/render/gameOver.js';

function cfg() {
  return {
    teams: [
      { name: 'Bug Squashers', color: '#E63946' },
      { name: 'Null Pointers', color: '#2A9D8F' },
      { name: 'Stack Overflows', color: '#F4A261' },
    ],
    categories: [],
  };
}

function endState(scores) {
  return {
    pickerIndex: 0,
    scores,
    answered: Array.from({ length: 5 }, () => Array(6).fill(true)),
    view: { name: 'GAME_OVER' },
  };
}

test('renderGameOver lists teams in descending score order', () => {
  const html = renderGameOver(cfg(), endState([100, 500, 300]));
  const i1 = html.indexOf('Null Pointers');
  const i2 = html.indexOf('Stack Overflows');
  const i3 = html.indexOf('Bug Squashers');
  assert.ok(i1 < i2 && i2 < i3, `expected Null < Stack < Bug, got ${i1}, ${i2}, ${i3}`);
});

test('renderGameOver features winning team', () => {
  const html = renderGameOver(cfg(), endState([100, 500, 300]));
  assert.ok(/data-rank="1"[^>]*data-team="1"/.test(html)
    || /data-team="1"[^>]*data-rank="1"/.test(html));
});

test('renderGameOver shows tied winners at same rank', () => {
  const html = renderGameOver(cfg(), endState([500, 500, 200]));
  const rank1Count = (html.match(/data-rank="1"/g) || []).length;
  assert.equal(rank1Count, 2, 'two teams should share rank 1');
});

test('renderGameOver includes New game button', () => {
  const html = renderGameOver(cfg(), endState([0, 0, 0]));
  assert.ok(html.includes('data-action="new-game"'));
});

test('renderGameOver shows each team\'s score', () => {
  const html = renderGameOver(cfg(), endState([100, 500, 300]));
  assert.ok(html.includes('100'));
  assert.ok(html.includes('500'));
  assert.ok(html.includes('300'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures — `renderGameOver` missing.

- [ ] **Step 3: Implement `renderGameOver`**

Write `src/render/gameOver.js`:

```javascript
import { escapeHtml } from './board.js';

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

  const rows = ranked.map(t => `
    <div class="game-over-row" data-team="${t.teamIndex}" data-rank="${t.rank}" style="border-left-color: ${escapeHtml(t.color)}">
      <div class="rank">#${t.rank}</div>
      <div class="team-name">${escapeHtml(t.name)}</div>
      <div class="team-score">${t.score}</div>
    </div>`).join('');

  return `<div class="game-over">
    <h1>Game over</h1>
    ${rows}
    <button class="btn" data-action="new-game">New game</button>
  </div>`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/render/gameOver.js tests/render/gameOver.test.js
git commit -m "feat: add renderGameOver with ranking and tied-winner handling"
```

---

## Task 13: Render error screen (TDD)

**Files:**
- Modify: `src/render/errorScreen.js`
- Test: `tests/render/errorScreen.test.js`

`renderErrorScreen(errors)` shows a clear list of validation errors so the host fixes `game.json` and refreshes.

- [ ] **Step 1: Write failing tests**

Write `tests/render/errorScreen.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderErrorScreen } from '../../src/render/errorScreen.js';

test('renderErrorScreen shows each error', () => {
  const html = renderErrorScreen(['teams must have 3 entries', 'options too short']);
  assert.ok(html.includes('teams must have 3 entries'));
  assert.ok(html.includes('options too short'));
});

test('renderErrorScreen escapes error text', () => {
  const html = renderErrorScreen(['<script>x</script>']);
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('renderErrorScreen handles empty list gracefully', () => {
  const html = renderErrorScreen([]);
  assert.ok(html.length > 0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures.

- [ ] **Step 3: Implement `renderErrorScreen`**

Write `src/render/errorScreen.js`:

```javascript
import { escapeHtml } from './board.js';

export function renderErrorScreen(errors) {
  const items = (errors || []).map(e => `<li>${escapeHtml(e)}</li>`).join('');
  return `<div class="error-screen">
    <h1>Cannot start: <code>game.json</code> has problems</h1>
    <p>Fix these issues and refresh the page.</p>
    <ul class="error-list">${items}</ul>
  </div>`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/render/errorScreen.js tests/render/errorScreen.test.js
git commit -m "feat: add renderErrorScreen for config validation failures"
```

---

## Task 14: CSS (dark theme + layout B)

**Files:**
- Modify: `style.css`

No unit tests for CSS — visual verification in the browser. This task lays down the full style sheet for all views.

- [ ] **Step 1: Write `style.css`**

Replace `style.css` with:

```css
:root {
  --bg: #0b1020;
  --bg-elev: #1a2247;
  --bg-deep: #0d1330;
  --border: #2a3568;
  --text: #e6e9f5;
  --text-dim: #9aa3c7;
  --accent: #f4a261;
  --correct: #2a9d8f;
  --wrong: #b23a48;
  --tile-points: #f4a261;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 18px;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ---- App shell ---- */

.app {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr;
  min-height: 100vh;
}

.app-header {
  padding: 1rem 1.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header .picker {
  font-size: 1rem;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  color: var(--text-dim);
}

.app-header .picker .picker-name {
  color: var(--accent);
  font-weight: 700;
}

.app-main {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  min-height: 0;
}

.app-footer {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-dim);
}

/* ---- Board ---- */

.board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: minmax(60px, auto);
  gap: 6px;
}

.cat {
  background: #2d3a7c;
  padding: 0.6rem 0.4rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tile {
  background: var(--bg-elev);
  color: var(--tile-points);
  font-weight: 800;
  font-size: 1.75rem;
  text-align: center;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform 80ms ease, background 80ms ease;
}

.tile:hover:not(.done) {
  background: #243070;
  transform: scale(1.02);
}

.tile.done {
  background: var(--bg-deep);
  color: var(--border);
  cursor: default;
}

/* ---- Scoreboard sidebar ---- */

.scoreboard {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team-panel {
  background: var(--bg-elev);
  border-left: 4px solid #888;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.team-panel[data-active="true"] {
  box-shadow: 0 0 0 2px var(--accent);
}

.team-name {
  font-size: 0.95rem;
  font-weight: 600;
}

.team-score {
  font-size: 1.75rem;
  font-weight: 800;
}

/* ---- Question views ---- */

.question-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem 0;
}

.question-prompt {
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.4;
  padding: 1rem 1.5rem;
  background: var(--bg-elev);
  border-radius: 6px;
}

.options-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.option {
  background: var(--bg-elev);
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.15rem;
}

.option[data-correct="true"] {
  background: var(--correct);
  color: #fff;
}

.option-letter {
  font-weight: 800;
  font-size: 1.25rem;
  background: rgba(255,255,255,0.08);
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  min-width: 2rem;
  text-align: center;
}

.option[data-correct="true"] .option-letter {
  background: rgba(255,255,255,0.2);
}

.verdict {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  padding: 0.75rem;
  border-radius: 6px;
}

.verdict-correct { background: var(--correct); color: #fff; }
.verdict-wrong { background: var(--wrong); color: #fff; }

.question-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
}

.btn {
  background: var(--accent);
  color: #1a1a1a;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 4px;
  cursor: pointer;
}

.btn:hover { filter: brightness(1.05); }
.btn-secondary { background: var(--bg-elev); color: var(--text); border: 1px solid var(--border); }
.btn-correct { background: var(--correct); color: #fff; }
.btn-wrong { background: var(--wrong); color: #fff; }

/* ---- Game over ---- */

.game-over {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
}

.game-over h1 {
  font-size: 3rem;
  margin: 0 0 1.5rem;
}

.game-over-row {
  background: var(--bg-elev);
  border-left: 6px solid #888;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  margin: 0.5rem auto;
  max-width: 600px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
}

.game-over-row[data-rank="1"] {
  font-size: 1.5rem;
  font-weight: 700;
  transform: scale(1.05);
}

.game-over-row .rank { font-weight: 800; opacity: 0.6; }
.game-over-row .team-score { font-size: 2rem; font-weight: 800; }

.game-over .btn { margin-top: 1.5rem; }

/* ---- Error screen ---- */

.error-screen {
  padding: 2rem;
  max-width: 800px;
  margin: 2rem auto;
}

.error-screen h1 { color: var(--wrong); }
.error-screen code { background: var(--bg-elev); padding: 0.1em 0.4em; border-radius: 3px; }
.error-list li { margin: 0.25rem 0; font-family: ui-monospace, "SF Mono", monospace; }

/* When game-over takes over, hide the scoreboard column */
.app-main.full-width { grid-template-columns: 1fr; }
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat: add dark theme and layout B styles"
```

---

## Task 15: App orchestration (`app.js`)

**Files:**
- Modify: `app.js`

The browser entry point. Loads config, restores or creates initial state, attaches a single delegated click handler to `#root`, and re-renders on every state change. No unit tests — this is wiring, validated by manual end-to-end testing in the next step.

- [ ] **Step 1: Write `app.js`**

Replace `app.js` with:

```javascript
import { loadConfig } from './src/config.js';
import {
  createInitialState,
  applyVerdict,
  allAnswered,
  answeredCount,
} from './src/state.js';
import { saveState, loadState, clearState } from './src/persistence.js';
import { renderBoard } from './src/render/board.js';
import { renderScoreboard } from './src/render/scoreboard.js';
import {
  renderQuestionText,
  renderQuestionOptions,
  renderQuestionReview,
} from './src/render/question.js';
import { renderGameOver } from './src/render/gameOver.js';
import { renderErrorScreen } from './src/render/errorScreen.js';

const root = document.getElementById('root');

let config = null;
let state = null;

function render() {
  if (state.view.name === 'GAME_OVER') {
    root.innerHTML = `
      <div class="app">
        <header class="app-header">
          <span>Jeopardy</span>
        </header>
        <main class="app-main full-width">
          ${renderGameOver(config, state)}
        </main>
        <footer class="app-footer">
          <button class="btn btn-secondary" data-action="reset">Reset game</button>
          <span>${answeredCount(state)} of 30 answered</span>
        </footer>
      </div>
    `;
    return;
  }

  const pickerName = config.teams[state.pickerIndex].name;
  let center;
  switch (state.view.name) {
    case 'BOARD':
      center = renderBoard(config, state);
      break;
    case 'QUESTION_TEXT':
      center = renderQuestionText(config, state);
      break;
    case 'QUESTION_OPTIONS':
      center = renderQuestionOptions(config, state);
      break;
    case 'QUESTION_REVIEW':
      center = renderQuestionReview(config, state);
      break;
    default:
      center = `<div>Unknown view: ${state.view.name}</div>`;
  }

  root.innerHTML = `
    <div class="app">
      <header class="app-header">
        <span>Jeopardy</span>
        <span class="picker">Up next: <span class="picker-name">${escapeText(pickerName)}</span></span>
      </header>
      <main class="app-main">
        <section class="app-board">${center}</section>
        ${renderScoreboard(config, state)}
      </main>
      <footer class="app-footer">
        <button class="btn btn-secondary" data-action="reset">Reset game</button>
        <span>${answeredCount(state)} of 30 answered</span>
      </footer>
    </div>
  `;
}

function escapeText(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : updater;
  if (state.view.name === 'BOARD' && allAnswered(state)) {
    state = { ...state, view: { name: 'GAME_OVER' } };
  }
  saveState(state, window.localStorage);
  render();
}

function handleTileClick(target) {
  if (target.getAttribute('data-answered') === 'true') return;
  const ci = Number(target.getAttribute('data-cat'));
  const qi = Number(target.getAttribute('data-q'));
  setState({ ...state, view: { name: 'QUESTION_TEXT', category: ci, question: qi } });
}

function handleAction(action) {
  if (action === 'show-options') {
    setState({ ...state, view: { ...state.view, name: 'QUESTION_OPTIONS' } });
    return;
  }
  if (action === 'back-to-board') {
    setState({ ...state, view: { name: 'BOARD' } });
    return;
  }
  if (action === 'verdict-correct' || action === 'verdict-wrong') {
    const verdict = action === 'verdict-correct' ? 'correct' : 'wrong';
    setState({ ...state, view: { ...state.view, name: 'QUESTION_REVIEW', verdict } });
    return;
  }
  if (action === 'continue') {
    const { category, question, verdict } = state.view;
    const points = config.categories[category].questions[question].points;
    const next = applyVerdict(state, category, question, verdict, points);
    setState({ ...next, view: { name: 'BOARD' } });
    return;
  }
  if (action === 'reset' || action === 'new-game') {
    if (!confirm('Reset game? All scores and answered tiles will be cleared.')) return;
    clearState(window.localStorage);
    setState({ ...createInitialState() });
    return;
  }
}

root.addEventListener('click', (e) => {
  const tile = e.target.closest('.tile');
  if (tile && root.contains(tile)) {
    handleTileClick(tile);
    return;
  }
  const actionEl = e.target.closest('[data-action]');
  if (actionEl && root.contains(actionEl)) {
    handleAction(actionEl.getAttribute('data-action'));
    return;
  }
});

async function init() {
  const result = await loadConfig(window.fetch.bind(window));
  if (!result.ok) {
    root.innerHTML = renderErrorScreen(result.errors);
    return;
  }
  config = result.config;
  const restored = loadState(window.localStorage);
  if (restored) {
    state = { ...restored, view: { name: 'BOARD' } };
    if (allAnswered(state)) {
      state = { ...state, view: { name: 'GAME_OVER' } };
    }
  } else {
    state = createInitialState();
  }
  render();
}

init();
```

- [ ] **Step 2: Verify everything end-to-end in the browser**

Start the server and walk through a full game cycle:

```bash
npx serve . -l 3000
```

Then in a browser at `http://localhost:3000`:

1. Board loads showing 5 categories × 6 tiles. Header says "Up next: The Bug Squashers". Sidebar shows all 3 teams with score 0, Bug Squashers outlined.
2. Click any tile. Question text view appears with "Show options" and "Back to board" buttons. Header still says "Up next: The Bug Squashers".
3. Click "Back to board". Returns to board with same tile still available. Header unchanged.
4. Click the tile again, then "Show options". Options A/B/C/D appear (no highlight). Three buttons: Correct, Wrong, Back to board.
5. Click "Correct". Review screen: correct option highlighted green, banner "Correct! +X to The Bug Squashers", Continue button.
6. Click "Continue". Board returns. The tile is greyed with "—". Header now says "Up next: Null Pointers" (rotated). Bug Squashers score updated, Null Pointers outlined in sidebar.
7. Pick a tile, click through to options, click "Wrong". Review: highlight green, banner "Wrong — no change", Continue.
8. Click "Continue". Board returns, tile greyed. No score change. Header rotates to Stack Overflows.
9. Refresh the page (Cmd+R). Scores and greyed tiles survive.
10. Click "Reset game" in footer. Confirm. Board returns to fresh state, all tiles available, all scores zero.
11. (Optional, slow) play out 30 questions. After the 30th Continue, the GAME_OVER screen replaces the board with teams ranked. Click "New game", confirm, returns to fresh BOARD.

Stop the server (`Ctrl+C`).

- [ ] **Step 3: Verify validation error path**

Temporarily break `game.json` (e.g. delete one team) and refresh the browser. Expected: the error screen lists at least one error. Restore the JSON.

```bash
# After breaking, refresh browser, observe the error screen, then:
git checkout game.json
```

- [ ] **Step 4: Run the full test suite one more time**

Run: `npm test`
Expected: all tests pass (the orchestration changes shouldn't have affected the unit tests, but verify).

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: wire app.js orchestration with delegated event handling"
```

---

## Task 16: README

**Files:**
- Modify: `README.md`

User-facing docs. Tells the host how to run the app, how to edit `game.json`, and what to do when the validation error screen appears.

- [ ] **Step 1: Write `README.md`**

Replace `README.md` with:

````markdown
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

- **`teams`** — exactly 3 entries. Each is `{ "name": string, "color": string }`. `color` is any valid CSS color (`#E63946`, `red`, `rgb(...)`).
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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with run, JSON format, and troubleshooting"
```

---

## Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests across all files pass.

- [ ] **Step 2: Full manual smoke test**

```bash
npx serve . -l 3000
```

Open `http://localhost:3000`. Play through a few questions covering: Correct verdict, Wrong verdict, Back-to-board escape hatch from both QUESTION_TEXT and QUESTION_OPTIONS, page refresh mid-game, Reset button. Stop the server.

- [ ] **Step 3: Confirm clean git status**

Run: `git status`
Expected: nothing to commit, working tree clean.
