-- CreateTable
CREATE TABLE "Anniversary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anniversary_pkey" PRIMARY KEY ("id")
);
