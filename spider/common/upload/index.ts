import { getUploadMedias, updateMediaGalleryUrl, getRemainingUploadCount } from '../db/media';
import { log } from '../../utils/log';
import { transferImage } from './upload';
import { sleep } from '..';

async function retryOperation<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 5000
): Promise<T> {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            if (error?.name === 'PrismaClientInitializationError') {
                log(`数据库连接失败，等待重试 (${i + 1}/${retries})...`, 'warn');
                await sleep(delay);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

async function uploadImageToGallery() {
    let hasMore = true;
    let totalProcessed = 0;
    let totalFailed = 0;
    const globalStartTime = Date.now();

    while (hasMore) {
        try {
            const medias = await retryOperation(() => getUploadMedias(1));
            if (!medias.length) {
                hasMore = false;
                const totalDuration = ((Date.now() - globalStartTime) / 1000).toFixed(2);
                log(`🔄 上传完成, 成功: ${totalProcessed}, 失败: ${totalFailed}, 总耗时: ${totalDuration}s`, 'info');
                return;
            }

            const media = medias[0];
            const startTime = Date.now();
            
            const remainingCount = await retryOperation(() => getRemainingUploadCount());

            if (!media.originMediaUrl) {
                log(`⚠️ 跳过无原始 URL 的媒体文件: ${media.id}, 剩余: ${remainingCount}条`, 'warn');
                continue;
            }

            try {
                const result = await transferImage(media.originMediaUrl);
                if (!result) {
                    log(`❌ 上传失败: 未返回图库 URL, 剩余: ${remainingCount}条`, 'error');
                    totalFailed++;
                    continue;
                }

                await retryOperation(() => updateMediaGalleryUrl(media.id, result.url));
                totalProcessed++;
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                const compressionRatio = ((result.compressedSize / result.originalSize) * 100).toFixed(1);
                
                log(`🔗 图片上传完成: ${media.id} | 来源: ${media.originSrc} | 源图: ${media.originMediaUrl} | 目标: ${result.url} | 压缩率: ${compressionRatio}% (${(result.originalSize/1024).toFixed(1)}KB->${(result.compressedSize/1024).toFixed(1)}KB) | 耗时: ${duration}s | 已处理: ${totalProcessed} | 剩余: ${remainingCount}条`, 'success');
            } catch (error: any) {
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                const errorMessage = error?.message || '未知错误';
                log(`❌ 失败(${duration}s): ${media.id} | 源图: ${media.originMediaUrl} | 错误: ${errorMessage} | 剩余: ${remainingCount}条`, 'error');
                totalFailed++;
            }
        } catch (error: any) {
            log(`❌ 发生严重错误: ${error.message}`, 'error');
            if (error?.name === 'PrismaClientInitializationError') {
                log('数据库连接失败，程序退出', 'error');
                return;
            }
            totalFailed++;
            await sleep(30000); // 发生错误后等待较长时间再继续
        }
    }
}

export default uploadImageToGallery;