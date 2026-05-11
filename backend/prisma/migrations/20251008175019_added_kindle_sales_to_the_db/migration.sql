-- CreateTable
CREATE TABLE "KindleSale" (
    "id" SERIAL NOT NULL,
    "bookId" INTEGER NOT NULL,
    "quantityEbook" INTEGER NOT NULL,
    "quantityPod" INTEGER NOT NULL,
    "dateCut" TIMESTAMP(3) NOT NULL,
    "datePay" TIMESTAMP(3) NOT NULL,
    "regalias" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "KindleSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_KindleSaleToPayment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_KindleSaleToPayment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_KindleSaleToPayment_B_index" ON "_KindleSaleToPayment"("B");

-- AddForeignKey
ALTER TABLE "KindleSale" ADD CONSTRAINT "KindleSale_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KindleSaleToPayment" ADD CONSTRAINT "_KindleSaleToPayment_A_fkey" FOREIGN KEY ("A") REFERENCES "KindleSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KindleSaleToPayment" ADD CONSTRAINT "_KindleSaleToPayment_B_fkey" FOREIGN KEY ("B") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
