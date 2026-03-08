require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const commentsRouter = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS — allow frontend origin with credentials for cookies
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Serve widget.js as a static file
app.use('/widget.js', express.static(path.join(__dirname, '..', '..', 'widget', 'widget.js')));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Auth routes (mounted at /auth for OAuth redirects, /api/auth for API calls)
app.use('/auth', authRouter);
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/projects', projectsRouter);
app.use('/api/comments', commentsRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
