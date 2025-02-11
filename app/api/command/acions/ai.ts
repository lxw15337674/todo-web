import axios from "axios";
import { polishPrompt } from "@/api/ai/prompts";

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
