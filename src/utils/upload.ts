import axios from 'axios';

const GALLERY_URL = 'https://gallery233.pages.dev';

const log = (message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    console.log(`[媒体上传] ${message}`);
};

async function downloadMedia(url: string, headers: Record<string, string>): Promise<Buffer | null> {
    try {
        const response = await axios({
            method: 'GET',
            url,
            responseType: 'arraybuffer',
            headers: {
                'Host': new URL(url).hostname,
                ...headers,
            },
            timeout: 60000,
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024,
        });
        return Buffer.from(response.data);
    } catch (error) {
        return null;
    }
}

async function uploadToGalleryServer(
    buffer: Buffer,
    fileName: string,
): Promise<string | null> {
    try {
        const formData = new FormData();
        formData.append('file', new Blob([buffer]), fileName);

        const response = await axios.post(`${GALLERY_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (!response.data[0]?.src) {
            throw new Error('上传响应缺少文件URL');
        }

        return response.data[0].src;
    } catch (error) {
        log(`文件上传失败: ${error}`, 'error');
        return null;
    }
}

export async function uploadToGallery(
    originMediaUrl: string,
    headers: Record<string, string> = {}
): Promise<string | null> {
    try {
        if (!originMediaUrl) {
            log('无效的媒体URL', 'error');
            return null;
        }
        const mediaBuffer = await downloadMedia(originMediaUrl, headers);
        if (!mediaBuffer) {
            log(`下载媒体文件失败: ${originMediaUrl}`, 'error');
            return null;
        }

        const fileName = `${Date.now()}`;
        const galleryUrl = await uploadToGalleryServer(mediaBuffer, fileName);

        if (!galleryUrl) {
            log(`上传失败: ${originMediaUrl}`, 'error');
            return null;
        }

        log(
            `上传成功 [${originMediaUrl}]\n` +
            `  上传URL: ${galleryUrl}`,
            'success'
        );

        return galleryUrl;
    } catch (error) {
        log(`处理失败: ${originMediaUrl}, ${error}`, 'error');
        return null;
    }
}