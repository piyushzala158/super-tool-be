const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

const { env } = require('../../app/config/env');
const repository = require('./auth.repository');

const oauth2Client = new google.auth.OAuth2(
  env.googleClientId,
  env.googleClientSecret,
  `http://localhost:${env.port}/auth/google/callback`
);

function generateAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
}

async function authenticateWithGoogleCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data: profile } = await oauth2.userinfo.get();
  const { id: googleId, email, name, picture } = profile;

  let user = repository.findUserByGoogleId(googleId);

  if (!user) {
    user = repository.createUser({
      id: uuidv4(),
      googleId,
      email,
      name,
      avatarUrl: picture,
    });
  } else {
    user = repository.updateUserProfile({
      id: user.id,
      email,
      name,
      avatarUrl: picture,
    });
  }

  return user;
}

function issueSessionToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' });
}

function getUserFromRequest(req) {
  const token = req.cookies?.ck_token;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    return repository.findUserById(payload.userId);
  } catch (_) {
    return null;
  }
}

module.exports = {
  generateAuthUrl,
  authenticateWithGoogleCode,
  issueSessionToken,
  getUserFromRequest,
};
