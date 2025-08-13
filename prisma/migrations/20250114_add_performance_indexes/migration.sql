-- Add critical performance indexes that are missing

-- Index for Thread.authorId (used heavily in profile queries)
CREATE INDEX IF NOT EXISTS "Thread_authorId_idx" ON "Thread"("authorId");

-- Index for Thread.isContribution (used in profile and feed queries)
CREATE INDEX IF NOT EXISTS "Thread_isContribution_idx" ON "Thread"("isContribution");

-- Composite index for Thread queries by author and contribution status
CREATE INDEX IF NOT EXISTS "Thread_authorId_isContribution_idx" ON "Thread"("authorId", "isContribution");

-- Index for Thread.createdAt (used in ordering)
CREATE INDEX IF NOT EXISTS "Thread_createdAt_idx" ON "Thread"("createdAt");

-- Index for Upvote.threadId (used in vote counting)
CREATE INDEX IF NOT EXISTS "Upvote_threadId_idx" ON "Upvote"("threadId");

-- Index for Downvote.threadId (used in vote counting)
CREATE INDEX IF NOT EXISTS "Downvote_threadId_idx" ON "Downvote"("threadId");

-- Index for Comment.threadId (used in comment counting)
CREATE INDEX IF NOT EXISTS "Comment_threadId_idx" ON "Comment"("threadId");

-- Index for Comment.authorId (used in user queries)
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment"("authorId");
