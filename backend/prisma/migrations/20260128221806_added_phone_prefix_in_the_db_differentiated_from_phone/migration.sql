-- AlterTable
ALTER TABLE "Inventory" ALTER COLUMN "price" SET DEFAULT 379;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phonePrefix" TEXT NOT NULL DEFAULT '+52';
