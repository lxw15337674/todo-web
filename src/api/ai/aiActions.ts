'use server';
import axios from 'axios';
import { robotService } from './services/robotService';
import { bookmarkPrompt, taskPrompt } from './prompts';

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
    if (imageInfo.isImage && imageInfo.size > 1024) { // 确保图片大小至少1KB
      return url;
    }
  }

  return '';
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
  try {
    const apiUrl = `https://bhwa-api.zeabur.app/api/ai/page-content?url=${encodeURIComponent(url)}`;
    const { data, status } = await axios.get(apiUrl);

    if (status !== 200 || !data) {
      console.error('Failed to fetch page content:', data);
      return { tags: [], summary: '', title: '', image: '' };
    }

    const { content, title } = data;
    const cleanedContent = await cleanHtml(content);
    const html = cleanedContent.text.substring(0, 60000);
    const aiResponse = await robotService.generateResponse<Pick<OpenAICompletion, 'summary' | 'tags'>>(
      bookmarkPrompt(html, existedTags),
    );

    if (!aiResponse.success) {
      return { tags: [], summary: '', title: title || '', image: '' };
    }

    return {
      tags: aiResponse.data.tags,
      summary: aiResponse.data.summary,
      title: title || '',
      image: cleanedContent.image,
    };
  } catch (error) {
    console.error('Error in getSummarizeBookmark:', error);
    return { tags: [], summary: '', title: '', image: '' };
  }
}

export async function getTaskTags(
  content: string,
  existedTags: string[],
): Promise<string[]> {
  const response = await robotService.generateResponse<{ tagNames: string[] }>(
    taskPrompt(content, existedTags),
  );
  return response.success ? response.data.tagNames : [];
}
