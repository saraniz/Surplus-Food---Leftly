/*
  Warnings:

  - The values [CUSTOMER,SELLER] on the enum `SenderType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."SenderType_new" AS ENUM ('customer', 'seller');
ALTER TABLE "public"."Message" ALTER COLUMN "senderType" TYPE "public"."SenderType_new" USING ("senderType"::text::"public"."SenderType_new");
ALTER TYPE "public"."SenderType" RENAME TO "SenderType_old";
ALTER TYPE "public"."SenderType_new" RENAME TO "SenderType";
DROP TYPE "public"."SenderType_old";
COMMIT;
