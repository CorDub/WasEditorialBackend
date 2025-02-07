/*
  Warnings:

  - You are about to drop the column `inventory_mex` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `inventory_usa` on the `Book` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookId,bookstoreId,country]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `isbn` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Made the column `type` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `country` to the `Inventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "inventory_mex",
DROP COLUMN "inventory_usa",
ADD COLUMN     "isbn" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "country" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_bookId_bookstoreId_country_key" ON "Inventory"("bookId", "bookstoreId", "country");
