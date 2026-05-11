/*
  Warnings:

  - A unique constraint covering the columns `[bookId,bookstoreId]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Inventory_bookId_bookstoreId_country_key";

-- AlterTable
ALTER TABLE "Inventory" ALTER COLUMN "country" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_bookId_bookstoreId_key" ON "Inventory"("bookId", "bookstoreId");
