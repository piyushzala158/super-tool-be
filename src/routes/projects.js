const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

// All project routes require authentication
router.use(requireAuth);

// POST /api/projects — Create a new project
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const id = uuidv4();
  const apiKey = uuidv4().replace(/-/g, '');

  try {
    db.prepare(
      'INSERT INTO projects (id, user_id, name, api_key) VALUES (?, ?, ?, ?)'
    ).run(id, req.user.id, name.trim(), apiKey);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects — List current user's projects
router.get('/', (req, res) => {
  try {
    const projects = db.prepare(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id — Get a single project (only if owned by user)
router.get('/:id', (req, res) => {
  try {
    const project = db.prepare(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// DELETE /api/projects/:id — Delete a project (only if owned by user)
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM projects WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
