import { NextRequest, NextResponse } from 'next/server';
import { commandMap, parseCommand } from './command';

export async function POST(request: NextRequest) {
  try {
    const { command, roomId } = await request.json();

    if (!command) {
      return NextResponse.json({ 
        success: false,
        error: '请输入命令',
        type: 'text'
      }, { status: 400 });
    }

    let response = '';
    let type: 'text' | 'image' = 'text';

    const sendMessage = (content: string, messageType: 'text' | 'image' = 'text') => {
      response = content;
      type = messageType;
    };

    try {
      const result = await parseCommand(command, sendMessage, roomId);
      
      // If there's a direct result from parseCommand, use it
      if (result && !response) {
        response = result;
      }

      return NextResponse.json({ 
        success: true,
        message: response,
        type: type
      });
    } catch (error) {
      console.error('Command execution error:', error);
      return NextResponse.json({ 
        success: false,
        error: error instanceof Error ? error.message : '执行命令失败，请稍后重试',
        type: 'text'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Command API error:', error);
    return NextResponse.json({ 
      success: false,
      error: '系统错误，请稍后重试',
      type: 'text'
    }, { status: 500 });
  }
}

// Get available commands
export async function GET() {
  try {
    const commands = commandMap
      .filter(command => command.enable !== false)
      .map(({ key, msg, type }) => ({
        key,
        description: msg,
        type: type || 'text'
      }));

    return NextResponse.json({
      success: true,
      commands
    });
  } catch (error) {
    console.error('Get commands error:', error);
    return NextResponse.json({
      success: false,
      error: '获取命令列表失败'
    }, { status: 500 });
  }
}
