-- CreateEnum
CREATE TYPE "public"."ComplaintType" AS ENUM ('ORDER_ISSUE', 'DELIVERY_PROBLEM', 'QUALITY_ISSUE', 'REFUND_REQUEST', 'SELLER_BEHAVIOR', 'CUSTOMER_BEHAVIOR', 'PAYMENT_ISSUE', 'ACCOUNT_ISSUE', 'PRODUCT_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ComplaintStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ComplainantType" AS ENUM ('CUSTOMER', 'SELLER');

-- CreateEnum
CREATE TYPE "public"."AccusedType" AS ENUM ('CUSTOMER', 'SELLER', 'PLATFORM', 'DELIVERY_PARTNER');

-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'MANAGER');

-- CreateTable
CREATE TABLE "public"."Complaint" (
    "id" SERIAL NOT NULL,
    "complaintCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "complaintType" "public"."ComplaintType" NOT NULL,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "complainantType" "public"."ComplainantType" NOT NULL,
    "complainantId" INTEGER NOT NULL,
    "accusedType" "public"."AccusedType" NOT NULL,
    "accusedId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "resolution" TEXT,
    "actionTaken" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" INTEGER,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintAttachment" (
    "id" SERIAL NOT NULL,
    "complaintId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintNote" (
    "id" SERIAL NOT NULL,
    "complaintId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintStatusHistory" (
    "id" SERIAL NOT NULL,
    "complaintId" INTEGER NOT NULL,
    "oldStatus" "public"."ComplaintStatus",
    "newStatus" "public"."ComplaintStatus" NOT NULL,
    "changedBy" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL DEFAULT 'SUPPORT',
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_complaintCode_key" ON "public"."Complaint"("complaintCode");

-- CreateIndex
CREATE INDEX "Complaint_complainantType_complainantId_idx" ON "public"."Complaint"("complainantType", "complainantId");

-- CreateIndex
CREATE INDEX "Complaint_accusedType_accusedId_idx" ON "public"."Complaint"("accusedType", "accusedId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "public"."Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "public"."Complaint"("priority");

-- CreateIndex
CREATE INDEX "Complaint_complaintType_idx" ON "public"."Complaint"("complaintType");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintAttachment" ADD CONSTRAINT "ComplaintAttachment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintNote" ADD CONSTRAINT "ComplaintNote_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintNote" ADD CONSTRAINT "ComplaintNote_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintStatusHistory" ADD CONSTRAINT "ComplaintStatusHistory_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintStatusHistory" ADD CONSTRAINT "ComplaintStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
