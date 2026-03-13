const { v4: uuidv4 } = require('uuid');

const repository = require('./comments.repository');
const { getProjectMembership } = require('../projects/projectAccess');

function ensureProjectAccess(projectId, userId) {
  const membership = getProjectMembership(projectId, userId);

  if (!membership) {
    return { error: { status: 403, message: 'Project access denied' } };
  }

  return { value: membership };
}

function listComments({ projectId, url, userId }) {
  const access = ensureProjectAccess(projectId, userId);
  if (access.error) return access;

  return { value: repository.listComments(projectId, url) };
}

function createComment(payload, user) {
  const access = ensureProjectAccess(payload.projectId, user.id);
  if (access.error) return access;

  return {
    value: repository.createComment({
      id: uuidv4(),
      projectId: payload.projectId,
      pageUrl: payload.pageUrl,
      xPercent: payload.xPercent,
      yPercent: payload.yPercent,
      message: payload.message,
      authorName: user.name || user.email || payload.authorName,
      browser: payload.browser,
      os: payload.os,
      windowSize: payload.windowSize,
      dpr: payload.dpr,
    }),
  };
}

function updateComment(commentId, message, userId) {
  const comment = repository.findCommentById(commentId);
  if (!comment) {
    return { error: { status: 404, message: 'Comment not found' } };
  }

  const access = ensureProjectAccess(comment.project_id, userId);
  if (access.error) return access;

  return { value: repository.updateCommentMessage(commentId, message) };
}

function deleteComment(commentId, userId) {
  const comment = repository.findCommentById(commentId);
  if (!comment) {
    return { error: { status: 404, message: 'Comment not found' } };
  }

  const access = ensureProjectAccess(comment.project_id, userId);
  if (access.error) return access;

  repository.deleteComment(commentId);
  return { value: { success: true } };
}

module.exports = {
  listComments,
  createComment,
  updateComment,
  deleteComment,
};
