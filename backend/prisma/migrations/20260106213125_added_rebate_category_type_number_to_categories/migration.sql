-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('comissions', 'regalias');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "category_type" "CategoryType" NOT NULL DEFAULT 'comissions',
ADD COLUMN     "number" INTEGER,
ADD COLUMN     "rebate_author" DOUBLE PRECISION,
ALTER COLUMN "management_min" DROP NOT NULL;

-- AlterTable
ALTER TABLE "KindleSale" ALTER COLUMN "quantityEbook" DROP NOT NULL,
ALTER COLUMN "quantityPod" DROP NOT NULL;
