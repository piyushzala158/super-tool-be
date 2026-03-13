const { env } = require('../../app/config/env');

function getCookieOptions() {
  const secure = env.cookieSecure === 'true' || env.nodeEnv === 'production';

  return {
    httpOnly: true,
    secure,
    sameSite: env.cookieSameSite || (secure ? 'none' : 'lax'),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

module.exports = {
  getCookieOptions,
};
