const { getProjectMembership } = require('../projects/projectAccess');

function getWidgetAccess(projectId, user) {
  if (!projectId) {
    return { error: { status: 400, message: 'projectId is required' } };
  }

  const membership = getProjectMembership(projectId, user.id);
  if (!membership) {
    return { error: { status: 403, message: 'Project access denied' } };
  }

  return {
    value: {
      allowed: true,
      role: membership.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    },
  };
}

module.exports = {
  getWidgetAccess,
};
