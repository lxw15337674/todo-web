import { PrismaClient } from '@prisma/client';
import { Media } from '../../types';

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