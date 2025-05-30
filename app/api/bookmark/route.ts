import { NextRequest, NextResponse } from 'next/server';
import {
    createBookmark as serverCreateBookmark,
    getBookmarkByUrl,
    deleteBookmarkByUrl
} from 'src/api/bookmark';

// 验证API密钥
function validateApiKey(request: NextRequest) {
    const apiKey = request.headers.get('x-api-key');
    return apiKey === process.env.API_SECRET_KEY;
}

// 创建或更新书签API
export async function POST(request: NextRequest) {
    // 验证API密钥
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const newBookmark = await serverCreateBookmark(data).catch(console.error);
        return NextResponse.json(newBookmark);
    } catch (error) {
        console.error('处理书签失败:', error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}

// 通过 URL 获取书签 API
export async function GET(request: NextRequest) {
    // 验证 API 密钥
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    try {
        // 从 URL 参数中获取 url
        const url = request.nextUrl.searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: '缺少必要参数: url' }, { status: 400 });
        }

        // 使用服务端函数获取书签
        const bookmark = await getBookmarkByUrl(url);

        if (!bookmark) {
            return NextResponse.json({ error: '未找到书签' }, { status: 404 });
        }

        return NextResponse.json(bookmark);
    } catch (error) {
        console.error('获取书签失败:', error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}

// 通过 URL 删除书签 API
export async function DELETE(request: NextRequest) {
    // 验证 API 密钥
    if (!validateApiKey(request)) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    try {
        // 从 URL 参数中获取 url
        const url = request.nextUrl.searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: '缺少必要参数: url' }, { status: 400 });
        }

        // 使用服务端函数删除书签
        const deletedBookmark = await deleteBookmarkByUrl(url);

        if (!deletedBookmark) {
            return NextResponse.json({ error: '未找到书签' }, { status: 404 });
        }

        return NextResponse.json({
            message: '书签删除成功',
            bookmark: deletedBookmark
        });
    } catch (error) {
        console.error('删除书签失败:', error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}
