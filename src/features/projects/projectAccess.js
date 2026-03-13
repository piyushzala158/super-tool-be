const repository = require('./projects.repository');

function getProjectMembership(projectId, userId) {
  if (!projectId || !userId) return null;
  return repository.findProjectMembership(projectId, userId);
}

function requireProjectMember(projectId, userId) {
  return getProjectMembership(projectId, userId);
}

function requireProjectOwner(projectId, userId) {
  const membership = getProjectMembership(projectId, userId);
  if (!membership || membership.role !== 'owner') return null;
  return membership;
}

module.exports = {
  getProjectMembership,
  requireProjectMember,
  requireProjectOwner,
};
