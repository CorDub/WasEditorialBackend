-- AlterTable
ALTER TABLE "Cost" ADD COLUMN     "bookId" INTEGER;

-- AddForeignKey
ALTER TABLE "Cost" ADD CONSTRAINT "Cost_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
