/*
  Warnings:

  - You are about to drop the column `name` on the `Bookmark` table. All the data in the column will be lost.
  - Added the required column `title` to the `Bookmark` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "name",
ADD COLUMN     "title" TEXT NOT NULL;
