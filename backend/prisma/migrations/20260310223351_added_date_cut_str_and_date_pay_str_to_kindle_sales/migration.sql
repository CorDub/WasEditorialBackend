/*
  Warnings:

  - Added the required column `dateCutStr` to the `KindleSale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `datePayStr` to the `KindleSale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KindleSale" ADD COLUMN     "dateCutStr" TEXT NOT NULL,
ADD COLUMN     "datePayStr" TEXT NOT NULL;
