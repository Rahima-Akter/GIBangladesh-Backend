/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `Comment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
