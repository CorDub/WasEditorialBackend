/*
  Warnings:

  - Added the required column `dateStr` to the `Impression` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Impression" ADD COLUMN     "dateStr" TEXT NOT NULL;
