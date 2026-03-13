const express = require('express');

const { requireAuth } = require('../../app/middleware/requireAuth');
const service = require('./projects.service');
const { parseCreateProject, parseMemberEmail } = require('./projects.schema');

const router = express.Router();

router.use(requireAuth);

router.post('/', (req, res) => {
  const parsed = parseCreateProject(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const project = service.createProject(req.user.id, parsed.value.name);
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/', (req, res) => {
  try {
    res.json(service.listProjects(req.user.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const project = service.getProject(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = service.deleteProject(req.params.id, req.user.id);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    res.json(result.value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.get('/:id/members', (req, res) => {
  try {
    const result = service.listMembers(req.params.id, req.user.id);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    res.json(result.value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project members' });
  }
});

router.post('/:id/members', (req, res) => {
  const parsed = parseMemberEmail(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const result = service.addMember(req.params.id, req.user.id, parsed.value.email);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    res.status(201).json(result.value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:memberUserId', (req, res) => {
  try {
    const result = service.removeMember(req.params.id, req.user.id, req.params.memberUserId);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    res.json(result.value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
