'use server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/api/prisma';
import { summarizeBookmark } from '@/api/bookmark';

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
        const { url, remark, title, id } = await request.json();

        // 验证URL
        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: '无效的URL' }, { status: 400 });
        }

        // 构建基本数据对象
        const bookmarkData: any = {
            url,
            remark: remark || ''
        };

        // 如果提供了标题，则添加到数据中
        if (title) {
            bookmarkData.title = title;
        }

        // 尝试查找现有书签
        let existingBookmark;

        // 优先按ID查找
        if (id) {
            existingBookmark = await prisma.bookmark.findUnique({
                where: { id },
                include: { tags: true }
            });
        }

        // 如果没有找到，则按URL查找
        if (!existingBookmark) {
            existingBookmark = await prisma.bookmark.findFirst({
                where: { url },
                include: { tags: true }
            });
        }

        // 如果存在，则更新
        if (existingBookmark) {
            // 更新现有书签
            const updatedBookmark = await prisma.bookmark.update({
                where: { id: existingBookmark.id },
                data: bookmarkData,
                include: { tags: true }
            });

            return NextResponse.json(updatedBookmark);
        }

        // 不存在，则创建新书签
        bookmarkData.loading = true; // 新建的书签需要标记为加载中
        const newBookmark = await prisma.bookmark.create({
            data: bookmarkData,
        });

        // 异步处理摘要生成
        summarizeBookmark(newBookmark.id, url).catch(console.error);

        return NextResponse.json(newBookmark);
    } catch (error) {
        console.error('处理书签失败:', error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}
