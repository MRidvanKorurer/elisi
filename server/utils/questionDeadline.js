const RESPONSE_DAYS = 3;
const RESPONSE_MS = RESPONSE_DAYS * 24 * 60 * 60 * 1000;

const isOpenQuestion = (doc) => !String(doc?.answer || '').trim();

const dueAtOf = (doc) => {
  if (doc?.responseDueAt) return new Date(doc.responseDueAt);
  return new Date(new Date(doc.createdAt).getTime() + RESPONSE_MS);
};

const questionTiming = (doc, now = Date.now()) => {
  const open = isOpenQuestion(doc);
  const dueAt = dueAtOf(doc);
  const remainingMs = dueAt.getTime() - now;
  return {
    dueAt,
    overdue: open && remainingMs < 0,
    remainingHours: open ? Math.ceil(remainingMs / (60 * 60 * 1000)) : null
  };
};

const unansweredQuery = {
  isPublic: true,
  $or: [{ answer: { $exists: false } }, { answer: '' }, { answer: null }]
};

const overdueQuery = (now = new Date()) => {
  const cutoff = new Date(now.getTime() - RESPONSE_MS);
  return {
    ...unansweredQuery,
    $and: [
      {
        $or: [
          { responseDueAt: { $lte: now } },
          { responseDueAt: null, createdAt: { $lte: cutoff } },
          { responseDueAt: { $exists: false }, createdAt: { $lte: cutoff } }
        ]
      }
    ]
  };
};

module.exports = {
  RESPONSE_DAYS,
  RESPONSE_MS,
  questionTiming,
  unansweredQuery,
  overdueQuery
};
