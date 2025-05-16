import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({
        success: false,
        error: '请输入命令',
        type: 'text'
      }, { status: 400 });
    }
    const { data } = await axios.get('/bhwa233-api/command', {
      params: {
        command
      }
    });
    return NextResponse.json(data);
  }
  catch (error) {
    return NextResponse.json({
      success: false,
      error: '服务调用失败'
    }, { status: 500 });
  }
}