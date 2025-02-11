/*
  Warnings:

  - You are about to drop the `UserBooks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserBooks" DROP CONSTRAINT "UserBooks_bookId_fkey";

-- DropForeignKey
ALTER TABLE "UserBooks" DROP CONSTRAINT "UserBooks_userId_fkey";

-- DropTable
DROP TABLE "UserBooks";
