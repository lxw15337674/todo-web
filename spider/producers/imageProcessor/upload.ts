import axios from 'axios';
import { sleep } from '../../utils';
import sharp from 'sharp';
import { checkExistingImages } from '../databaseProducer/db';

// 根据URL获取文件扩展名
const getFileExtension = (url: string): string => {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
    return match ? match[1].toLowerCase() : '';
};

// 根据扩展名获取MIME类型
const getMimeType = (extension: string): string => {
    const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mov': 'video/quicktime',
        'mp4': 'video/mp4'
    };
    return mimeTypes[extension] || 'image/jpeg';
};

// 下载图片并返回数据
export const downloadImage = async (url: string): Promise<Uint8Array> => {
    try {
        const response = await axios({
            url,
            responseType: 'arraybuffer',
        });
        return new Uint8Array(response.data);
    } catch (error) {
        console.error(`❌ 图片下载失败: ${url}`);
        console.error(`错误信息:`, error);
        throw error;
    }
};

// 带重试机制的请求
const retryRequest = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let lastError: Error | null = null; // 初始化 lastError 为 null
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn(); // 尝试执行函数
        } catch (error) {
            lastError = error as Error; // 捕获错误
            if (i < maxRetries - 1) {
                await sleep(1000 * Math.pow(2, i)); // 指数退避重试
                continue;
            }
        }
    }
    throw lastError; // 重试次数用尽后抛出错误
};


const Gallery_URL = 'https://gallery233.pages.dev';

// 判断是否为图片类型
const isImageFile = (extension: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return imageExtensions.includes(extension.toLowerCase());
};

// 处理单个图片的上传
export const transferImage = async (url: string): Promise<string> => {

    return retryRequest(async () => {
        // 下载图片
        const imageBuffer = await downloadImage(url);
        const extension = getFileExtension(url);
        let uploadBuffer: Buffer | Uint8Array = imageBuffer;
        let mimeType = getMimeType(extension);
        let fileName = `file.${extension || 'jpg'}`;

        // 只对图片类型进行webp转换
        if (isImageFile(extension)) {
            const image = sharp(imageBuffer);

            uploadBuffer = await image
                .webp({
                    quality: 90,
                })
                .toBuffer();
            mimeType = 'image/webp';
            fileName = 'file.webp';

            // 计算并输出压缩比例
            const originalSize = imageBuffer.length;
            const compressedSize = uploadBuffer.length;
            const ratio = (compressedSize / originalSize * 100).toFixed(2);
            console.log(`压缩为原来的 ${ratio}% (${(originalSize / 1024).toFixed(2)}KB -> ${(compressedSize / 1024).toFixed(2)}KB)`);
        }

        const formData = new FormData();
        const blob = new Blob([uploadBuffer], { type: mimeType });
        formData.append('file', blob, fileName);

        const response = await fetch(`${Gallery_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        const data = await response.json();
        const galleryUrl = `${Gallery_URL}${data[0]?.src}`;

        if (!data[0]?.src) {
            throw new Error('Upload response missing image URL');
        }

        return galleryUrl;
    }, 3).catch(error => {
        console.error(`\n❌ 图床上传失败 (已重试3次): ${url}`, error);
        return '';
    });
};

