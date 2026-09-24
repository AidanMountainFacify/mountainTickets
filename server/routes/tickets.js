const express = require('express');
const db = require('../db');

const router = express.Router();

function rowToTicket(row) {
  return {
    ...row,
    labels: row.labels ? row.labels.split(',').filter(Boolean) : [],
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT t.*,
         (SELECT COUNT(*) FROM checklist_items c WHERE c.ticket_id = t.id) AS checklist_total,
         (SELECT COUNT(*) FROM checklist_items c WHERE c.ticket_id = t.id AND c.checked = 1) AS checklist_checked
       FROM tickets t
       ORDER BY t.position ASC`
    )
    .all();
  res.json(rows.map(rowToTicket));
});

router.post('/', (req, res) => {
  const {
    title,
    description = '',
    status_id,
    priority = 'none',
    deadline = '',
    labels = [],
    workspace_id = null,
  } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });

  let resolvedStatusId = status_id;
  if (!resolvedStatusId) {
    const first = db.prepare('SELECT id FROM statuses ORDER BY position ASC').get();
    if (!first) return res.status(400).json({ error: 'No columns exist to place this ticket in' });
    resolvedStatusId = first.id;
  }

  const maxPos = db.prepare('SELECT MAX(position) AS maxPos FROM tickets WHERE status_id = ?').get(resolvedStatusId);
  const position = (maxPos.maxPos ?? 0) + 1;
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO tickets (title, description, status_id, priority, deadline, labels, position, workspace_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(title.trim(), description, resolvedStatusId, priority, deadline, labels.join(','), position, workspace_id, now, now);

  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(rowToTicket(row));
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'ticket not found' });

  const fields = ['title', 'description', 'status_id', 'priority', 'deadline', 'position', 'workspace_id'];
  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (req.body.labels !== undefined) updates.labels = req.body.labels.join(',');

  const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  if (setClause) {
    const values = Object.values(updates);
    db.prepare(`UPDATE tickets SET ${setClause}, updated_at = ? WHERE id = ?`).run(
      ...values,
      new Date().toISOString(),
      id
    );
  }

  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  res.json(rowToTicket(row));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'ticket not found' });
  db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
  res.status(204).end();
});

router.get('/:id/comments', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC')
    .all(req.params.id);
  res.json(rows);
});

router.post('/:id/comments', (req, res) => {
  const { id } = req.params;
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ error: 'ticket not found' });

  const { body, author = '' } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'body is required' });

  const now = new Date().toISOString();
  const result = db
    .prepare('INSERT INTO comments (ticket_id, body, author, created_at) VALUES (?, ?, ?, ?)')
    .run(id, body.trim(), author, now);

  const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

function rowToChecklistItem(row) {
  return { ...row, checked: !!row.checked };
}

router.get('/:id/checklist', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM checklist_items WHERE ticket_id = ? ORDER BY position ASC')
    .all(req.params.id);
  res.json(rows.map(rowToChecklistItem));
});

router.post('/:id/checklist', (req, res) => {
  const { id } = req.params;
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(id);
  if (!ticket) return res.status(404).json({ error: 'ticket not found' });

  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });

  const maxPos = db.prepare('SELECT MAX(position) AS maxPos FROM checklist_items WHERE ticket_id = ?').get(id);
  const position = (maxPos.maxPos ?? 0) + 1;
  const now = new Date().toISOString();

  const result = db
    .prepare('INSERT INTO checklist_items (ticket_id, text, checked, position, created_at) VALUES (?, ?, 0, ?, ?)')
    .run(id, text.trim(), position, now);

  const row = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(rowToChecklistItem(row));
});

router.patch('/:id/checklist/:itemId', (req, res) => {
  const { id, itemId } = req.params;
  const existing = db.prepare('SELECT * FROM checklist_items WHERE id = ? AND ticket_id = ?').get(itemId, id);
  if (!existing) return res.status(404).json({ error: 'checklist item not found' });

  const updates = {};
  if (req.body.text !== undefined) updates.text = req.body.text;
  if (req.body.checked !== undefined) updates.checked = req.body.checked ? 1 : 0;
  if (req.body.position !== undefined) updates.position = req.body.position;

  const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  if (setClause) {
    db.prepare(`UPDATE checklist_items SET ${setClause} WHERE id = ?`).run(...Object.values(updates), itemId);
  }

  const row = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(itemId);
  res.json(rowToChecklistItem(row));
});

router.delete('/:id/checklist/:itemId', (req, res) => {
  const { id, itemId } = req.params;
  const existing = db.prepare('SELECT * FROM checklist_items WHERE id = ? AND ticket_id = ?').get(itemId, id);
  if (!existing) return res.status(404).json({ error: 'checklist item not found' });
  db.prepare('DELETE FROM checklist_items WHERE id = ?').run(itemId);
  res.status(204).end();
});

module.exports = router;
