'use server';

import { Prisma, PrismaClient, WeiboMedia } from '@prisma/client';

interface GetPicsResponse {
  items: WeiboMedia[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const prisma = new PrismaClient();

export const getPics = async (page: number = 1, pageSize: number = 10, weiboIds?: string[] | null): Promise<GetPicsResponse> => {
  try {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const whereClause: Prisma.MediaWhereInput = {
      deletedAt: null,
      galleryMediaUrl: null,
      ...(weiboIds ? { userId: { in: weiboIds } } : {})
    };

    // 并行查询总数和分页数据
    const [total, items] = await Promise.all([
      prisma.media.count({
        where: whereClause,
      }),
      prisma.media.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: {
          createTime: 'desc'
        },
      })
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('Failed to fetch weibo media:', error);
    throw new Error('Failed to fetch weibo media');
  }
};
