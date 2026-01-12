'use server';

import { UploadStatus, ProducerType } from '@prisma/client';
import prisma from '../prisma';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

// 构建图片类型的 OR 条件
const getImageTypeCondition = () => ({
    OR: IMAGE_EXTENSIONS.map((ext) => ({
        galleryMediaUrl: { endsWith: ext },
    })),
});

// 构建基础的 where 子句 - 只返回个人微博的图片
const getRandomImageWhereClause = (
    producerId: string | null,
    tagIds: string[] | null = null,
) => ({
    deletedAt: null,
    status: UploadStatus.UPLOADED,
    // 只返回个人微博的图片，排除超话
    producer: {
        type: ProducerType.WEIBO_PERSONAL,
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

        // 获取符合条件的图片总数
        const totalCount = await prisma.media.count({
            where: whereClause,
        });

        if (totalCount === 0) {
            return null;
        }

        // 生成随机偏移量
        const randomOffset = Math.floor(Math.random() * totalCount);

        // 获取随机图片
        const media = await prisma.media.findFirst({
            where: whereClause,
            skip: randomOffset,
            select: {
                galleryMediaUrl: true,
                originMediaUrl: true,
            },
        });

        if (!media) {
            return null;
        }

        // 优先返回 galleryMediaUrl，如果不存在则返回 originMediaUrl
        return media.galleryMediaUrl || media.originMediaUrl || null;
    } catch (error) {
        console.error(
            'Failed to get random image:',
            error instanceof Error ? error.message : error,
        );
        throw new Error('Failed to get random image');
    }
}
