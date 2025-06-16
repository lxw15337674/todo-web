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
    console.log('发送AI请求到:', API_ENDPOINTS.AI_CHAT);
    console.log('请求提示长度:', prompt.length);

    const { data } = await axios.post(API_ENDPOINTS.AI_CHAT, {
      prompt,
    }, {
      timeout: 100000,
    });

    console.log('AI服务响应:', data);
    console.log('响应类型:', typeof data);

    // 检查响应是否为错误消息
    if (typeof data === 'string' && (
      data.includes('获取AI回答失败') ||
      data.includes('AI回答失败') ||
      data.includes('失败') ||
      data.includes('error') ||
      data.includes('Error')
    )) {
      console.warn('AI服务返回错误消息:', data);
      return {
        success: false,
        data: {} as T,
        error: data,
      };
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error('AI服务调用失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('请求状态:', error.response?.status);
      console.error('响应数据:', error.response?.data);
    }
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

    // 检查AI响应数据是否有效结构
    if (typeof aiResponse.data !== 'object' || aiResponse.data === null) {
      console.warn('[书签摘要] AI响应数据格式无效:', aiResponse.data);
      return { tags: [], summary: '', title: '', };
    }

    // 安全地访问响应数据，提供默认值
    const result = {
      tags: Array.isArray(aiResponse.data.tags) ? aiResponse.data.tags : [],
      summary: typeof aiResponse.data.summary === 'string' ? aiResponse.data.summary : '',
      title: typeof aiResponse.data.title === 'string' ? aiResponse.data.title : '',
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
