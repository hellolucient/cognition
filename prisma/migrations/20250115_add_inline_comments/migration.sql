-- CreateTable
CREATE TABLE "InlineComment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "referencedText" TEXT NOT NULL,
    "textStartIndex" INTEGER NOT NULL,
    "textEndIndex" INTEGER NOT NULL,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InlineComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextSegmentVote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "inlineCommentId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,

    CONSTRAINT "TextSegmentVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InlineComment_threadId_idx" ON "InlineComment"("threadId");

-- CreateIndex
CREATE INDEX "InlineComment_authorId_idx" ON "InlineComment"("authorId");

-- CreateIndex
CREATE INDEX "InlineComment_textStartIndex_textEndIndex_idx" ON "InlineComment"("textStartIndex", "textEndIndex");

-- CreateIndex
CREATE INDEX "TextSegmentVote_inlineCommentId_idx" ON "TextSegmentVote"("inlineCommentId");

-- CreateIndex
CREATE INDEX "TextSegmentVote_userId_idx" ON "TextSegmentVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TextSegmentVote_userId_inlineCommentId_key" ON "TextSegmentVote"("userId", "inlineCommentId");

-- AddForeignKey
ALTER TABLE "InlineComment" ADD CONSTRAINT "InlineComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InlineComment" ADD CONSTRAINT "InlineComment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextSegmentVote" ADD CONSTRAINT "TextSegmentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextSegmentVote" ADD CONSTRAINT "TextSegmentVote_inlineCommentId_fkey" FOREIGN KEY ("inlineCommentId") REFERENCES "InlineComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
