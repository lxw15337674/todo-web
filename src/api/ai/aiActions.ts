'use server';
import { uploadToGallery } from '@/utils/upload';
import { bookmarkPrompt, taskPrompt, polishPrompt } from './prompts';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';

export interface RobotResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}


export async function generateResponse<T>(
  prompt: string,
): Promise<RobotResponse<T>> {
  try {
    const { data } = await axios.post(API_ENDPOINTS.GOOGLE_CHAT, {
      prompt,
    }, {
      timeout: 50000,
    });

    try {
      const match = data.match(/```json\s*([\s\S]*?)\s*```/) || [
        null,
        data,
      ];
      const parsed = JSON.parse(match[1]);
      console.log('AI服务响应:', parsed);
      return {
        success: true,
        data: parsed,
      };
    } catch (parseError) {
      return {
        success: false,
        data: {} as T,
        error: '解析响应失败',
      };
    }
  } catch (error) {
    return {
      success: false,
      data: {} as T,
      error: 'AI服务调用失败',
    };
  }
}

// 保留原有的接口定义
export interface OpenAICompletion {
  tags: string[];
  summary: string;
  title: string;
  image: string;
}

interface CleanedContent {
  text: string;
  image: string;
}

interface ImageInfo {
  isImage: boolean;
  size: number;
}

// Image handling utilities
const isImageAccessible = async (url: string): Promise<ImageInfo> => {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: (status: number) => status === 200,
      headers: {
        host: new URL(url).hostname,
      }
    });
    return {
      isImage: response.headers['content-type']?.startsWith('image/') || false,
      size: parseInt(response.headers['content-length'] || '0', 10),
    };
  } catch {
    return { isImage: false, size: 0 };
  }
};

const extractImage = async (html: string): Promise<string> => {
  // 匹配所有可能的图片标签格式
  const imgPatterns = [
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,  // 标准img标签
  ];

  const imageUrls = new Set<string>();

  // 从所有模式中提取URL
  for (const pattern of imgPatterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      let src = match[1];
      // 处理相对URL
      if (src.startsWith('//')) {
        src = `https:${src}`;
      } else if (!src.startsWith('http')) {
        continue;
      }
      imageUrls.add(src);
    }
  }
  // 检查每个URL是否为可访问的图片
  for (const url of imageUrls) {
    const imageInfo = await isImageAccessible(url);
    if (imageInfo.isImage && imageInfo.size > 1024 * 200) { // 确保图片大小至少200KB
      const extraUrl = await uploadToGallery(url);
      if (extraUrl) {
        return extraUrl;
      }
    }
  }

  return await uploadToGallery(Array.from(imageUrls)[0]) ?? '';
};

const cleanHtml = async (html: string): Promise<CleanedContent> => {
  const image = await extractImage(html);

  const cleaned = html
    // Remove style tags and their contents
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove inline style attributes
    .replace(/\s*style=["'][^"']*["']/gi, '')
    // Remove class attributes
    .replace(/\s*class=["'][^"']*["']/gi, '')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  return { text: cleaned, image };
};

export default async function getSummarizeBookmark(
  url: string,
  existedTags: string[],
): Promise<OpenAICompletion> {
  const startTime = Date.now();
  console.log(`[书签摘要] 开始处理URL: ${url}`);

  try {
    // 获取页面内容
    const fetchStartTime = Date.now();
    const apiUrl = `${API_ENDPOINTS.PAGE_CONTENT}?url=${encodeURIComponent(url)}`;
    const { data, status } = await axios.get(apiUrl);
    console.log(`[书签摘要] 获取页面内容耗时: ${Date.now() - fetchStartTime}毫秒`);

    if (status !== 200 || !data.content) {
      console.error('[书签摘要] 获取页面内容失败:', data);
      return { tags: [], summary: '', title: '', image: '' };
    }

    // 清理HTML内容
    const cleanStartTime = Date.now();
    const { content, title } = data;
    const cleanedContent = await cleanHtml(content);
    const html = cleanedContent.text.substring(0, 60000);
    console.log(`[书签摘要] 清理HTML内容耗时: ${Date.now() - cleanStartTime}毫秒`);

    // 生成AI响应
    const aiStartTime = Date.now();
    const aiResponse = await generateResponse<Pick<OpenAICompletion, 'summary' | 'tags'>>(
      bookmarkPrompt(html, existedTags)
    );
    console.log(`[书签摘要] AI处理耗时: ${Date.now() - aiStartTime}毫秒`);

    if (!aiResponse.success) {
      console.warn('[书签摘要] AI响应未成功');
      return { tags: [], summary: '', title: title || '', image: '' };
    }

    const result = {
      tags: aiResponse.data.tags,
      summary: aiResponse.data.summary,
      title: title || '',
      image: cleanedContent.image,
    };

    console.log(`[书签摘要] 总处理耗时: ${Date.now() - startTime}毫秒`);
    return result;
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`[书签摘要] 处理出错，已耗时${errorTime}毫秒:`, error);
    return { tags: [], summary: '', title: '', image: '' };
  }
}

export async function getTaskTags(
  content: string,
  existedTags: string[],
): Promise<string[]> {
  const response = await generateResponse<{ tagNames: string[] }>(
    taskPrompt(content, existedTags),
  );
  return response.success ? response.data.tagNames : [];
}



export const polishContent = async (content: string): Promise<string> => {
  try {
    const response = await axios.post('https://bhwa-us.zeabur.app/api/ai/google-chat', {
      prompt: polishPrompt(content)
    });
    return response.data;
  } catch (error) {
    console.error('润色文本时出错:', error);
    throw error;
  }
};
