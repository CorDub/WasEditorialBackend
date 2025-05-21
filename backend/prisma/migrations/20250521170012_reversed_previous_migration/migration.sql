/*
  Warnings:

  - Made the column `fromInventoryId` on table `Transfer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_fromInventoryId_fkey";

-- AlterTable
ALTER TABLE "Transfer" ALTER COLUMN "fromInventoryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromInventoryId_fkey" FOREIGN KEY ("fromInventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
