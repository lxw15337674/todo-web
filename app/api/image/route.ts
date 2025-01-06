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
        // 使用 URL 对象处理地址替换
        if (!randomMedia.galleryMediaUrl) {
            return new Response('Invalid image URL', { status: 404 });
        }
        const originalUrl = new URL(randomMedia.galleryMediaUrl);
        originalUrl.host = 'proxy.404174262.workers.dev';
        
        // 返回代理后的图片URL
        return Response.json({ image: originalUrl,
            originalUrl: randomMedia.galleryMediaUrl
         });

    } catch (error) {
        await prisma.$disconnect();
        console.error('Error fetching random image:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}