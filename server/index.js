const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Constants
const BUTTONS = [
  'Jira',
  'GitHub',
  'Concourse DEV',
  'Qnobi DEV',
  'DEV environment',
  'Concourse PRE',
  'Qnobi PRE',
  'PRE environment',
  'Release Manager',
  'Concourse PRO',
];

// DB setup
const dbPath = path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    button TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_clicks_button_created_at ON clicks (button, created_at);
`);

function nowMs() { return Date.now(); }
function fourHoursAgoMs() { return nowMs() - 4 * 60 * 60 * 1000; }

// API
app.get('/api/buttons', (req, res) => {
  res.json({ buttons: BUTTONS });
});

app.get('/api/status', (req, res) => {
  const since = fourHoursAgoMs();
  const stmt = db.prepare(
    'SELECT button, COUNT(*) as count, MAX(created_at) as lastClick FROM clicks WHERE created_at >= ? GROUP BY button'
  );
  const rows = stmt.all(since);
  const map = new Map(rows.map(r => [r.button, { count: r.count, lastClick: r.lastClick || null }]));

  const result = BUTTONS.map(label => {
    const info = map.get(label) || { count: 0, lastClick: null };
    return { label, count: info.count, lastClick: info.lastClick };
  });
  res.json({ since, now: nowMs(), status: result });
});

app.post('/api/clicks', (req, res) => {
  const { label } = req.body || {};
  if (!label || !BUTTONS.includes(label)) {
    return res.status(400).json({ error: 'Invalid or missing label' });
  }
  const insert = db.prepare('INSERT INTO clicks (button, created_at) VALUES (?, ?)');
  insert.run(label, nowMs());
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
