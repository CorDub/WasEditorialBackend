/*
  Warnings:

  - You are about to drop the column `price` on the `Book` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "price";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "price" DOUBLE PRECISION DEFAULT 199.99;
