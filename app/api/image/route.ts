export const dynamic = 'force-dynamic';
import { UploadStatus, PrismaClient } from '@prisma/client';

export async function GET(request: Request) {
    const prisma = new PrismaClient();

    try {
        // 获取所有已上传状态的媒体记录数量
        const count = await prisma.media.count({
            where: {
                status: UploadStatus.UPLOADED
            }
        });

        if (count === 0) {
            await prisma.$disconnect();
            return new Response('No images found', { status: 404 });
        }

        // 随机获取一张图片
        const skip = Math.floor(Math.random() * count);
        const randomMedia = await prisma.media.findFirst({
            where: {
                status: UploadStatus.UPLOADED
            },
            skip: skip,
            select: {
                galleryMediaUrl: true,
            }
        });

        if (!randomMedia) {
            await prisma.$disconnect();
            return new Response('No image found', { status: 404 });
        }

        await prisma.$disconnect();
        // 返回图片URL
        return Response.json({ image: randomMedia.galleryMediaUrl });

    } catch (error) {
        await prisma.$disconnect();
        console.error('Error fetching random image:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}