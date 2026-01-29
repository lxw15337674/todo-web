'use server';

import { UploadStatus } from '@prisma/client';
import axios from 'axios';
import prisma from '../prisma';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
const PERSON_DETECT_URL =
    process.env.PERSON_DETECT_URL ??
    'https://cf-api.bhwa233.com/ai/vision/person-detect';
const PERSON_DETECT_API_KEY = process.env.PERSON_DETECT_API_KEY ?? '';
const PERSON_DETECT_TIMEOUT_MS = Number(
    process.env.PERSON_DETECT_TIMEOUT_MS ?? '20000',
);

// 构建图片类型的 OR 条件
const getImageTypeCondition = () => ({
    OR: IMAGE_EXTENSIONS.map((ext) => ({
        galleryMediaUrl: { endsWith: ext },
    })),
});

// 构建基础的 where 子句 - 返回个人微博和超话的图片
const getRandomImageWhereClause = (
    producerId: string | null,
    tagIds: string[] | null = null,
) => ({
    deletedAt: null,
    status: UploadStatus.UPLOADED,
    width: { gte: 500 },
    producer: {
        ...(producerId ? { id: producerId } : {}),
        ...(tagIds && tagIds.length > 0
            ? {
                ProducerToProducerTag: {
                    some: {
                        B: {
                            in: tagIds,
                        },
                    },
                },
            }
            : {}),
    },
    ...getImageTypeCondition(),
});

const normalizeTimeoutMs = (value: number) => {
    if (Number.isNaN(value) || !Number.isFinite(value) || value <= 0) {
        return 10000;
    }
    return value;
};

const detectPersonFromUrl = async (imageUrl: string, timeoutMs: number) => {
    const startedAt = Date.now();
    try {
        const response = await axios.post(
            PERSON_DETECT_URL,
            { url: imageUrl },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': PERSON_DETECT_API_KEY,
                },
                timeout: timeoutMs,
                validateStatus: () => true,
            },
        );
        return response?.data?.isPerson ?? false;
    } catch (error) {
        if (axios.isAxiosError(error) && error.message) {
            console.warn('Person detect request error:', error.message);
            return false;
        }
        if (error instanceof Error && error.message) {
            console.warn('Person detect request error:', error.message);
        }
        return false;
    } finally {
        console.log(
            `Person detect request finished in ${Date.now() - startedAt}ms`,
        );
    }
};

/**
 * 获取一张随机图片
 * @param producerId 可选的制作者ID
 * @param tagIds 可选的标签ID数组
 * @returns 随机图片的URL，如果没有符合条件的图片返回null
 */
export async function getRandomImage(
    producerId: string | null = null,
    tagIds: string[] | null = null,
): Promise<string | null> {
    try {
        const whereClause = getRandomImageWhereClause(producerId, tagIds);

        // 获取符合条件的最小和最大 ID
        const result = await prisma.media.aggregate({
            where: whereClause,
            _min: { id: true },
            _max: { id: true },
        });

        const minId = result._min.id;
        const maxId = result._max.id;

        if (minId === null || maxId === null) {
            return null;
        }

        // 在范围内随机选择一个 ID
        const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
        console.log(`Random ID selected: ${randomId}`);
        // 查找 >= randomId 的前 3 条符合条件的记录
        const mediaList = await prisma.media.findMany({
            where: {
                ...whereClause,
                id: { gte: randomId },
            },
            orderBy: { id: 'asc' },
            take: 3,
            select: {
                galleryMediaUrl: true,
                originMediaUrl: true,
            },
        });

        if (!mediaList.length) {
            return null;
        }

        const candidates = mediaList
            .map((media) => media.galleryMediaUrl || media.originMediaUrl || null)
            .filter((url): url is string => Boolean(url));

        if (!candidates.length) {
            return null;
        }

        const timeoutMs = normalizeTimeoutMs(PERSON_DETECT_TIMEOUT_MS);

        if (!PERSON_DETECT_API_KEY) {
            console.warn('Person detect API key missing; returning fallback.');
            return candidates[0] ?? null;
        }

        const results = await Promise.all(
            candidates.map((imageUrl) =>
                detectPersonFromUrl(imageUrl, timeoutMs),
            ),
        );

        const matchIndex = results.findIndex(Boolean);
        if (matchIndex >= 0) {
            return candidates[matchIndex] ?? null;
        }

        return candidates[0] ?? null;
    } catch (error) {
        console.error(
            'Failed to get random image:',
            error instanceof Error ? error.message : error,
        );
        throw new Error('Failed to get random image');
    }
}
