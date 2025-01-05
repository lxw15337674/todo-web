import { Producer } from '@prisma/client';
import { Media } from '../common/upload/type';
import { log } from '../utils/log';
import { saveMedias } from '../common/db/media';
import { produceWeiboPosts } from './weiboProducer';
import { WeiboMblog } from '../types/weibo';

interface PicItem {
    videoSrc?: string;
    large: {
        url: string;
        geo: {
            width: string | number;
            height: string | number;
        };
    };
}

const convertPicsToArray = (pics: any): PicItem[] => {
    if (Array.isArray(pics)) return pics;
    
    // Filter out empty key and convert object to array
    return Object.entries(pics)
        .filter(([key]) => key !== '')  // Remove empty key entry
        .map(([_, value]) => value as PicItem)
        .filter(item => item.large?.url || item.videoSrc); // Ensure item has required properties
};

export const mWeibo = async (producers: Producer[]) => {
    try {
        log('==== 开始微博数据获取 ====');
        for (let producer of producers) {
            if (producer.weiboIds.length === 0) {
                log('未找到生产者的微博ID，跳过', 'warn');
                continue;
            }

            const ids = producer.weiboIds;
            log(`\n👤 处理生产者: ${producer.name}`);
            log(`📋 找到 ${ids.length} 个微博ID待处理`);

            for (const userId of ids) {
                try {
                    log(`\n🔄 开始处理用户 ${userId} 的微博`);
                    let processedCount = 0;

                    const processPage = async (posts: WeiboMblog[]) => {
                        for (const post of posts) {
                            try {
                                const pics = post?.pics || [];
                                if (!pics || (typeof pics === 'object' && Object.keys(pics).length === 0)) {
                                    log('没有图片，跳过', 'warn');
                                    continue;
                                }

                                const picsArray = convertPicsToArray(pics);
                                if (picsArray.length === 0) {
                                    log('没有有效的图片，跳过', 'warn');
                                    continue;
                                }

                                const uploadPics = picsArray.map(pic => pic.videoSrc || pic.large.url);

                                const medias: Media[] = uploadPics.map((url, i) => ({
                                    userId,
                                    postId: post.id,
                                    originMediaUrl: url,
                                    createTime: new Date(post.created_at || Date.now()),
                                    width: Number(picsArray[i].large.geo.width),
                                    height: Number(picsArray[i].large.geo.height),
                                    originSrc: `https://weibo.com/${userId}/${post.bid}`
                                }));
                                await saveMedias(medias);
                                processedCount += medias.length;
                            } catch (error) {
                                log(`处理单条微博失败: ${error}`, 'error');
                            }
                        }
                    };

                    await produceWeiboPosts(userId, processPage);
                    log(`用户 ${userId} 处理完成，共处理 ${processedCount} 张图片`, 'success');
                } catch (error) {
                    log(`用户 ${userId} 处理失败: ${error}`, 'error');
                }
            }
        }
        log('\n==== 微博数据获取完成 ====', 'success');
    } catch (error) {
        log('主函数出错:' + error, 'error');
    }
};