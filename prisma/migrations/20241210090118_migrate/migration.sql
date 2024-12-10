/*
  Warnings:

  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BookmarkTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BookmarkTags" DROP CONSTRAINT "_BookmarkTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_BookmarkTags" DROP CONSTRAINT "_BookmarkTags_B_fkey";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_BookmarkTags";

-- CreateTable
CREATE TABLE "BookmarkTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BookmarkTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BookmarkToBookmarkTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookmarkToBookmarkTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BookmarkToBookmarkTag_B_index" ON "_BookmarkToBookmarkTag"("B");

-- AddForeignKey
ALTER TABLE "_BookmarkToBookmarkTag" ADD CONSTRAINT "_BookmarkToBookmarkTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Bookmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookmarkToBookmarkTag" ADD CONSTRAINT "_BookmarkToBookmarkTag_B_fkey" FOREIGN KEY ("B") REFERENCES "BookmarkTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
