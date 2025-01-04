'use server';

import { PrismaClient, WeiboMedia } from '@prisma/client';

interface GetPicsResponse {
  items: WeiboMedia[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const prisma = new PrismaClient();

export const getPics = async (page: number = 1, pageSize: number = 10, userId?: string | null): Promise<GetPicsResponse> => {
  try {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const whereClause = {
      deletedAt: null,
      ...(userId ? { userId: userId } : {})
    };

    // 并行查询总数和分页数据
    const [total, items] = await Promise.all([
      prisma.weiboMedia.count({
        where: whereClause,
      }),
      prisma.weiboMedia.findMany({
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
