-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_paymentId_fkey";

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "paymentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
