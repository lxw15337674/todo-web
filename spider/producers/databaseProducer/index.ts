import { PrismaClient } from '@prisma/client';
import { Media } from '../../types';
import { checkExistingImages } from './db';

class DatabaseProducer {
    private prisma = new PrismaClient();

    async save(data: Media[]) {
        const existingImages = await checkExistingImages(data.map(img => img.originSrc));

        const newImages = data.filter(img => !existingImages.includes(img.originSrc));

        const result = await this.prisma.media.createMany({
            data: newImages
        });

        console.log(`✅ 保存成功 ${result.count} 张图片,跳过已存在的图片${existingImages.length}张`);
        return result;
    }

    async disconnect() {
        await this.prisma.$disconnect();
    }
}

const databaseProducer = new DatabaseProducer();
export default databaseProducer