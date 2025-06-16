/*
  Warnings:

  - You are about to drop the column `isPaid` on the `Payment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('created', 'solicited', 'paid');

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "isPaid",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'created';
