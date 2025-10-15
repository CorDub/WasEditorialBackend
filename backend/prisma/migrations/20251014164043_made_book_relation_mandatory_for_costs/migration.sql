/*
  Warnings:

  - Made the column `bookId` on table `Cost` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Cost" DROP CONSTRAINT "Cost_bookId_fkey";

-- AlterTable
ALTER TABLE "Cost" ALTER COLUMN "bookId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Cost" ADD CONSTRAINT "Cost_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
