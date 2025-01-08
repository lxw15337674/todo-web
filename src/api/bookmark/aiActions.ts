'use server';
import OpenAI from "openai";
import axios from 'axios';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
});

// 定义 OpenAI 完成接口
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
            validateStatus: (status) => status === 200
        });
        return {
            isImage: response.headers['content-type']?.startsWith('image/') || false,
            size: parseInt(response.headers['content-length'] || '0', 10)
        };
    } catch {
        return { isImage: false, size: 0 };
    }
};

const extractImage = async (html: string): Promise<string> => {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const imageUrls = Array.from(html.matchAll(imgRegex))
        .map(match => {
            const src = match[1];
            return src.startsWith('//') ? `https:${src}` : src;
        })
        .filter(src => src.startsWith('https://'));

    for (const url of imageUrls) {
        const imageInfo = await isImageAccessible(url);
        if (imageInfo.isImage) {
            return url;
        }
    }

    return '';
};

// HTML cleaning utilities
const cleanHtml = async (html: string): Promise<CleanedContent> => {
    const image = await extractImage(html);
    
    const cleaned = html
        .replace(/<(script|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
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

// AI response handling
const extractJsonData = (text: string): OpenAICompletion => {
    try {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        return match ? { ...JSON.parse(match[1]), image: '' } : 
            { tags: [], summary: "", title: "", image: "" };
    } catch (error) {
        console.error("JSON parsing error:", error);
        return { tags: [], summary: "", title: "", image: "" };
    }
};

const constructPrompt = (content: string) => `
您是一个稍后阅读应用中的机器人，您的职责是自动给出总结标题，内容和内容标签，配图。
请分析在 "CONTENT START HERE" 和 "CONTENT END HERE" 之间的html文本，规则如下：
- 标签：根据文字内容提供尽可能通用的关键主题和主要思想的相关标签。
- 总结：从HTML标签中的文字内容提取关键主题和主要思想，并将其精炼为四句话以内的简洁总结。
- 标题从从html中找到一个合适的标题，如果没有则根据内容生成一个。
- 配图从html找一个合适的图片。
- 标签语言必须是中文。
- 目标是 1-4 个标签。
- 如果没有好的标签，则将数组留空。
CONTENT START HERE
${content}
CONTENT END HERE
您必须以 JSON 格式回复，总结键为"summary"，值是字符串，
标签键为 "tags"，值是一个字符串标签的数组。
标题键为 "title"，值是字符串。
`;

// Main function
export default async function getSummarizeBookmark(url: string): Promise<OpenAICompletion> {
    try {
        // Fetch and clean HTML content
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1'
            },
            timeout: 10000,
            maxRedirects: 5
        });

        const cleanedContent = await cleanHtml(response.data);
        const html = cleanedContent.text.substring(0, 60000);

        // Get AI completion
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: constructPrompt(html) }],
            model: "deepseek-chat",
        });

        // Process results
        const result = extractJsonData(completion.choices[0].message?.content ?? '');
        if (!result.image || !result.image.startsWith('https://') || !(await isImageAccessible(result.image)).isImage) {
            result.image = cleanedContent.image;
        }
        return result;

    } catch (error) {
        console.error("Error in getSummarizeBookmark:", error);
        return { tags: [], summary: "", title: '', image: '' };
    }
}