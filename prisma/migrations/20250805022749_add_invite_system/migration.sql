-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "invitedById" TEXT;

-- CreateTable
CREATE TABLE "public"."InviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "public"."InviteCode"("code");

-- CreateIndex
CREATE INDEX "InviteCode_code_idx" ON "public"."InviteCode"("code");

-- CreateIndex
CREATE INDEX "InviteCode_createdById_idx" ON "public"."InviteCode"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "public"."WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "WaitlistEntry_email_idx" ON "public"."WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "WaitlistEntry_createdAt_idx" ON "public"."WaitlistEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InviteCode" ADD CONSTRAINT "InviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InviteCode" ADD CONSTRAINT "InviteCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
