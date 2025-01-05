import { PrismaClient } from '@prisma/client';
import { Media } from '../types';

class DatabaseProducer {
    private prisma = new PrismaClient();

    async save(data: Media[]) {
        const existingImages = await this.prisma.media.findMany({
            where: {
                originSrc: {
                    in: data.map(img => img.originMediaUrl ?? '')
                }
            }
        });
        const existingUrls = new Set(existingImages.map(img => img.originSrc));
        if (existingImages) {
            console.log(`⏭️ 跳过已存在的图片${existingImages.length}张`);
        }

        const newImages = data.filter(img => !existingUrls.has(img.originMediaUrl ?? ''));
        const result = await this.prisma.media.createMany({
            data: newImages
        });

        console.log(`✅ 保存成功 ${result.count} 张图片`);
        return result;
    }

    async disconnect() {
        await this.prisma.$disconnect();
    }
}

const databaseProducer = new DatabaseProducer();
export default databaseProducer