-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "cusProfileImg" TEXT,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "public"."Seller" (
    "seller_id" SERIAL NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessEmail" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("seller_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seller_businessName_key" ON "public"."Seller"("businessName");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_businessEmail_key" ON "public"."Seller"("businessEmail");
