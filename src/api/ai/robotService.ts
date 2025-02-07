import axios from 'axios';

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
  ): Promise<RobotResponse<T>> {
    try {
      const completion = await axios.post('https://bhwa-api.zeabur.app/api/ai/chat', {
        prompt,
        model: 'step-2-16k'
      }, {
        timeout: 50000,
      });
      const content = completion.data.choices[0].message?.content ?? '';
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
