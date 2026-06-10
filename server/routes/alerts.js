const express = require('express');
const db = require('../db/database');
const router = express.Router();

// GET /api/alerts — fetch all tracked coins
router.get('/', (req, res) => {
  const alerts = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
  res.json(alerts);
});

// POST /api/alerts — add a new coin to track
router.post('/', (req, res) => {
  const { coin_id, coin_name, coin_symbol, threshold } = req.body;

  if (!coin_id || !coin_name || !coin_symbol || threshold === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Prevent duplicate tracking
  const existing = db.prepare('SELECT id FROM alerts WHERE coin_id = ?').get(coin_id);
  if (existing) {
    return res.status(409).json({ error: 'Coin already tracked' });
  }

  const result = db.prepare(
    'INSERT INTO alerts (coin_id, coin_name, coin_symbol, threshold) VALUES (?, ?, ?, ?)'
  ).run(coin_id, coin_name, coin_symbol, threshold);

  const newAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newAlert);
});

// PATCH /api/alerts/:id — update ONLY the threshold (non-destructive)
// This is the RESTful PATCH pattern for your resume bullet
router.patch('/:id', (req, res) => {
  const { threshold } = req.body;
  const { id } = req.params;

  if (threshold === undefined) {
    return res.status(400).json({ error: 'threshold is required' });
  }

  const alert = db.prepare('SELECT id FROM alerts WHERE id = ?').get(id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  db.prepare('UPDATE alerts SET threshold = ? WHERE id = ?').run(threshold, id);
  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/alerts/:id — remove a tracked coin
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const alert = db.prepare('SELECT id FROM alerts WHERE id = ?').get(id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;