'use server';
import { bookmarkPrompt, taskPrompt, polishPrompt } from './prompts';
import axios from 'axios';
import { API_ENDPOINTS } from './config';

export interface RobotResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}


export async function generateResponse<T>(
  prompt: string,
): Promise<RobotResponse<T>> {
  try {
    const { data } = await axios.post(API_ENDPOINTS.AI_CHAT, {
      prompt,
    }, {
      timeout: 100000,
    });

    console.log('AI服务响应:', data);

    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error('AI服务调用失败:', error);
    return {
      success: false,
      data: {} as T,
      error: 'AI服务调用失败,' + error,
    };
  }
}

// 保留原有的接口定义
export interface OpenAICompletion {
  tags: string[];
  summary: string;
  title: string;
}

// 通过内容直接总结书签（不需要获取页面内容）
export async function getSummarizeBookmarkByContent(
  content: string,
  existedTags: string[],
): Promise<OpenAICompletion> {
  const startTime = Date.now();
  console.log(`[书签摘要] 开始处理内容，长度: ${content.length}`);

  try {
    // 直接使用传入的内容，限制长度
    const html = content.substring(0, 60000);

    // 生成AI响应
    const aiStartTime = Date.now();
    const aiResponse = await generateResponse<Pick<OpenAICompletion, 'summary' | 'tags' | 'title'>>(
      bookmarkPrompt(html, existedTags)
    );
    console.log(`[书签摘要] AI处理耗时: ${Date.now() - aiStartTime}毫秒`);

    if (!aiResponse.success) {
      console.warn('[书签摘要] AI响应未成功', aiResponse.error);
      return { tags: [], summary: '', title: '', };
    }

    const result = {
      tags: aiResponse.data.tags,
      summary: aiResponse.data.summary,
      title: aiResponse.data.title || '',
    };

    console.log(`[书签摘要] 总处理耗时: ${Date.now() - startTime}毫秒`);
    return result;
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`[书签摘要] 处理出错，已耗时${errorTime}毫秒:`, error);
    return { tags: [], summary: '', title: '' };
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
    const response = await axios.post(API_ENDPOINTS.AI_CHAT, {
      prompt: polishPrompt(content)
    });
    return response.data;
  } catch (error) {
    console.error('润色文本时出错:', error);
    throw error;
  }
};
