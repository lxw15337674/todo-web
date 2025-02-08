import axios from "axios";

const styles = [
    "更专业",
    "更易读",
    "更含蓄",
    "更有信息量",
    "更有文采",
    "更正式",
    "更简洁",
    "更委婉",
    "更幽默"
];

// 文本润色
export const polishPrompt = (text: string) => `
您是一位专业的文字润色助手，擅长改进文本的表达和结构，使其更加优美流畅。

输入内容：
${text}

润色规则：
1. 保持原意和关键信息不变
2. 改善语言表达，使其流畅自然
3. 纠正语法错误与不当用词
4. 输出长度不超过原文的1.5倍

请分别给出以下风格的润色版本：
${styles.map((s) => `【${s}】`).join('')}

不要解释，直接严格按照以下格式返回：
[原文]
原文内容
[style1]
润色后的文本1
[style2]
润色后的文本2
`;

export const polishContent = async (content: string): Promise<string[]> => {
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
