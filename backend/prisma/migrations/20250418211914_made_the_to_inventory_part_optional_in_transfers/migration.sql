-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_toInventoryId_fkey";

-- AlterTable
ALTER TABLE "Transfer" ALTER COLUMN "toInventoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toInventoryId_fkey" FOREIGN KEY ("toInventoryId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
