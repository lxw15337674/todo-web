'use server';

import { Media, Prisma, PrismaClient, UploadStatus } from '@prisma/client';

const prisma = new PrismaClient();

// 获取总数的独立函数
export async function getPicsCount(
  producerId: string | null,
  type: 'image' | 'video' | null = null
) {
  try {
    const whereClause: Prisma.MediaWhereInput = {
      deletedAt: null,
      status: UploadStatus.UPLOADED,
      ...(producerId ? { producerId } : {}),
      ...(type ? type === 'video'
        ? {
          OR: [
            { galleryMediaUrl: { endsWith: '.mp4' } },
            { galleryMediaUrl: { endsWith: '.mov' } }
          ]
        }
        : { OR: [
            { galleryMediaUrl: { endsWith: '.jpg' } },
            { galleryMediaUrl: { endsWith: '.jpeg' } },
            { galleryMediaUrl: { endsWith: '.png' } },
            { galleryMediaUrl: { endsWith: '.gif' } },
            { galleryMediaUrl: { endsWith: '.webp' } },
          { galleryMediaUrl: { endsWith: '.avif' } }
          ]}
      : {})
    };
    
    const count =  await prisma.media.count({
      where: whereClause,
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
    const whereClause: Prisma.MediaWhereInput = {
      deletedAt: null,
      status: UploadStatus.UPLOADED,
      ...(producerId ? { producerId } : {}),
      ...(type ? type === 'video'
        ? { OR: [
            { galleryMediaUrl: { endsWith: '.mp4' } },
            { galleryMediaUrl: { endsWith: '.mov' } }
          ]}
        : { OR: [
            { galleryMediaUrl: { endsWith: '.jpg' } },
            { galleryMediaUrl: { endsWith: '.jpeg' } },
            { galleryMediaUrl: { endsWith: '.png' } },
            { galleryMediaUrl: { endsWith: '.gif' } },
            { galleryMediaUrl: { endsWith: '.webp' } },
              { galleryMediaUrl: { endsWith: '.avif' } }
          ]}
      : {})
    };
    
    const items = await prisma.media.findMany({
      skip,
      take,
      where: whereClause,
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
