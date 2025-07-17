/*
  Warnings:

  - You are about to drop the column `paymentId` on the `Sale` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_paymentId_fkey";

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "paymentId";

-- CreateTable
CREATE TABLE "_PaymentToSale" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PaymentToSale_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PaymentToSale_B_index" ON "_PaymentToSale"("B");

-- AddForeignKey
ALTER TABLE "_PaymentToSale" ADD CONSTRAINT "_PaymentToSale_A_fkey" FOREIGN KEY ("A") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentToSale" ADD CONSTRAINT "_PaymentToSale_B_fkey" FOREIGN KEY ("B") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
