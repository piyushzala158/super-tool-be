const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'database.sqlite');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function tableExists(name) {
  return !!db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
  ).get(name);
}

function getTableColumns(name) {
  if (!tableExists(name)) return [];
  return db.prepare(`PRAGMA table_info(${name})`).all().map((column) => column.name);
}

function getForeignKeyTargets(name) {
  if (!tableExists(name)) return [];
  return db.prepare(`PRAGMA foreign_key_list(${name})`).all().map((row) => row.table);
}

function ensureUsersTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      google_id   TEXT NOT NULL UNIQUE,
      email       TEXT NOT NULL,
      name        TEXT,
      avatar_url  TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function ensureProjectsTable() {
  const rebuildComments =
    tableExists('comments') && getForeignKeyTargets('comments').includes('projects_legacy');
  const rebuildMembers =
    tableExists('project_members') && getForeignKeyTargets('project_members').includes('projects_legacy');

  if (!tableExists('projects')) {
    db.exec(`
      CREATE TABLE projects (
        id          TEXT PRIMARY KEY,
        user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return;
  }

  const columns = getTableColumns('projects');
  const needsRebuild =
    columns.includes('api_key') ||
    !columns.includes('user_id') ||
    !columns.includes('created_at') ||
    !columns.includes('name') ||
    !columns.includes('id');

  if (!needsRebuild && !rebuildComments && !rebuildMembers) return;

  db.exec('PRAGMA foreign_keys = OFF');
  db.exec('BEGIN TRANSACTION');

  try {
    if (tableExists('comments')) {
      db.exec('ALTER TABLE comments RENAME TO comments_legacy');
    }

    if (tableExists('project_members')) {
      db.exec('ALTER TABLE project_members RENAME TO project_members_legacy');
    }

    db.exec('ALTER TABLE projects RENAME TO projects_legacy');

    db.exec(`
      CREATE TABLE projects (
        id          TEXT PRIMARY KEY,
        user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      INSERT INTO projects (id, user_id, name, created_at)
      SELECT id, user_id, name, COALESCE(created_at, CURRENT_TIMESTAMP)
      FROM projects_legacy;
    `);

    db.exec(`
      CREATE TABLE project_members (
        project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role        TEXT NOT NULL DEFAULT 'member',
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, user_id)
      );
    `);

    if (tableExists('project_members_legacy')) {
      db.exec(`
        INSERT INTO project_members (project_id, user_id, role, created_at)
        SELECT project_id, user_id, COALESCE(role, 'member'), COALESCE(created_at, CURRENT_TIMESTAMP)
        FROM project_members_legacy;
      `);
    }

    db.exec(`
      CREATE TABLE comments (
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

    if (tableExists('comments_legacy')) {
      const legacyColumns = getTableColumns('comments_legacy');
      const browser = legacyColumns.includes('browser') ? 'browser' : 'NULL';
      const os = legacyColumns.includes('os') ? 'os' : 'NULL';
      const windowSize = legacyColumns.includes('window_size') ? 'window_size' : 'NULL';
      const dpr = legacyColumns.includes('dpr') ? 'dpr' : 'NULL';

      db.exec(`
        INSERT INTO comments (id, project_id, page_url, x_percent, y_percent, message, author_name, browser, os, window_size, dpr, created_at)
        SELECT id, project_id, page_url, x_percent, y_percent, message, author_name,
               ${browser}, ${os}, ${windowSize}, ${dpr}, COALESCE(created_at, CURRENT_TIMESTAMP)
        FROM comments_legacy;
      `);
    }

    db.exec('DROP TABLE projects_legacy');
    if (tableExists('project_members_legacy')) {
      db.exec('DROP TABLE project_members_legacy');
    }
    if (tableExists('comments_legacy')) {
      db.exec('DROP TABLE comments_legacy');
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }
}

function ensureBaseTables() {
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS project_members (
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        TEXT NOT NULL DEFAULT 'member',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, user_id)
    );
  `);
}

function ensureCommentColumns() {
  const migrationColumns = ['browser', 'os', 'window_size', 'dpr'];

  for (const column of migrationColumns) {
    try {
      const type = column === 'dpr' ? 'REAL' : 'TEXT';
      db.exec(`ALTER TABLE comments ADD COLUMN ${column} ${type}`);
    } catch (_) {
      // Column already exists.
    }
  }
}

function backfillOwnerMemberships() {
  db.exec(`
    INSERT INTO project_members (project_id, user_id, role)
    SELECT p.id, p.user_id, 'owner'
    FROM projects p
    WHERE p.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = p.user_id
      );
  `);
}

function initializeDatabase() {
  ensureUsersTable();
  ensureProjectsTable();
  ensureBaseTables();
  ensureCommentColumns();
  backfillOwnerMemberships();
}

initializeDatabase();

module.exports = db;
