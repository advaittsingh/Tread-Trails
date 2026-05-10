-- CreateTable
CREATE TABLE "UserWishlistProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWishlistProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWishlistProduct_userId_productSlug_key" ON "UserWishlistProduct"("userId", "productSlug");

-- CreateIndex
CREATE INDEX "UserWishlistProduct_userId_idx" ON "UserWishlistProduct"("userId");

-- AddForeignKey
ALTER TABLE "UserWishlistProduct" ADD CONSTRAINT "UserWishlistProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
