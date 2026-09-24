const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM statuses ORDER BY position ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { label } = req.body;
  if (!label || !label.trim()) return res.status(400).json({ error: 'label is required' });

  const maxPos = db.prepare('SELECT MAX(position) AS maxPos FROM statuses').get();
  const position = (maxPos.maxPos ?? 0) + 1;
  const now = new Date().toISOString();

  const result = db
    .prepare('INSERT INTO statuses (label, position, created_at) VALUES (?, ?, ?)')
    .run(label.trim(), position, now);

  const row = db.prepare('SELECT * FROM statuses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM statuses WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'status not found' });

  const fields = ['label', 'position'];
  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  if (setClause) {
    db.prepare(`UPDATE statuses SET ${setClause} WHERE id = ?`).run(...Object.values(updates), id);
  }

  const row = db.prepare('SELECT * FROM statuses WHERE id = ?').get(id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM statuses WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'status not found' });

  const totalStatuses = db.prepare('SELECT COUNT(*) AS c FROM statuses').get().c;
  if (totalStatuses <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last remaining column' });
  }

  const ticketCount = db.prepare('SELECT COUNT(*) AS c FROM tickets WHERE status_id = ?').get(id).c;
  if (ticketCount > 0) {
    const { reassignTo } = req.body;
    if (!reassignTo) {
      return res.status(400).json({ error: 'reassignTo is required to delete a column with tickets', ticketCount });
    }
    if (Number(reassignTo) === Number(id)) {
      return res.status(400).json({ error: 'reassignTo must be a different column' });
    }
    const target = db.prepare('SELECT id FROM statuses WHERE id = ?').get(reassignTo);
    if (!target) return res.status(400).json({ error: 'reassignTo is not a valid column' });

    const maxPos = db.prepare('SELECT MAX(position) AS maxPos FROM tickets WHERE status_id = ?').get(reassignTo);
    let nextPos = (maxPos.maxPos ?? 0) + 1;
    const moving = db.prepare('SELECT id FROM tickets WHERE status_id = ? ORDER BY position ASC').all(id);
    const bump = db.prepare('UPDATE tickets SET status_id = ?, position = ? WHERE id = ?');
    for (const t of moving) {
      bump.run(reassignTo, nextPos, t.id);
      nextPos += 1;
    }
  }

  db.prepare('DELETE FROM statuses WHERE id = ?').run(id);
  res.status(204).end();
});

module.exports = router;
