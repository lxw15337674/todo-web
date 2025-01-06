import { PrismaClient } from '@prisma/client';
import { Media } from '../../common/upload/type';
import { log } from '../../utils/log';

const prisma = new PrismaClient();

export const save = async (data: Media[]): Promise<{ count: number }> => {
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
        throw error;
    }
}
