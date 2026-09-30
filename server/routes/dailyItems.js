const express = require('express');
const db = require('../db');

const router = express.Router();

function todayLocal() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rowToDailyItem(row) {
  return {
    id: row.id,
    kind: row.kind,
    ticket_id: row.ticket_id,
    text: row.text,
    checked: !!row.checked,
    position: row.position,
    created_at: row.created_at,
    checked_at: row.checked_at,
    checked_date: row.checked_date,
    ticket: row.ticket_id
      ? {
          id: row.t_id,
          title: row.t_title,
          workspace_id: row.t_workspace_id,
          status_id: row.t_status_id,
        }
      : null,
  };
}

const SELECT_WITH_TICKET = `
  SELECT d.*, t.id AS t_id, t.title AS t_title, t.workspace_id AS t_workspace_id, t.status_id AS t_status_id
  FROM daily_items d
  LEFT JOIN tickets t ON t.id = d.ticket_id
`;

// Today's active list: anything not yet done (no matter how old — this is
// what makes unfinished items "carry over" automatically) plus anything
// finished today, so today's completions stay visible until the day ends.
router.get('/', (req, res) => {
  const today = todayLocal();
  const rows = db
    .prepare(`${SELECT_WITH_TICKET} WHERE d.checked = 0 OR d.checked_date = ? ORDER BY d.position ASC`)
    .all(today);
  res.json(rows.map(rowToDailyItem));
});

router.post('/', (req, res) => {
  const { kind, text = '', ticket_id = null } = req.body;
  if (kind !== 'ticket' && kind !== 'note') {
    return res.status(400).json({ error: "kind must be 'ticket' or 'note'" });
  }
  if (kind === 'note' && !text.trim()) {
    return res.status(400).json({ error: 'text is required for a note item' });
  }
  if (kind === 'ticket') {
    if (!ticket_id) return res.status(400).json({ error: 'ticket_id is required for a ticket item' });
    const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(ticket_id);
    if (!ticket) return res.status(404).json({ error: 'ticket not found' });
  }

  const maxPos = db.prepare('SELECT MAX(position) AS maxPos FROM daily_items WHERE checked = 0').get();
  const position = (maxPos.maxPos ?? 0) + 1;
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO daily_items (kind, ticket_id, text, checked, position, created_at)
       VALUES (?, ?, ?, 0, ?, ?)`
    )
    .run(kind, kind === 'ticket' ? ticket_id : null, kind === 'note' ? text.trim() : '', position, now);

  const row = db.prepare(`${SELECT_WITH_TICKET} WHERE d.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(rowToDailyItem(row));
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM daily_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'daily item not found' });

  const updates = {};
  if (req.body.text !== undefined) updates.text = req.body.text;
  if (req.body.position !== undefined) updates.position = req.body.position;
  if (req.body.checked !== undefined) {
    updates.checked = req.body.checked ? 1 : 0;
    updates.checked_at = req.body.checked ? new Date().toISOString() : null;
    updates.checked_date = req.body.checked ? todayLocal() : null;
  }

  const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  if (setClause) {
    db.prepare(`UPDATE daily_items SET ${setClause} WHERE id = ?`).run(...Object.values(updates), id);
  }

  const row = db.prepare(`${SELECT_WITH_TICKET} WHERE d.id = ?`).get(id);
  res.json(rowToDailyItem(row));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM daily_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'daily item not found' });
  db.prepare('DELETE FROM daily_items WHERE id = ?').run(id);
  res.status(204).end();
});

// Which past days have anything completed on them, most recent first.
router.get('/history', (req, res) => {
  const today = todayLocal();
  const rows = db
    .prepare(
      `SELECT checked_date AS date, COUNT(*) AS count
       FROM daily_items
       WHERE checked_date IS NOT NULL AND checked_date != ?
       GROUP BY checked_date
       ORDER BY checked_date DESC`
    )
    .all(today);
  res.json(rows);
});

router.get('/history/:date', (req, res) => {
  const rows = db
    .prepare(`${SELECT_WITH_TICKET} WHERE d.checked_date = ? ORDER BY d.checked_at ASC`)
    .all(req.params.date);
  res.json(rows.map(rowToDailyItem));
});

module.exports = router;
