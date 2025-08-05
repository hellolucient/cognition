-- AlterTable
ALTER TABLE "public"."Thread" ADD COLUMN     "isContribution" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentThreadId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Thread" ADD CONSTRAINT "Thread_parentThreadId_fkey" FOREIGN KEY ("parentThreadId") REFERENCES "public"."Thread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
