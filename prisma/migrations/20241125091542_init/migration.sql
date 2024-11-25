-- CreateTable
CREATE TABLE "trackMeta" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "remark" TEXT NOT NULL DEFAULT '',
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trackMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trackItem" (
    "id" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "countMetaId" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trackItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trackItem" ADD CONSTRAINT "trackItem_countMetaId_fkey" FOREIGN KEY ("countMetaId") REFERENCES "trackMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
