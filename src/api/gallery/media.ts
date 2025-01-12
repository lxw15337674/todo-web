'use server';

import { Media, Prisma, PrismaClient, UploadStatus, Producer, Post } from '@prisma/client';

type MediaWithRelations = Media & {
  producer: Producer | null;
  post: Post | null;
}

interface GetPicsResponse {
  items: MediaWithRelations[];
  page: number;
  pageSize: number;
}

const prisma = new PrismaClient();

// 获取总数的独立函数
export const getPicsCount = async (producerId?: string | null, status: UploadStatus = UploadStatus.UPLOADED): Promise<number> => {
  try {
    const whereClause: Prisma.MediaWhereInput = {
      deletedAt: null,
      status,
      ...(producerId ? { producerId } : {})
    };

    return await prisma.media.count({
      where: whereClause,
    });
  } catch (error) {
    console.error('Failed to count media:', error instanceof Error ? error.message : error);
    throw new Error('Failed to count media');
  }
};

export const getPics = async (page: number = 1, pageSize: number = 10, producerId?: string | null): Promise<GetPicsResponse> => {
  try {
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    console.log(page,pageSize,producerId)
    const whereClause: Prisma.MediaWhereInput = {
      deletedAt: null,
      status: UploadStatus.UPLOADED,
      ...(producerId ? { producerId } : {})
    };
    const items = await prisma.media.findMany({
      skip,
      take,
      where: whereClause,
      orderBy: { createTime: 'desc' },
      include: {
        producer: true,
        post: true
      }
    });
    return {
      items,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Failed to fetch media:', error instanceof Error ? error.message : error);
    throw error instanceof Error ? error : new Error('Failed to fetch media');
  }
};
