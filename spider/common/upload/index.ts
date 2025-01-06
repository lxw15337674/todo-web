import { getUploadMedias, updateMediaGalleryUrl } from '../db/media';
import { log } from '../../utils/log';
import { transferImage } from './upload';
import { sleep } from '..';

async function uploadImageToGallery() {
    let hasMore = true;
    let totalProcessed = 0;
    let totalFailed = 0;

    while (hasMore) {
        const medias = await getUploadMedias();
        const count = medias.length;
        if (!medias.length) {
            hasMore = false;
            continue;
        }

        for (let media of medias) {
            const startTime = Date.now();
            if (!media.originMediaUrl) {
                log(`⚠️ 跳过无原始 URL 的媒体文件: ${media.id}`, 'warn');
                continue;
            }

            try {
                const galleryUrl = await transferImage(media.originMediaUrl);
                if (!galleryUrl) {
                    log(`❌ 上传失败: 未返回图库 URL`, 'error');
                    totalFailed++;
                    continue;
                }

                await updateMediaGalleryUrl(media.id, galleryUrl);
                log(`🔗 图片上传完成: ${media.id} -> ${galleryUrl}, 已处理: ${totalProcessed}/${count}`, 'success');
                totalProcessed++;
            } catch (error: any) {
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                const errorMessage = error?.message || '未知错误';
                log(`❌ 失败(${duration}s): ${media.id} -> ${errorMessage}`, 'error');
                totalFailed++;
            }
        }

        await sleep(10000); // 可根据需要调整延迟时间
    }
    log(`🔄 上传完成, 成功: ${totalProcessed}, 失败: ${totalFailed}`, 'info');
}

export default uploadImageToGallery;