'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPics = async (page: number = 1, pageSize: number = 10, producerId?: string | null) => {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const whereClause = {
    deletedAt: null,
    ...(producerId ? { producerId } : {}),
  };

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
      }
    })
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};
