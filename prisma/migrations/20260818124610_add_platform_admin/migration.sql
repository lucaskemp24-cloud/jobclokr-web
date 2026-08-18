/*
  Warnings:

  - The `subscriptionStatus` column on the `Company` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "subscriptionStatus",
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "SubscriptionStatus";
