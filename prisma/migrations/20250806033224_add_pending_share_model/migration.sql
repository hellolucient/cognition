-- CreateTable
CREATE TABLE "public"."PendingShare" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PendingShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingShare_userId_idx" ON "public"."PendingShare"("userId");

-- CreateIndex
CREATE INDEX "PendingShare_status_idx" ON "public"."PendingShare"("status");

-- CreateIndex
CREATE INDEX "PendingShare_createdAt_idx" ON "public"."PendingShare"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."PendingShare" ADD CONSTRAINT "PendingShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
