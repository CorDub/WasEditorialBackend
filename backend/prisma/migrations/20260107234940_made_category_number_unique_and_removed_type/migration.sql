/*
  Warnings:

  - You are about to drop the column `type` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[number]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Made the column `number` on table `Category` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Category_type_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "type",
ALTER COLUMN "number" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_number_key" ON "Category"("number");
