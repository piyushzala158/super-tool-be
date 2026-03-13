const express = require('express');

const { requireAuth } = require('../../app/middleware/requireAuth');
const service = require('./comments.service');
const {
  parseCreateComment,
  parseCommentQuery,
  parseUpdateComment,
} = require('./comments.schema');

const router = express.Router();

router.use(requireAuth);

router.post('/', (req, res) => {
  const parsed = parseCreateComment(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const result = service.createComment(parsed.value, req.user);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    res.status(201).json(result.value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

router.get('/', (req, res) => {
  const parsed = parseCommentQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const result = service.listComments({
      ...parsed.value,
      userId: req.user.id,
    });
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    res.json(result.value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.put('/:id', (req, res) => {
  const parsed = parseUpdateComment(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const result = service.updateComment(req.params.id, parsed.value.message, req.user.id);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    res.json(result.value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = service.deleteComment(req.params.id, req.user.id);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    res.json(result.value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
