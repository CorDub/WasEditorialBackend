/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Bookstore` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bookstore_name_key" ON "Bookstore"("name");
