const { getUserFromRequest } = require('../../features/auth/auth.service');

function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}

module.exports = {
  requireAuth,
};
