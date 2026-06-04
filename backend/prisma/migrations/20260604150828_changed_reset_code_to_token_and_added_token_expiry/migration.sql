/*
  Warnings:

  - You are about to drop the column `reset_password_code` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reset_password_token]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "reset_password_code",
ADD COLUMN     "reset_password_token" TEXT,
ADD COLUMN     "rest_password_expires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_reset_password_token_key" ON "User"("reset_password_token");
