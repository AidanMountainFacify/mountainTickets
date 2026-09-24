const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM workspaces ORDER BY position ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, color = '#5e6ad2' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  const maxPos = db.prepare('SELECT MAX(position) AS maxPos FROM workspaces').get();
  const position = (maxPos.maxPos ?? 0) + 1;
  const now = new Date().toISOString();

  try {
    const result = db
      .prepare('INSERT INTO workspaces (name, color, position, created_at) VALUES (?, ?, ?, ?)')
      .run(name.trim(), color, position, now);
    const row = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    res.status(400).json({ error: 'A workspace with that name already exists' });
  }
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'workspace not found' });

  const fields = ['name', 'color', 'position'];
  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  if (setClause) {
    try {
      db.prepare(`UPDATE workspaces SET ${setClause} WHERE id = ?`).run(...Object.values(updates), id);
    } catch (e) {
      return res.status(400).json({ error: 'A workspace with that name already exists' });
    }
  }

  const row = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'workspace not found' });
  db.prepare('UPDATE tickets SET workspace_id = NULL WHERE workspace_id = ?').run(id);
  db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
  res.status(204).end();
});

module.exports = router;
