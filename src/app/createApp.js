const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('../features/auth/auth.routes');
const projectRoutes = require('../features/projects/projects.routes');
const commentRoutes = require('../features/comments/comments.routes');
const widgetRoutes = require('../features/widget/widget.routes');
const { env } = require('./config/env');
require('../shared/db');

function createApp() {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      callback(null, origin || env.frontendUrl);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  }));

  app.use(cookieParser());
  app.use(express.json());

  app.use('/widget.js', express.static(path.join(__dirname, '..', '..', '..', 'widget', 'widget.js')));
  app.use('/widget', express.static(path.join(__dirname, '..', '..', '..', 'widget')));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/widget', widgetRoutes);

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = {
  createApp,
};
