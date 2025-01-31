/*
  Warnings:

  - Made the column `country` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `first_name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL;
