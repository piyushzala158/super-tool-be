const db = require('../../shared/db');

function findUserByGoogleId(googleId) {
  return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId) || null;
}

function findUserById(userId) {
  return db.prepare(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?'
  ).get(userId) || null;
}

function findUserByEmail(email) {
  return db.prepare(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE LOWER(email) = ?'
  ).get(email.toLowerCase()) || null;
}

function createUser({ id, googleId, email, name, avatarUrl }) {
  db.prepare(
    'INSERT INTO users (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)'
  ).run(id, googleId, email, name, avatarUrl);

  return findUserById(id);
}

function updateUserProfile({ id, email, name, avatarUrl }) {
  db.prepare(
    'UPDATE users SET name = ?, avatar_url = ?, email = ? WHERE id = ?'
  ).run(name, avatarUrl, email, id);

  return findUserById(id);
}

module.exports = {
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  createUser,
  updateUserProfile,
};
