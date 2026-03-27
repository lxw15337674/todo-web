import { NextRequest, NextResponse } from 'next/server';

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
    const upstreamUrl = new URL('/bhwa233-api/command', request.nextUrl.origin);
    upstreamUrl.searchParams.set('command', command);

    const response = await fetch(upstreamUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`command upstream failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  }
  catch (error) {
    return NextResponse.json({
      success: false,
      error: '服务调用失败'
    }, { status: 500 });
  }
}
