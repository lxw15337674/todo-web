'use server';

import { UploadStatus } from '@prisma/client';
import prisma from '../prisma';
import { MediaType } from './type';

// 定义支持的媒体类型扩展名
const VIDEO_EXTENSIONS = ['.mp4', '.mov'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
const LIVEPHOTO_EXTENSIONS = ['.mov'];

// 构建媒体类型的 OR 条件
const getMediaTypeCondition = (type: MediaType | null) => {
  if (!type) return {};

  const extensions =
    type === 'video'
      ? VIDEO_EXTENSIONS
      : type === 'livephoto'
      ? LIVEPHOTO_EXTENSIONS
      : IMAGE_EXTENSIONS;
  return {
    OR: extensions.map((ext) => ({
      galleryMediaUrl: { endsWith: ext },
    })),
  };
};

// 构建基础的 where 子句
const getBaseWhereClause = (
  producerId: string | null,
  type: MediaType | null,
  tagIds: string[] | null = null,
) => ({
  deletedAt: null,
  status: UploadStatus.UPLOADED,
  ...(producerId ? { producerId } : {}),
  ...(tagIds && tagIds.length > 0 ? {
    producer: {
      ProducerToProducerTag: {
        some: {
          B: {
            in: tagIds
          }
        }
      }
    }
  } : {}),
  ...getMediaTypeCondition(type),
});

export async function getPicsCount(
  producerId: string | null,
  type: MediaType | null = null,
  tagIds: string[] | null = null,
) {
  try {
    const count = await prisma.media.count({
      where: getBaseWhereClause(producerId, type, tagIds),
    });
    return count;
  } catch (error) {
    console.error(
      'Failed to count media:',
      error instanceof Error ? error.message : error,
    );
    throw new Error('Failed to count media');
  }
}

export async function getPics(
  page: number,
  pageSize: number,
  producerId: string | null,
  sort: 'asc' | 'desc' | 'random' = 'desc',
  type: MediaType | null = null,
  tagIds: string[] | null = null,
) {
  try {
    // For random sort, we'll use a subquery to get random IDs first
    if (sort === 'random') {
      // Get the media type extensions condition
      const mediaTypeCondition = getMediaTypeCondition(type);
      const typeConditions = mediaTypeCondition.OR ? mediaTypeCondition.OR.map(
        condition => `"galleryMediaUrl" LIKE '%${condition.galleryMediaUrl.endsWith}'`
      ).join(' OR ') : '';

      // Build tag conditions if tags are provided
      const tagCondition = tagIds && tagIds.length > 0
        ? `AND "producerId" IN (
            SELECT "A" 
            FROM "ProducerToProducerTag" 
            WHERE "B" IN (${tagIds.map(id => `'${id}'`).join(',')})
          )`
        : '';

      const randomIds = await prisma.$queryRawUnsafe(`
        SELECT id 
        FROM "Media" 
        WHERE "deletedAt" IS NULL 
          AND status = '${UploadStatus.UPLOADED}'
          ${producerId ? `AND "producerId" = '${producerId}'` : ''} 
          ${typeConditions ? `AND (${typeConditions})` : ''}
          ${tagCondition}
        ORDER BY RANDOM() 
        LIMIT ${pageSize} 
        OFFSET ${(page - 1) * pageSize}
      `);

      const result = await prisma.media.findMany({
        where: {
          id: {
            in: (randomIds as any[]).map(r => r.id)
          }
        },
        include: {
          producer: true,
          post: true,
        },
      });

      return result;
    }

    // Normal sorting
    return await prisma.media.findMany({
      where: getBaseWhereClause(producerId, type, tagIds),
      orderBy: { createTime: sort },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        producer: true,
        post: true,
      },
    });
  } catch (error) {
    console.error(
      'Failed to get media:',
      error instanceof Error ? error.message : error,
    );
    throw new Error('Failed to get media');
  }
}
