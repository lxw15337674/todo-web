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

// Seeded random generator (Mulberry32)
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// Simple string hash
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Shuffle function
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

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
  seed?: number, // Optional seed for deterministic random sort
  explicitSkip?: number, // Optional explicit skip count
) {
  try {
    // For random sort, we'll use a different approach to avoid ORDER BY RANDOM() performance issues
    if (sort === 'random') {
      const whereClause = getBaseWhereClause(producerId, type, tagIds);

      // Use provided seed or generate a random one if missing
      // (Though client should usually provide one for consistent pagination)
      const validSeed = seed ?? Math.floor(Math.random() * 1000000);

      // 1. Fetch ALL IDs (lightweight)
      const allMedia = await prisma.media.findMany({
        where: whereClause,
        select: { id: true },
        orderBy: { id: 'asc' }, // Ensure initial order is consistent before shuffle
      });

      const allIds = allMedia.map((m) => m.id);

      // 2. Shuffle IDs deterministically
      const shuffledIds = shuffleWithSeed(allIds, validSeed);

      // 3. Slice for current page
      // Use explicitSkip if available, otherwise calculate from page number
      const startIndex = explicitSkip ?? ((page - 1) * pageSize);
      const pageIds = shuffledIds.slice(startIndex, startIndex + pageSize);

      if (pageIds.length === 0) {
        return [];
      }

      // 4. Fetch details for the sliced IDs
      const media = await prisma.media.findMany({
        where: {
          id: { in: pageIds },
        },
        include: {
          producer: true,
          post: true,
        },
      });

      // 5. Reorder results to match the shuffled order
      return media.sort((a, b) => pageIds.indexOf(a.id) - pageIds.indexOf(b.id));
    }

    // Normal sorting
    return await prisma.media.findMany({
      where: getBaseWhereClause(producerId, type, tagIds),
      orderBy: { createTime: sort },
      take: pageSize,
      skip: explicitSkip ?? ((page - 1) * pageSize),
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
