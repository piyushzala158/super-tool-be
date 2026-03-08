const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Middleware: validate api_key for write operations
function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'Missing x-api-key header' });

  const project = db.prepare('SELECT * FROM projects WHERE api_key = ?').get(apiKey);
  if (!project) return res.status(403).json({ error: 'Invalid API key' });

  req.project = project;
  next();
}

// POST /api/comments — Save a new comment
router.post('/', requireApiKey, (req, res) => {
  const { pageUrl, xPercent, yPercent, message, authorName } = req.body;

  if (!pageUrl || xPercent == null || yPercent == null || !message) {
    return res.status(400).json({ error: 'pageUrl, xPercent, yPercent, and message are required' });
  }

  const id = uuidv4();

  try {
    db.prepare(
      `INSERT INTO comments (id, project_id, page_url, x_percent, y_percent, message, author_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.project.id, pageUrl, xPercent, yPercent, message, authorName || null);

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

// GET /api/comments?projectId=&url= — Fetch comments for a project + URL
router.get('/', (req, res) => {
  const { projectId, url } = req.query;

  if (!projectId) {
    return res.status(400).json({ error: 'projectId query param is required' });
  }

  try {
    let comments;
    if (url) {
      comments = db.prepare(
        'SELECT * FROM comments WHERE project_id = ? AND page_url = ? ORDER BY created_at ASC'
      ).all(projectId, url);
    } else {
      comments = db.prepare(
        'SELECT * FROM comments WHERE project_id = ? ORDER BY created_at DESC'
      ).all(projectId);
    }
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// DELETE /api/comments/:id — Delete a comment
router.delete('/:id', requireApiKey, (req, res) => {
  try {
    // Ensure comment belongs to this project
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.project_id !== req.project.id) return res.status(403).json({ error: 'Forbidden' });

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
