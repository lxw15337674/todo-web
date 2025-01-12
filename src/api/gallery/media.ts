'use server';

import { Media, Prisma, PrismaClient, UploadStatus } from '@prisma/client';

interface GetPicsResponse {
  items: Media[];
  page: number;
  pageSize: number;
}

const prisma = new PrismaClient();

// 获取总数的独立函数
export const getPicsCount = async (weiboIds?: string[] | null, status: UploadStatus = UploadStatus.UPLOADED): Promise<number> => {
  try {
    const whereClause: Prisma.MediaWhereInput = {
      deletedAt: null,
      status,
      ...(weiboIds ? { userId: { in: weiboIds } } : {})
    };

    return await prisma.media.count({
      where: whereClause,
    });
  } catch (error) {
    console.error('Failed to count weibo media:', error);
    throw new Error('Failed to count weibo media');
  }
};

type SortOrder = 'asc' | 'desc';

export const getPics = async (
  page: number = 1, 
  pageSize: number = 10, 
  weiboIds?: string[] | null,
  sortOrder: SortOrder = 'desc'
): Promise<GetPicsResponse> => {
  try {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const whereClause: Prisma.MediaWhereInput = {
      deletedAt: null,
      status: UploadStatus.UPLOADED,
      ...(weiboIds ? { userId: { in: weiboIds } } : {})
    };
    const items = await prisma.media.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createTime: sortOrder }
    });
    return {
      items,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Failed to fetch weibo media:', error);
    throw new Error('Failed to fetch weibo media');
  }
};
