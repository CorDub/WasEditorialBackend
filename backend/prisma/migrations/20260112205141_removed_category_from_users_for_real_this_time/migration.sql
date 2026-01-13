/*
  Warnings:

  - You are about to drop the column `categoryId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_categoryId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "categoryId";
