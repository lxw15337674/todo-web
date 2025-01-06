import { getUploadMedias, updateMediaGalleryUrl, getRemainingUploadCount } from '../db/media';
import { log } from '../../utils/log';
import { transferImage } from './upload';
import { sleep } from '..';
import { UploadStatus } from '@prisma/client';

interface ProcessResult {
    success: boolean;
    processed: boolean;
    error?: string;
}

interface UploadStats {
    totalProcessed: number;
    totalFailed: number;
    startTime: number;
}

async function retryOperation<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 5000
): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            const isLastAttempt = i === retries - 1;
            const isPrismaError = error?.name === 'PrismaClientInitializationError';

            if (isPrismaError && !isLastAttempt) {
                log(`数据库连接失败，等待重试 (${i + 1}/${retries})...`, 'warn');
                await sleep(delay);
                continue;
            }
            throw error;
        }
    }
    throw new Error('Maximum retries reached');
}

async function processMedia(
    media: any, 
    currentRemaining: number,
): Promise<ProcessResult> {
    const startTime = Date.now();

    if (!media.originMediaUrl) {
        log(`⚠️ 跳过无原始 URL 的媒体文件: ${media.id}, 剩余: ${currentRemaining}条`, 'warn');
        return { success: false, processed: false };
    }

    try {
        const result = await transferImage(media.originMediaUrl);
        if (!result) {
            await updateMediaGalleryUrl(media.id, '', UploadStatus.FAILED);
            log(`❌ 上传失败: 未返回图库 URL, 剩余: ${currentRemaining}条`, 'error');
            return { success: false, processed: true, error: '未返回图库 URL' };
        }

        await updateMediaGalleryUrl(media.id, result.url, UploadStatus.UPLOADED);
        logSuccess(media, result, startTime, currentRemaining);
        return { success: true, processed: true };
    } catch (error: any) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const errorMessage = error?.message || '未知错误';
        log(`❌ 失败(${duration}s): ${media.id} | 源图: ${media.originMediaUrl} | 错误: ${errorMessage} | 剩余: ${currentRemaining}条`, 'error');
        return { success: false, processed: true, error: errorMessage };
    }
}

function logSuccess(media: any, result: any, startTime: number, currentRemaining: number): void {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const compressionRatio = ((result.compressedSize / result.originalSize) * 100).toFixed(1);
    const originalSize = (result.originalSize / 1024).toFixed(1);
    const compressedSize = (result.compressedSize / 1024).toFixed(1);
    
    log(
        `🔗 图片上传完成: ${media.id} | ` +
        `来源: ${media.originSrc} | ` +
        `源图: ${media.originMediaUrl} | ` +
        `目标: ${result.url} | ` +
        `压缩率: ${compressionRatio}% (${originalSize}KB->${compressedSize}KB) | ` +
        `耗时: ${duration}s | ` +
        `剩余: ${currentRemaining}条`,
        'success'
    );
}

async function uploadImageToGallery() {
    const stats: UploadStats = {
        totalProcessed: 0,
        totalFailed: 0,
        startTime: Date.now()
    };
    const CONCURRENT_LIMIT = 5;
    
    while (true) {
        try {
            const medias = await retryOperation(() => getUploadMedias(CONCURRENT_LIMIT));
            if (!medias.length) {
                logCompletion(stats);
                return;
            }

            const remainingCount = await retryOperation(() => getRemainingUploadCount());
            await processBatch(medias, remainingCount, stats);

        } catch (error: any) {
            handleBatchError(error, stats);
            if (error?.name === 'PrismaClientInitializationError') {
                return;
            }
            await sleep(30000);
        }
    }
}

async function processBatch(medias: any[], remainingCount: number, stats: UploadStats): Promise<void> {
    const results = await Promise.all(
        medias.map((media, index) => 
            processMedia(media, remainingCount - index)
        )
    );

    const processedResults = results.filter(r => r.processed);
    const successResults = results.filter(r => r.success);
    
    stats.totalProcessed += successResults.length;
    stats.totalFailed += (processedResults.length - successResults.length);
}

function handleBatchError(error: Error, stats: UploadStats): void {
    log(`❌ 发生严重错误: ${error.message}`, 'error');
    if (error?.name === 'PrismaClientInitializationError') {
        log('数据库连接失败，程序退出', 'error');
    }
    stats.totalFailed++;
}

function logCompletion(stats: UploadStats): void {
    const totalDuration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    log(
        `🔄 上传完成, ` +
        `成功: ${stats.totalProcessed}, ` +
        `失败: ${stats.totalFailed}, ` +
        `总耗时: ${totalDuration}s`,
        'info'
    );
}

export default uploadImageToGallery;