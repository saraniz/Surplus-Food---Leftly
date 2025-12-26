-- CreateEnum
CREATE TYPE "public"."CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "public"."Category" (
    "cId" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,
    "cDescription" TEXT,
    "cStatus" "public"."CategoryStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("cId")
);
