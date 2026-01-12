import { NextRequest, NextResponse } from 'next/server';
import { getRandomImage } from '@/api/gallery/randomMedia';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gallery/random
 * 
 * 随机返回一张图片URL（302重定向）
 * 
 * 查询参数（可选）：
 * - producer: string - 制作者ID
 * - tags: string - 标签ID，多个标签用逗号分隔
 * 
 * 返回：
 * - 302 重定向到随机图片URL
 * - 404 如果没有符合条件的图片
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const producer = searchParams.get('producer');
        const tagsParam = searchParams.get('tags');

        // 解析标签ID
        const tagIds = tagsParam ? tagsParam.split(',').filter(Boolean) : null;

        // 获取随机图片URL
        const imageUrl = await getRandomImage(producer, tagIds);

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'No images found matching the criteria' },
                { status: 404 }
            );
        }

        // 302 重定向到图片URL，不缓存
        return NextResponse.redirect(imageUrl, {
            status: 302,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Error in random image API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
