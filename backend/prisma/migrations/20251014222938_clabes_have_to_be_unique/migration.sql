/*
  Warnings:

  - A unique constraint covering the columns `[clabe]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_clabe_key" ON "User"("clabe");
