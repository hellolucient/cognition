-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "encryptedAnthropicKey" TEXT,
ADD COLUMN     "encryptedGoogleKey" TEXT;
