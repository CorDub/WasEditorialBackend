-- AlterTable
ALTER TABLE "Cost" ALTER COLUMN "dateStr" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bank_account_number" TEXT;
