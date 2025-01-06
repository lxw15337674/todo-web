import { PrismaClient, UploadStatus } from "@prisma/client";

export async function GET() {
    const prisma = new PrismaClient();
    // 添加随机数作为查询参数，确保每次请求都是唯一的
    const timestamp = Date.now();
    const random = Math.random();

    try {
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

        const skip = Math.floor(random * count);
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

        const imageUrl = `${randomMedia.galleryMediaUrl}?t=${timestamp}&r=${random}`;
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            throw new Error('Failed to fetch image');
        }

        const imageData = await imageResponse.arrayBuffer();

        return new Response(imageData, {
            headers: {
                'Content-Type': 'image/webp',
                // 禁用所有缓存
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}