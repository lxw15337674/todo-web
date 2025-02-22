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

        // 返回 URL 而不是图片数据
        return new Response(JSON.stringify({ url: randomMedia.galleryMediaUrl }), {
            headers: {
                'Content-Type': 'application/json',
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