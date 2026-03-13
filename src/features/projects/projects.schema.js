function parseCreateProject(body) {
  const name = body?.name?.trim();

  if (!name) {
    return { error: 'Project name is required' };
  }

  return { value: { name } };
}

function parseMemberEmail(body) {
  const email = body?.email?.trim().toLowerCase();

  if (!email) {
    return { error: 'Email is required' };
  }

  return { value: { email } };
}

module.exports = {
  parseCreateProject,
  parseMemberEmail,
};
