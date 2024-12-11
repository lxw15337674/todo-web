'use server';
import OpenAI from "openai";

// 初始化 OpenAI 客户端
const openai = new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
});

// 定义 OpenAI 完成接口
interface OpenAICompletion {
    tags: string[];
    summary: string;
    title: string;
}

// 提取 JSON 数据的函数
function extractJsonData(text: string): OpenAICompletion {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    if (match && match[1]) {
        try {
            return JSON.parse(match[1]);
        } catch (error) {
            console.error("JSON 解析错误：", error);
        }
    }
    return { tags: [], summary: "" ,title: ""};
}

// 构建提示信息的函数
const constructPrompt = (c: string) => `
您是一个稍后阅读应用中的机器人，您的职责是自动给出总结标题，内容和内容标签，配图。
请分析在 "CONTENT START HERE" 和 "CONTENT END HERE" 之间的html文本，规则如下：
- 标签目标是根据内容提供关键主题和主要思想的相关标签。
- 总结目标是根据内容提供关键主题和主要思想给出一个四句话以内的总结。
- 标题从html的标题标签中提取。
- 配图从html找一个合适的图片。
- 标签语言必须是中文。
- 如果是著名的网站，您也可以包括该网站的标签。如果标签不够通用，则不要包括。
- 目标是 3-5 个标签。
- 如果没有好的标签，则将数组留空。
CONTENT START HERE
${c}
CONTENT END HERE
您必须以 JSON 格式回复，总结键为"summary"，值是字符串，
标签键为 "tags"，值是一个字符串标签的数组。
标题键为 "title"，值是字符串。
图片键为 "image"，值是图片的URL。
`;

export async function getTags(content: string): Promise<OpenAICompletion> {
    const prompt = constructPrompt(content);
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "deepseek-chat",
        });

        const res = extractJsonData(completion.choices[0].message?.content ?? '')
        return res
    } catch (error) {
        console.error("OpenAI 请求错误：", error);
        return { tags: [], summary: "" ,title:''};
    }
}