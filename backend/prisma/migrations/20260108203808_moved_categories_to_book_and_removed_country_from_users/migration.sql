/*
  Warnings:

  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "categoryId" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "country",
ALTER COLUMN "categoryId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
