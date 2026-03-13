const express = require('express');

const { env } = require('../../app/config/env');
const { requireAuth } = require('../../app/middleware/requireAuth');
const {
  generateAuthUrl,
  authenticateWithGoogleCode,
  issueSessionToken,
} = require('./auth.service');
const { getCookieOptions } = require('./auth.cookies');

const router = express.Router();

router.get('/google', (req, res) => {
  res.redirect(generateAuthUrl());
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${env.frontendUrl}/login?error=no_code`);
  }

  try {
    const user = await authenticateWithGoogleCode(code);
    res.cookie('ck_token', issueSessionToken(user.id), getCookieOptions());
    res.redirect(`${env.frontendUrl}/dashboard`);
  } catch (error) {
    console.error('[Auth] Google callback error:', error);
    res.redirect(`${env.frontendUrl}/login?error=auth_failed`);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/logout', (req, res) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('ck_token', {
    path: cookieOptions.path,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
  });
  res.json({ success: true });
});

module.exports = router;
