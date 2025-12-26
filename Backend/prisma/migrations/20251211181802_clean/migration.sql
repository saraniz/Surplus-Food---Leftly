/*
  Warnings:

  - The values [customer,seller] on the enum `SenderType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('INAPPROPRIATE', 'FALSE_INFO', 'SPAM', 'CONFLICT_OF_INTEREST', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."ModerationAction" AS ENUM ('APPROVE', 'REJECT', 'DELETE', 'EDIT');

-- CreateEnum
CREATE TYPE "public"."WarningType" AS ENUM ('CONTENT_VIOLATION', 'SPAM', 'ABUSE', 'FAKE_REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."WarningStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."SenderType_new" AS ENUM ('CUSTOMER', 'SELLER');
ALTER TABLE "public"."Message" ALTER COLUMN "senderType" TYPE "public"."SenderType_new" USING ("senderType"::text::"public"."SenderType_new");
ALTER TYPE "public"."SenderType" RENAME TO "SenderType_old";
ALTER TYPE "public"."SenderType_new" RENAME TO "SenderType";
DROP TYPE "public"."SenderType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedBy" INTEGER,
ADD COLUMN     "moderationReason" TEXT,
ADD COLUMN     "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."Report" (
    "reportId" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "reportType" "public"."ReportType" NOT NULL,
    "reason" TEXT NOT NULL,
    "reporterId" INTEGER,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedBy" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "resolutionReason" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "public"."ModerationLog" (
    "logId" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "action" "public"."ModerationAction" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "moderatedBy" INTEGER NOT NULL,
    "moderatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedUser" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("logId")
);

-- CreateTable
CREATE TABLE "public"."UserWarning" (
    "warningId" SERIAL NOT NULL,
    "customerId" INTEGER,
    "sellerId" INTEGER,
    "warningType" "public"."WarningType" NOT NULL,
    "message" TEXT NOT NULL,
    "warnedBy" INTEGER NOT NULL,
    "warnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."WarningStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserWarning_pkey" PRIMARY KEY ("warningId")
);

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("reviewId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationLog" ADD CONSTRAINT "ModerationLog_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("reviewId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWarning" ADD CONSTRAINT "UserWarning_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWarning" ADD CONSTRAINT "UserWarning_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."Seller"("seller_id") ON DELETE SET NULL ON UPDATE CASCADE;
