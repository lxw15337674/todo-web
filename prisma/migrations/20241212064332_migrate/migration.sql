/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `BookmarkTag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BookmarkTag_name_key" ON "BookmarkTag"("name");
