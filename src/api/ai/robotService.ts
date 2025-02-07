import OpenAI from 'openai';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});
const Model = process.env.AI_MODEL || 'step-2-mini';
export interface RobotResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export class RobotService {
  private static instance: RobotService;

  private constructor() { }

  public static getInstance(): RobotService {
    if (!RobotService.instance) {
      RobotService.instance = new RobotService();
    }
    return RobotService.instance;
  }

  async generateResponse<T>(
    prompt: string,
    model: string = Model
  ): Promise<RobotResponse<T>> {
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: model,
      });

      const content = completion.choices[0].message?.content ?? '';
      try {
        const match = content.match(/```json\s*([\s\S]*?)\s*```/) || [
          null,
          content,
        ];
        const parsed = JSON.parse(match[1] );
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
}

export const robotService = RobotService.getInstance();
