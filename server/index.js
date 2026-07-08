const express = require('express')
const Database = require('better-sqlite3')

const PORT = 3002
const DB_PATH = '/home/runo/nvim-dungeon-scores.db'

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    xp         INTEGER NOT NULL,
    level      INTEGER NOT NULL,
    floors_cleared INTEGER NOT NULL,
    outcome    TEXT    NOT NULL CHECK(outcome IN ('victory','defeat')),
    date       TEXT    NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_xp ON scores(xp DESC);
`)

const TOP_N = 20

const app = express()
app.use(express.json())

// GET /scores?limit=20
app.get('/scores', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || TOP_N, 100)
  const rows = db.prepare(`
    SELECT name, xp, level, floors_cleared AS floorsCleared, outcome, date
    FROM scores ORDER BY xp DESC LIMIT ?
  `).all(limit)
  res.json(rows)
})

// POST /scores  { name, xp, level, floorsCleared, outcome, date }
app.post('/scores', (req, res) => {
  const { name, xp, level, floorsCleared, outcome, date } = req.body ?? {}

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof xp !== 'number' || !isFinite(xp) ||
    typeof level !== 'number' ||
    typeof floorsCleared !== 'number' ||
    !['victory', 'defeat'].includes(outcome) ||
    typeof date !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid score data' })
  }

  db.prepare(`
    INSERT INTO scores (name, xp, level, floors_cleared, outcome, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name.trim().slice(0, 24),
    Math.round(xp),
    Math.round(level),
    Math.round(floorsCleared),
    outcome,
    date
  )

  const top = db.prepare(`
    SELECT name, xp, level, floors_cleared AS floorsCleared, outcome, date
    FROM scores ORDER BY xp DESC LIMIT ?
  `).all(TOP_N)
  res.json(top)
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`NvimDungeon score API on http://127.0.0.1:${PORT}`)
})
