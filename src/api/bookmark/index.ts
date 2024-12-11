'use server'
import { PrismaClient, Bookmark, BookmarkTag } from '@prisma/client';
import getSummarizeBookmark, { OpenAICompletion } from './aiActions';

const prisma = new PrismaClient();

// 创建书签
export const createBookmark = async (url: string): Promise<Bookmark> => {
    const newBookMark = await prisma.bookmark.create({
        data: {
            url,
            loading: true
        },
    });
    getSummarizeBookmark(url).then(async (data: OpenAICompletion) => {
        console.log(data);
        const tags = await findBookmarkTags(data.tags);
        return prisma.bookmark.update({
            where: { id: newBookMark.id },
            data: {
                title: data.title,
                summary: data.summary,
                image: data.image,
                tags: {
                    connect: tags.map(tag => ({ id: tag.id }))
                },
                loading: false
            }
        });
    });
    return newBookMark;
};

// 获取所有书签
export interface CompleteBookmark extends Bookmark {
    tags: BookmarkTag[]
}
export const getAllBookmarks = async (): Promise<CompleteBookmark[]> => {
    return await prisma.bookmark.findMany({
        take: 100,
        orderBy: {
            createTime: 'desc'
        },
        include: {
            tags: true
        }
    });
};

// 获取单个书签，不断轮训直到书签加载完成
export const getSingleBookmark = async (id: string): Promise<CompleteBookmark | null> => {
    let bookmark = await prisma.bookmark.findUnique({
        where: { id },
        include: {
            tags: true
        }
    });
    while (bookmark?.loading) {
        await new Promise(resolve => setTimeout(resolve, 4000));
        bookmark = await prisma.bookmark.findUnique({
            where: { id },
            include: {
                tags: true
            }
        });
    }
    return bookmark;
};

// 更新书签
export const updateBookmark = async (id: string, data: Bookmark): Promise<Bookmark> => {
    return await prisma.bookmark.update({
        where: { id },
        data,
    });
};

// 删除书签
export const deleteBookmark = async (id: string): Promise<Bookmark> => {
    return await prisma.bookmark.delete({
        where: { id },
    });
};

// 批量查找标签，如果不存在标签，创建标签
export const findBookmarkTags = async (data: string[]): Promise<BookmarkTag[]> => {
    await prisma.bookmarkTag.createMany({
        data: data.map((name) => ({ name })),
        skipDuplicates: true,
    });
    return prisma.bookmarkTag.findMany({
        where: {
            name: {
                in: data
            }
        }
    });
}

// 获取所有标签
export const getAllBookmarkTags = async (): Promise<BookmarkTag[]> => {
    return await prisma.bookmarkTag.findMany();
};

// 更新标签
export const updateBookmarkTag = async (id: string, data: BookmarkTag): Promise<BookmarkTag> => {
    return await prisma.bookmarkTag.update({
        where: { id },
        data,
    });
};

// 删除标签
export const deleteBookmarkTag = async (id: string): Promise<BookmarkTag> => {
    return await prisma.bookmarkTag.delete({
        where: { id },
    });
};
