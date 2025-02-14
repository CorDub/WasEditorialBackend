/*
  Warnings:

  - A unique constraint covering the columns `[first_name,last_name]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_first_name_last_name_key" ON "User"("first_name", "last_name");
