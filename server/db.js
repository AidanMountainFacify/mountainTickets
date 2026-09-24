const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dataDir = process.env.MT_DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'tickets.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#5e6ad2',
    position REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    position REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'backlog',
    priority TEXT NOT NULL DEFAULT 'none',
    assignee TEXT DEFAULT '',
    deadline TEXT DEFAULT '',
    labels TEXT DEFAULT '',
    position REAL NOT NULL DEFAULT 0,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    author TEXT DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0,
    position REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`);

// Migration for databases created before workspaces existed.
const ticketColumns = db.prepare('PRAGMA table_info(tickets)').all();
if (!ticketColumns.some((c) => c.name === 'workspace_id')) {
  db.exec('ALTER TABLE tickets ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL');
}
if (!ticketColumns.some((c) => c.name === 'deadline')) {
  db.exec("ALTER TABLE tickets ADD COLUMN deadline TEXT DEFAULT ''");
}

// Migration for databases created before customizable columns existed: seed
// the statuses table from the previously-hardcoded set, add tickets.status_id,
// and backfill it from the old free-text status column.
const DEFAULT_STATUSES = [
  ['backlog', 'Backlog'],
  ['todo', 'To Do'],
  ['in_progress', 'In Progress'],
  ['in_review', 'In Review'],
  ['done', 'Done'],
];

const statusCount = db.prepare('SELECT COUNT(*) AS c FROM statuses').get().c;
let legacyKeyToStatusId = {};
if (statusCount === 0) {
  const now = new Date().toISOString();
  const insertStatus = db.prepare('INSERT INTO statuses (label, position, created_at) VALUES (?, ?, ?)');
  DEFAULT_STATUSES.forEach(([key, label], i) => {
    const result = insertStatus.run(label, i + 1, now);
    legacyKeyToStatusId[key] = Number(result.lastInsertRowid);
  });
}

const ticketColumns2 = db.prepare('PRAGMA table_info(tickets)').all();
if (!ticketColumns2.some((c) => c.name === 'status_id')) {
  db.exec('ALTER TABLE tickets ADD COLUMN status_id INTEGER REFERENCES statuses(id)');
}

if (Object.keys(legacyKeyToStatusId).length > 0) {
  const fallbackStatusId = legacyKeyToStatusId.backlog ?? Object.values(legacyKeyToStatusId)[0];
  const needsBackfill = db.prepare('SELECT id, status FROM tickets WHERE status_id IS NULL').all();
  const updateStatusId = db.prepare('UPDATE tickets SET status_id = ? WHERE id = ?');
  for (const t of needsBackfill) {
    updateStatusId.run(legacyKeyToStatusId[t.status] ?? fallbackStatusId, t.id);
  }
}

module.exports = db;
