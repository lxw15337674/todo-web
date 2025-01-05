import { UploadedImageInfo } from '../../types';
import { TaskQueue } from '../../utils/task';
import { checkExistingImages } from '../databaseProducer/db';
import { transferImage } from './upload';


class ImageProcessor {
    private taskQueue: TaskQueue;
    constructor(concurrency = 1) {
        this.taskQueue = new TaskQueue(concurrency);
    }

    async process(urls: string[]): Promise<UploadedImageInfo[]> {
        const validUrls = await checkExistingImages(urls)
        if (!validUrls.length) {
            return [];
        }
        const results = await Promise.all(
            validUrls.
                map(async (url, index) => {
                    return this.taskQueue.add(async () => {
                        const startTime = Date.now();
                        try {
                            const galleryUrl = await transferImage(url);
                            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
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

export default new ImageProcessor(2);