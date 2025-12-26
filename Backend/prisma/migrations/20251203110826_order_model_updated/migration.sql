-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('DEBIT_CARD', 'CASH_ON_DELIVERY');

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'DEBIT_CARD';
