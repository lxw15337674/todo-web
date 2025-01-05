import { PrismaClient } from '@prisma/client';
import { Media } from '../upload/type';
import { log } from '../../utils/log';
const prisma = new PrismaClient();
export const checkExistingImages = async (data: string[]) => {
    const existingImages = await prisma.media.findMany({
        where: {
            originSrc: {
                in:data
            }
        }
    });

    const existingUrls = new Set(existingImages.map(img => img.originSrc));
    return data.filter(url => !existingUrls.has(url))
}

export const updateMediaGalleryUrl = async (id:number,galleryMediaUrl:string) => {
    try {
        await prisma.media.update({
            where: {
                id
            },
            data: {
                galleryMediaUrl
            }
        });
        return true
    }
    catch (error) {
        log(`保存失败: ${error}`, 'error');
        return false
    }
}

export const saveMedias = async (data: Media[]): Promise<{ count: number }> => {
    try {
        if (!data?.length) {
            log('没有需要保存的数据', 'warn');
            return Promise.resolve({ count: 0 });
        }

        const existingUrls = await prisma.media.findMany({
            where: {
                originSrc: {
                    in: data.map((img: Media) => img.originSrc)
                }
            },
            select: { originSrc: true }
        });

        const existingSet = new Set(existingUrls.map((img) => img.originSrc));
        const newImages = data.filter((img: Media) => !existingSet.has(img.originSrc));

        if (existingUrls.length) {
            log(`跳过已存在的图片 ${existingUrls.length} 张`, 'info');
        }

        if (!newImages.length) {
            log('所有图片都已存在', 'info');
            return Promise.resolve({ count: 0 });
        }

        const result = await prisma.media.createMany({
            data: newImages.map((img: Media) => ({
                ...img,
                createTime: img.createTime || new Date(),
            }))
        });

        log(`保存成功 ${result.count} 张图片`, 'success');
        return Promise.resolve({ count: result.count });
    } catch (error) {
        log(`保存失败: ${error}`, 'error');
        return { count: 0 };
    }
}

export const getUploadMedias = async () => {
    return await prisma.media.findMany({
        where: {
            galleryMediaUrl: {
                not: null
            }
        }
    });
}