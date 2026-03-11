/*
  Warnings:

  - Added the required column `dateStr` to the `Cost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cost" ADD COLUMN     "dateStr" TEXT NOT NULL;
