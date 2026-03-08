const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    google_id   TEXT NOT NULL UNIQUE,
    email       TEXT NOT NULL,
    name        TEXT,
    avatar_url  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    api_key     TEXT NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    page_url    TEXT NOT NULL,
    x_percent   REAL NOT NULL,
    y_percent   REAL NOT NULL,
    message     TEXT NOT NULL,
    author_name TEXT,
    browser     TEXT,
    os          TEXT,
    window_size TEXT,
    dpr         REAL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: add user_id to projects if it doesn't exist
try {
  db.exec(`ALTER TABLE projects ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE`);
} catch (_) {
  // Column already exists
}

// Migration: add device info columns if they don't exist yet
const migrationColumns = ['browser', 'os', 'window_size', 'dpr'];
for (const col of migrationColumns) {
  try {
    const type = col === 'dpr' ? 'REAL' : 'TEXT';
    db.exec(`ALTER TABLE comments ADD COLUMN ${col} ${type}`);
  } catch (_) {
    // Column already exists — ignore
  }
}

module.exports = db;
