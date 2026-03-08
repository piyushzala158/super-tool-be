const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  JWT_SECRET,
  FRONTEND_URL = 'http://localhost:5173',
  PORT = 3001,
} = process.env;

const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// GET /auth/google — Redirect to Google consent screen
router.get('/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
  res.redirect(url);
});

// GET /auth/google/callback — Handle Google callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    const { id: googleId, email, name, picture } = profile;

    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

    if (!user) {
      const userId = uuidv4();
      db.prepare(
        'INSERT INTO users (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)'
      ).run(userId, googleId, email, name, picture);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else {
      // Update name/avatar in case they changed
      db.prepare(
        'UPDATE users SET name = ?, avatar_url = ?, email = ? WHERE id = ?'
      ).run(name, picture, email, user.id);
    }

    // Issue JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Set HTTP-only cookie
    res.cookie('ck_token', token, {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error('[Auth] Google callback error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

// GET /api/auth/me — Get current user
router.get('/me', (req, res) => {
  const token = req.cookies?.ck_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?').get(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/logout — Clear token cookie
router.post('/logout', (req, res) => {
  res.clearCookie('ck_token', { path: '/' });
  res.json({ success: true });
});

// GET /api/auth/verify-widget — Check if user owns project (for widget visibility)
router.get('/verify-widget', (req, res) => {
  const { userId, projectId } = req.query;
  if (!userId || !projectId) {
    return res.json({ allowed: false });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId);
  res.json({ allowed: !!project });
});

module.exports = router;
