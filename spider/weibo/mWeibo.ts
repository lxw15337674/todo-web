import { Producer } from '@prisma/client';
import { WeiboProducer } from '../producers/weiboProducer';
import imageProcessor from '../producers/imageProcessor';
import { Media } from '../types';
import databaseProducer from '../producers/databaseProducer';

export const mWeibo = async (producers: Producer[]) => {
    try {
        console.log('==== 开始微博数据获取 ====');
        const weiboProducer = new WeiboProducer();

        for (let producer of producers) {
            if (producer.weiboIds.length === 0) {
                console.log('⚠️ 未找到生产者的微博ID，跳过');
                continue;
            }

            const ids = producer.weiboIds;
            console.log(`\n👤 处理生产者: ${producer.name}`);
            console.log(`📋 找到 ${ids.length} 个微博ID待处理`);

            for (const userId of ids) {
                console.log(`\n🔄 开始处理用户 ${userId} 的微博`);

                const posts = await weiboProducer.produceWeiboPosts(userId);
                console.log(`✅ 获取用户微博完成，共 ${posts.length} 条`);

                let processedCount = 0;
                for (const post of posts) {
                    const pics = post.pics;
                    if (!pics || pics.length === 0) {
                        console.log('⏭️ 没有图片，跳过');
                        continue;
                    }

                    const uploadPics = pics.map(pic => pic.videoSrc || pic.large.url);
                    console.log(`📸 开始处理 ${uploadPics.length} 张图片`);

                    imageProcessor.process(uploadPics).then((uploadedImages) => {
                        processedCount += uploadedImages.length;
                        console.log(`✨ 图片转存完成: ${uploadedImages.length} 张`);

                        const medias: Media[] = uploadedImages.map((img, i) => ({
                            userId,
                            originMediaUrl: img.originImgUrl,
                            galleryMediaUrl: img.galleryUrl,
                            createTime: new Date(post.created_at|| Date.now()),
                            width: Number(pics[i].large.geo.width),
                            height: Number(pics[i].large.geo.height),
                            originSrc: `https://weibo.com/${userId}/${post.bid}`
                        }));
                        databaseProducer.save(medias);
                        console.log(`📥 保存到数据库完成: ${medias.length} 条,🔗 原始链接: ${medias[0].originSrc}`);
                    });
                }
            }
        }
        console.log('\n==== 微博数据获取完成 ====');
    } catch (error) {
        console.error('❌ 主函数出错:', error);
    }
};