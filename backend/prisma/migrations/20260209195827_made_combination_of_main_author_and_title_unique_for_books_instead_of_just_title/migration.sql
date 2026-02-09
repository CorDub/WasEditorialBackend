/*
  Warnings:

  - A unique constraint covering the columns `[title,mainAuthor]` on the table `Book` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Book_title_key";

-- CreateIndex
CREATE UNIQUE INDEX "Book_title_mainAuthor_key" ON "Book"("title", "mainAuthor");
