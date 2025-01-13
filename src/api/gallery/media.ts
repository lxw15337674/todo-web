'use server';

import { Media, Prisma, PrismaClient, UploadStatus } from '@prisma/client';

const prisma = new PrismaClient();

// 定义支持的媒体类型扩展名
const VIDEO_EXTENSIONS = ['.mp4', '.mov'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

// 构建媒体类型的 OR 条件
const getMediaTypeCondition = (type: 'image' | 'video' | null) => {
  if (!type) return {};
  
  const extensions = type === 'video' ? VIDEO_EXTENSIONS : IMAGE_EXTENSIONS;
  return {
    OR: extensions.map(ext => ({
      galleryMediaUrl: { endsWith: ext }
    }))
  };
};

// 构建基础的 where 子句
const getBaseWhereClause = (producerId: string | null, type: 'image' | 'video' | null) => ({
  deletedAt: null,
  status: UploadStatus.UPLOADED,
  ...(producerId ? { producerId } : {}),
  ...getMediaTypeCondition(type)
});

export async function getPicsCount(
  producerId: string | null,
  type: 'image' | 'video' | null = null
) {
  try {
    const count = await prisma.media.count({
      where: getBaseWhereClause(producerId, type),
    });
    console.log('count', count);
    return count;
  } catch (error) {
    console.error('Failed to count media:', error instanceof Error ? error.message : error);
    throw new Error('Failed to count media');
  }
}

export async function getPics(
  page: number,
  pageSize: number,
  producerId: string | null,
  sort: 'asc' | 'desc' = 'desc',
  type: 'image' | 'video' | null = null
) {
  try {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const items = await prisma.media.findMany({
      skip,
      take,
      where: getBaseWhereClause(producerId, type),
      orderBy: { createTime: sort },
      include: {
        producer: true,
        post: true
      }
    });
    return items;
  } catch (error) {
    console.error('Failed to fetch media:', error instanceof Error ? error.message : error);
    throw error instanceof Error ? error : new Error('Failed to fetch media');
  }
}
