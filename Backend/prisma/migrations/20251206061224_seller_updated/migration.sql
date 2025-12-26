/*
  Warnings:

  - The values [CONFIRMED,PREPARING,READY,OUT_FOR_DELIVERY] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('PLACED', 'PENDING', 'DELIVERED', 'CANCELLED');
ALTER TABLE "public"."Order" ALTER COLUMN "orderStatus" DROP DEFAULT;
ALTER TABLE "public"."Order" ALTER COLUMN "orderStatus" TYPE "public"."OrderStatus_new" USING ("orderStatus"::text::"public"."OrderStatus_new");
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "public"."Order" ALTER COLUMN "orderStatus" SET DEFAULT 'PLACED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "paymentStatus" SET DEFAULT 'PAID';

-- AlterTable
ALTER TABLE "public"."Seller" ADD COLUMN     "coverImg" TEXT;
