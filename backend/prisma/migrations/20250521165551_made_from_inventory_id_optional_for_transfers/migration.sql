-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_fromInventoryId_fkey";

-- AlterTable
ALTER TABLE "Transfer" ALTER COLUMN "fromInventoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromInventoryId_fkey" FOREIGN KEY ("fromInventoryId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
