const db = require('../../shared/db');

function createComment(comment) {
  db.prepare(
    `INSERT INTO comments (id, project_id, page_url, x_percent, y_percent, message, author_name, browser, os, window_size, dpr)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    comment.id,
    comment.projectId,
    comment.pageUrl,
    comment.xPercent,
    comment.yPercent,
    comment.message,
    comment.authorName,
    comment.browser,
    comment.os,
    comment.windowSize,
    comment.dpr
  );

  return findCommentById(comment.id);
}

function findCommentById(commentId) {
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) || null;
}

function listComments(projectId, url) {
  if (url) {
    return db.prepare(
      'SELECT * FROM comments WHERE project_id = ? AND page_url = ? ORDER BY created_at ASC'
    ).all(projectId, url);
  }

  return db.prepare(
    'SELECT * FROM comments WHERE project_id = ? ORDER BY created_at DESC'
  ).all(projectId);
}

function updateCommentMessage(commentId, message) {
  db.prepare('UPDATE comments SET message = ? WHERE id = ?').run(message, commentId);
  return findCommentById(commentId);
}

function deleteComment(commentId) {
  return db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
}

module.exports = {
  createComment,
  findCommentById,
  listComments,
  updateCommentMessage,
  deleteComment,
};
