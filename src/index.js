require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const projectsRouter = require('./routes/projects');
const commentsRouter = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow all origins so the widget can call from any site
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}));

app.use(express.json());

// Serve widget.js as a static file
app.use('/widget.js', express.static(path.join(__dirname, '..', '..', 'widget', 'widget.js')));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
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
