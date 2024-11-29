/*
  Warnings:

  - You are about to drop the `trackItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trackMeta` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "trackItem" DROP CONSTRAINT "trackItem_countMetaId_fkey";

-- DropTable
DROP TABLE "trackItem";

-- DropTable
DROP TABLE "trackMeta";

-- CreateTable
CREATE TABLE "TrackMeta" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "remark" TEXT NOT NULL DEFAULT '',
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TrackMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackItem" (
    "id" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "countMetaId" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TrackItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TrackItem" ADD CONSTRAINT "TrackItem_countMetaId_fkey" FOREIGN KEY ("countMetaId") REFERENCES "TrackMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
