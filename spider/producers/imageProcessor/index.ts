import { UploadedImageInfo } from '../../types';
import { TaskQueue } from '../../utils/task';
import { transferImage } from './upload';


class ImageProcessor {
    private taskQueue: TaskQueue;
    constructor(concurrency = 1) {
        this.taskQueue = new TaskQueue(concurrency);
    }

    async process(urls: string[]): Promise<UploadedImageInfo[]> {
        if (!urls?.length) {
            console.log('⚠️ 没有需要处理的图片');
            return [];
        }

        const validUrls = urls.filter(url => url);
        if (!validUrls.length) {
            console.log('⚠️ 没有有效的图片URL');
            return [];
        }

        console.log(`\n🖼️ 开始处理 ${validUrls.length} 张图片`);

        const results = await Promise.all(
            validUrls.map(async (url, index) => {
                return this.taskQueue.add(async () => {
                    const startTime = Date.now();
                    try {
                        const galleryUrl = await transferImage(url);
                        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                        console.log(`✅ [${index + 1}/${validUrls.length}] 成功(${duration}s)`);
                        return galleryUrl ? { originImgUrl: url, galleryUrl } : null;
                    } catch (error) {
                        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                        console.error(`❌ [${index + 1}/${validUrls.length}] 失败(${duration}s):`, error);
                        return null;
                    }
                });
            })
        );

        return results.filter((result): result is UploadedImageInfo => result !== null);
    }
}

export default new ImageProcessor(1);