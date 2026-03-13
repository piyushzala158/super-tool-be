const express = require('express');

const { requireAuth } = require('../../app/middleware/requireAuth');
const { getWidgetAccess } = require('./widget.service');

const router = express.Router();

router.get('/access', requireAuth, (req, res) => {
  const result = getWidgetAccess(req.query.projectId, req.user);

  if (result.error) {
    return res.status(result.error.status).json({ allowed: false, error: result.error.message });
  }

  res.json(result.value);
});

module.exports = router;
