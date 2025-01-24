'use server';
import axios from 'axios';
import { chromium } from 'playwright';
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
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const imageUrls = Array.from(html.matchAll(imgRegex))
    .map((match) => {
      const src = match[1];
      return src.startsWith('//') ? `https:${src}` : src;
    })
    .filter((src) => src.startsWith('https://'));

  for (const url of imageUrls) {
    const imageInfo = await isImageAccessible(url);
    if (imageInfo.isImage) {
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
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1'
    });
    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'load' });
      const content = await page.content();
      const pageTitle = await page.title();
      const cleanedContent = await cleanHtml(content);
      const html = `<title>${pageTitle}</title>\n${cleanedContent.text}`.substring(0, 60000);

      const aiResponse = await robotService.generateResponse<OpenAICompletion>(
        bookmarkPrompt(html, existedTags),
      );

      if (!aiResponse.success) {
        return { tags: [], summary: '', title: pageTitle || '', image: '' };
      }

      const result = aiResponse.data;
      if (
        !result.image ||
        !result.image.startsWith('https://') ||
        !(await isImageAccessible(result.image)).isImage
      ) {
        result.image = cleanedContent.image;
      }
      result.title = pageTitle || result.title;
      return result;
    } finally {
      await context.close();
      await browser.close();
    }
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
