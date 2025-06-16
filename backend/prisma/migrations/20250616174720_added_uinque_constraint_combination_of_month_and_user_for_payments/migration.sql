/*
  Warnings:

  - A unique constraint covering the columns `[userId,forMonth]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Payment_userId_forMonth_key" ON "Payment"("userId", "forMonth");
