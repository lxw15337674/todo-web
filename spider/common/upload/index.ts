import { getUploadMedias, updateMediaGalleryUrl } from '../db/media';
import { log } from '../../utils/log';
import { transferImage } from './upload';

async function uploadImageToGallery() {
    let hasMore = true;
    let retryCount = 5;
    while (hasMore && retryCount > 0) {
        retryCount--;
        const medias = await getUploadMedias();
        if (!medias.length) {
            hasMore = false;
            continue;
        }

        for (let media of medias) {
            const startTime = Date.now();
            if (!media.originMediaUrl) continue;

            try {
                const galleryUrl = await transferImage(media.originMediaUrl);
                await updateMediaGalleryUrl(media.id, galleryUrl);
                log(`🔗 图片上传完成: ${galleryUrl}`, 'success');
            } catch (error: any) {
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                const errorMessage = error?.message || '未知错误';
                log(`❌ 失败(${duration}s): ${errorMessage}`, 'error');
                return false;
            }
        }
    }
    return true;
}
export default uploadImageToGallery