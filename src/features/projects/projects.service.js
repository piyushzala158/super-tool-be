const { v4: uuidv4 } = require('uuid');

const authRepository = require('../auth/auth.repository');
const repository = require('./projects.repository');
const access = require('./projectAccess');

function createProject(userId, name) {
  const id = uuidv4();
  repository.createProject({ id, ownerId: userId, name });
  return repository.findProjectForUser(id, userId);
}

function listProjects(userId) {
  return repository.listProjectsForUser(userId);
}

function getProject(projectId, userId) {
  return repository.findProjectForUser(projectId, userId);
}

function deleteProject(projectId, userId) {
  const membership = access.requireProjectOwner(projectId, userId);
  if (!membership) {
    return { error: { status: 403, message: 'Only project owners can perform this action' } };
  }

  const result = repository.deleteProject(projectId);
  if (result.changes === 0) {
    return { error: { status: 404, message: 'Project not found' } };
  }

  return { value: { success: true } };
}

function listMembers(projectId, userId) {
  const membership = access.requireProjectMember(projectId, userId);
  if (!membership) {
    return { error: { status: 403, message: 'Project access denied' } };
  }

  return { value: repository.listProjectMembers(projectId) };
}

function addMember(projectId, ownerUserId, email) {
  const ownerMembership = access.requireProjectOwner(projectId, ownerUserId);
  if (!ownerMembership) {
    return { error: { status: 403, message: 'Only project owners can perform this action' } };
  }

  const user = authRepository.findUserByEmail(email);
  if (!user) {
    return { error: { status: 404, message: 'User not found. Ask them to sign in first.' } };
  }

  const existingMembership = repository.findProjectMembership(projectId, user.id);
  if (existingMembership) {
    return { error: { status: 409, message: 'User is already a member of this project' } };
  }

  repository.addProjectMember(projectId, user.id, 'member');
  return {
    value: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      role: 'member',
    },
  };
}

function removeMember(projectId, ownerUserId, memberUserId) {
  const ownerMembership = access.requireProjectOwner(projectId, ownerUserId);
  if (!ownerMembership) {
    return { error: { status: 403, message: 'Only project owners can perform this action' } };
  }

  const membership = repository.findProjectMembership(projectId, memberUserId);
  if (!membership) {
    return { error: { status: 404, message: 'Member not found' } };
  }

  if (membership.role === 'owner') {
    return { error: { status: 400, message: 'Project owner cannot be removed' } };
  }

  repository.removeProjectMember(projectId, memberUserId);
  return { value: { success: true } };
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  deleteProject,
  listMembers,
  addMember,
  removeMember,
};
