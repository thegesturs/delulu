/*
  Warnings:

  - The primary key for the `organization_members` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `organization_members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("organization_id", "user_id");
