/*
  Warnings:

  - Made the column `code` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "code" SET NOT NULL;
