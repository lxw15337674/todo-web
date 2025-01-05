import { PrismaClient, WeiboMedia } from '@prisma/client';
import { WeiboMediaContent } from './types';

const prisma = new PrismaClient();

// 判断imgId是否存在
export const isWeiboMediaExist = async (weiboImgUrl: string) => {
    const result = await prisma.weiboMedia.findFirst({
        where: { originImgUrl: weiboImgUrl }
    });
    return result !== null;
};

// 保存微博图片信息到数据库
export const saveWeiboMedia = async (mediaContents: WeiboMediaContent[]): Promise<WeiboMedia[]> => {
    try {
        // 批量检查是否存在
        const existingUrls = await prisma.weiboMedia.findMany({
            where: {
                originImgUrl: {
                    in: mediaContents.map(content => content.weiboImgUrl)
                }
            },
            select: { originImgUrl: true }
        });

        const existingUrlSet = new Set(existingUrls.map(url => url.originImgUrl));
        const newContents = mediaContents.filter(content => !existingUrlSet.has(content.weiboImgUrl));

        if (newContents.length === 0) {
            console.log(`⏭️ 所有图片都已存在，跳过保存`);
            return [];
        }

        const results = await prisma.$transaction(
            newContents.map(content => 
                prisma.weiboMedia.create({
                    data: {
                        userId: content.userId.toString(),
                        originImgUrl: content.weiboImgUrl,
                        width: content.width,
                        height: content.height,
                        originVideoSrc: content.videoSrc,
                        galleryVideoSrc: content.galleryVideoSrc,
                        weiboUrl: content.weiboUrl,
                        galleryImgUrl: content.galleryUrl,
                        createTime: new Date(content.createdAt)
                    }
                })
            )
        );

        console.log(`✅ 批量保存成功，共保存 ${results.length} 条记录`);
        results.forEach(result => {
            console.log(`  🔗 微博: ${result.weiboUrl} | 🖼️ 图片: ${result.galleryImgUrl}${result.galleryVideoSrc ? ` | 🎥 视频: ${result.galleryVideoSrc}` : ''}`);
        });

        return results;
    } catch (error) {
        console.error('❌ 批量保存失败:', error);
        throw error;
    }
};