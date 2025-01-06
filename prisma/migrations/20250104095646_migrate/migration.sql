-- CreateTable
CREATE TABLE "Producer" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "weiboId" TEXT,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Producer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeiboMedia" (
    "weiboImgUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "videoSrc" TEXT,
    "weiboUrl" TEXT NOT NULL,
    "galleryUrl" TEXT NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,

    CONSTRAINT "WeiboMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeiboMedia_createTime_idx" ON "WeiboMedia"("createTime");

-- CreateIndex
CREATE INDEX "WeiboMedia_userId_idx" ON "WeiboMedia"("userId");
