const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data.sqlite');

function reset() {
  // Ensure file exists so we can open it; if it doesn't, server will recreate tables on next start.
  const db = new Database(dbPath);
  try {
    db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        button TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      DELETE FROM clicks;
      VACUUM;
    `);
    console.log('Database reset: all click records removed.');
  } finally {
    db.close();
  }
}

reset();
