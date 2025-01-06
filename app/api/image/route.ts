export const dynamic = 'force-dynamic';
import { UploadStatus, PrismaClient } from '@prisma/client';

export async function GET(request: Request) {
    const prisma = new PrismaClient();

    try {
        // 获取所有已上传状态且为webp格式的媒体记录数量
        const count = await prisma.media.count({
            where: {
                status: UploadStatus.UPLOADED,
                galleryMediaUrl: {
                    endsWith: '.webp'
                }
            }
        });

        if (count === 0) {
            await prisma.$disconnect();
            return new Response('No webp images found', { status: 404 });
        }

        // 随机获取一张webp图片
        const skip = Math.floor(Math.random() * count);
        const randomMedia = await prisma.media.findFirst({
            where: {
                status: UploadStatus.UPLOADED,
                galleryMediaUrl: {
                    endsWith: '.webp'
                }
            },
            skip: skip,
            select: {
                galleryMediaUrl: true,
            }
        });

        if (!randomMedia || !randomMedia.galleryMediaUrl) {
            await prisma.$disconnect();
            return new Response('No image found', { status: 404 });
        }

        await prisma.$disconnect();

        // 获取图片内容
        try {
            const imageResponse = await fetch(randomMedia.galleryMediaUrl);
            if (!imageResponse.ok) {
                throw new Error('Failed to fetch image');
            }
            // 获取图片数据
            const imageData = await imageResponse.arrayBuffer();
            
            // 返回图片内容，设置正确的content-type
            return new Response(imageData, {
                headers: {
                    'Content-Type': 'image/webp',
                    'Cache-Control': 'public, max-age=31536000',
                },
            });
        } catch (fetchError) {
            console.error('Error fetching image content:', fetchError);
            return new Response('Failed to fetch image content', { status: 502 });
        }
    } catch (error) {
        await prisma.$disconnect();
        console.error('Error fetching random image:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}