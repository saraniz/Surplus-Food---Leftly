-- CreateTable
CREATE TABLE "public"."Product" (
    "product_id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "discountPrice" TEXT NOT NULL,
    "shelfTime" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "productImg" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id")
);
