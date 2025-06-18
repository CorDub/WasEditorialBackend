-- AlterTable
ALTER TABLE "Inventory" ALTER COLUMN "price" SET DEFAULT 499.99;

-- CreateTable
CREATE TABLE "Cost" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cost" ADD CONSTRAINT "Cost_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
