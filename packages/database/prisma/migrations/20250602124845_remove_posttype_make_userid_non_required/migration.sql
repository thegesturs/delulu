/*
  Warnings:

  - You are about to drop the column `post_type` on the `posts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "organization_members_organization_id_user_id_key";

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "post_type",
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "social_providers" ALTER COLUMN "user_id" DROP NOT NULL;

-- DropEnum
DROP TYPE "PostType";
