/*
  Warnings:

  - The `is_admin` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'superadmin', 'author');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "is_admin",
ADD COLUMN     "is_admin" "Role" NOT NULL DEFAULT 'author';
