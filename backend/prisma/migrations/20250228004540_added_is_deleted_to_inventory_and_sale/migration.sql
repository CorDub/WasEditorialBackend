-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
