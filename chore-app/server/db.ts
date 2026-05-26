// node:sqlite was stabilised in Node 24 — no flag needed.
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'chores.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    color      TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chores (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    title               TEXT NOT NULL,
    description         TEXT,
    assigned_to         INTEGER REFERENCES members(id) ON DELETE SET NULL,
    start_date          TEXT NOT NULL,
    end_date            TEXT,
    recurrence_type     TEXT NOT NULL DEFAULT 'none',
    recurrence_interval INTEGER NOT NULL DEFAULT 1,
    recurrence_days     TEXT,
    created_at          TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS completions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    chore_id        INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    occurrence_date TEXT NOT NULL,
    completed_by    INTEGER REFERENCES members(id) ON DELETE SET NULL,
    note            TEXT,
    completed_at    TEXT DEFAULT (datetime('now')),
    UNIQUE(chore_id, occurrence_date)
  );
`);

export default db;
