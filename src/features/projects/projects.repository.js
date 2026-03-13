const db = require('../../shared/db');

function createProject({ id, ownerId, name }) {
  const insertProject = db.prepare(
    'INSERT INTO projects (id, user_id, name) VALUES (?, ?, ?)'
  );
  const insertMember = db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  );

  db.transaction(() => {
    insertProject.run(id, ownerId, name);
    insertMember.run(id, ownerId, 'owner');
  })();
}

function listProjectsForUser(userId) {
  return db.prepare(
    `SELECT p.id, p.user_id, p.name, p.created_at, pm.role AS membership_role
     FROM project_members pm
     JOIN projects p ON p.id = pm.project_id
     WHERE pm.user_id = ?
     ORDER BY p.created_at DESC`
  ).all(userId);
}

function findProjectForUser(projectId, userId) {
  return db.prepare(
    `SELECT p.id, p.user_id, p.name, p.created_at, pm.role AS membership_role
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE p.id = ? AND pm.user_id = ?`
  ).get(projectId, userId) || null;
}

function deleteProject(projectId) {
  return db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
}

function listProjectMembers(projectId) {
  return db.prepare(
    `SELECT u.id, u.email, u.name, u.avatar_url, pm.role, pm.created_at
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?
     ORDER BY CASE pm.role WHEN 'owner' THEN 0 ELSE 1 END, LOWER(COALESCE(u.name, u.email)) ASC`
  ).all(projectId);
}

function findProjectMembership(projectId, userId) {
  return db.prepare(
    `SELECT pm.project_id, pm.user_id, pm.role, p.name, p.created_at
     FROM project_members pm
     JOIN projects p ON p.id = pm.project_id
     WHERE pm.project_id = ? AND pm.user_id = ?`
  ).get(projectId, userId) || null;
}

function addProjectMember(projectId, userId, role = 'member') {
  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(projectId, userId, role);
}

function removeProjectMember(projectId, userId) {
  return db.prepare(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
  ).run(projectId, userId);
}

module.exports = {
  createProject,
  listProjectsForUser,
  findProjectForUser,
  deleteProject,
  listProjectMembers,
  findProjectMembership,
  addProjectMember,
  removeProjectMember,
};
