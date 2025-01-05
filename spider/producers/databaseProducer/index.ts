import { PrismaClient } from '@prisma/client';
import { Media } from '../../types';
import { log } from '../../utils/log';

class DatabaseProducer {
    private prisma = new PrismaClient();

    async save(data: Media[]) {
        try {
            if (!data?.length) {
                log('没有需要保存的数据', 'warn');
                return { count: 0 };
            }

            const existingUrls = await this.prisma.media.findMany({
                where: {
                    originSrc: {
                        in: data.map(img => img.originSrc)
                    }
                },
                select: { originSrc: true }
            });

            const existingSet = new Set(existingUrls.map(img => img.originSrc));
            const newImages = data.filter(img => !existingSet.has(img.originSrc));

            if (existingUrls.length) {
                log(`跳过已存在的图片 ${existingUrls.length} 张`, 'info');
            }

            if (!newImages.length) {
                log('所有图片都已存在', 'info');
                return { count: 0 };
            }

            const result = await this.prisma.media.createMany({
                data: newImages.map(img => ({
                    ...img,
                    createTime: img.createTime || new Date(),
                }))
            });

            log(`保存成功 ${result.count} 张图片`, 'success');
            return result;
        } catch (error) {
            log(`保存失败: ${error}`, 'error');
            throw error;
        }
    }

    async disconnect() {
        await this.prisma.$disconnect();
    }
}

const databaseProducer = new DatabaseProducer();
export default databaseProducer;