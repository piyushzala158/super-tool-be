const env = {
  port: Number(process.env.PORT || 3001),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  cookieSameSite: process.env.COOKIE_SAMESITE,
  cookieSecure: process.env.COOKIE_SECURE,
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = {
  env,
};
