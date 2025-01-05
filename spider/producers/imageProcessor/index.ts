import { getUploadMedias, updateMediaGalleryUrl } from '../../utils/db/media';
import { log } from '../../utils/log';
import { transferImage } from './upload';

async function uploadImageToGallery() {
    const medias = await getUploadMedias();
    for (let media of medias) {
        const startTime = Date.now();
        if (!media.originMediaUrl) continue;

        try {
            const galleryUrl = await transferImage(media.originMediaUrl);
            await updateMediaGalleryUrl(media.id, galleryUrl);
            log(`🔗 图片上传完成: ${galleryUrl}`, 'success');
            return true
        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            log(`❌ 失败(${duration}s):`, 'error');
            return false
        }
    }
}
export default uploadImageToGallery