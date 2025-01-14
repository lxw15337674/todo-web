'use server';
import { Platform, UploadStatus } from "@prisma/client";
import prisma from "../prisma";

interface GetPostCountParams {
  userId?: string;
  producerId?: string;
  platform?: Platform;
  status?: UploadStatus;
  startTime?: Date;
  endTime?: Date;
}

interface PostStats {
  uploaded: number;
  pending: number;
}

export async function getPostStats(producerId?: string): Promise<PostStats> {
  const [uploaded, pending] = await Promise.all([
    prisma.post.count({
      where: {
        deletedAt: null,
        status: UploadStatus.UPLOADED,
        ...(producerId && { producerId }),
      },
    }),
    prisma.post.count({
      where: {
        deletedAt: null,
        status: UploadStatus.PENDING,
        ...(producerId && { producerId }),
      },
    }),
  ]);
  return { uploaded, pending };
}

export async function getPostCount(params: GetPostCountParams = {}) {
  const {
    userId,
    producerId,
    platform,
    status,
    startTime,
    endTime,
  } = params;

  const where = {
    deletedAt: null,
    ...(userId && { userId }),
    ...(producerId && { producerId }),
    ...(platform && { platform }),
    ...(status && { status }),
    ...(startTime && { createTime: { gte: startTime } }),
    ...(endTime && { createTime: { lte: endTime } }),
  };

  return prisma.post.count({ where });
}
