/*
  Warnings:

  - You are about to drop the column `user_details` on the `users` table. All the data in the column will be lost.
  - Added the required column `email` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "user_details",
ADD COLUMN     "email" VARCHAR(256) NOT NULL,
ADD COLUMN     "image" VARCHAR(256) NOT NULL,
ADD COLUMN     "name" VARCHAR(256) NOT NULL;
