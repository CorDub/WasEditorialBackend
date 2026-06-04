/*
  Warnings:

  - You are about to drop the column `rest_password_expires` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "rest_password_expires",
ADD COLUMN     "reset_password_expires" TIMESTAMP(3);
