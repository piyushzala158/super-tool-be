function parseCreateComment(body) {
  const payload = {
    projectId: body?.projectId,
    pageUrl: body?.pageUrl,
    xPercent: body?.xPercent,
    yPercent: body?.yPercent,
    message: body?.message?.trim(),
    authorName: body?.authorName?.trim() || null,
    browser: body?.browser || null,
    os: body?.os || null,
    windowSize: body?.windowSize || null,
    dpr: body?.dpr ?? null,
  };

  if (!payload.projectId || !payload.pageUrl || payload.xPercent == null || payload.yPercent == null || !payload.message) {
    return { error: 'projectId, pageUrl, xPercent, yPercent, and message are required' };
  }

  return { value: payload };
}

function parseCommentQuery(query) {
  const projectId = query?.projectId;
  const url = query?.url;

  if (!projectId) {
    return { error: 'projectId query param is required' };
  }

  return { value: { projectId, url } };
}

function parseUpdateComment(body) {
  const message = body?.message?.trim();

  if (!message) {
    return { error: 'message is required' };
  }

  return { value: { message } };
}

module.exports = {
  parseCreateComment,
  parseCommentQuery,
  parseUpdateComment,
};
