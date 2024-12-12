'use server'
import { PrismaClient, Bookmark, BookmarkTag } from '@prisma/client';
import getSummarizeBookmark, { OpenAICompletion } from './aiActions';

const prisma = new PrismaClient();


// 批量查找标签，如果不存在标签，创建标签
export const findBookmarkTags = async (data: string[]): Promise<BookmarkTag[]> => {
    // 查找所有存在的标签
    const existingTags = await prisma.bookmarkTag.findMany({
        where: { name: { in: data } },
    });

    // 提取已存在标签的名称
    const existingTagNames = new Set(existingTags.map(tag => tag.name));

    // 找出需要创建的新标签
    const newTags = data.filter(name => !existingTagNames.has(name));

    // 批量创建新标签
    if (newTags.length > 0) {
        await prisma.bookmarkTag.createMany({
            data: newTags.map(name => ({ name })),
        });
    }

    // 返回所有标签（包括新创建的）
    return prisma.bookmarkTag.findMany({
        where: { name: { in: data } },
    });
};

// 创建书签
export const createBookmark = async (url: string): Promise<Bookmark | null> => {
    // 判断是否已经存在相同的书签
    const existingBookmark = await prisma.bookmark.findFirst({
        where: { url },
    });
    if (existingBookmark) {
        return existingBookmark
    }
    let newBookMark: Bookmark | null = null;
    try {
        newBookMark = await prisma.bookmark.create({
            data: { url, loading: true },
        });

        getSummarizeBookmark(url).then(async (data: OpenAICompletion) => {
            if (!newBookMark) {
                return null;
            }
            if (!data) {
                throw new Error("Failed to get summary data");

            }
            const tags: BookmarkTag[] = await findBookmarkTags(data.tags);
            const updatedBookmark = await prisma.bookmark.update({
                where: { id: newBookMark.id },
                data: {
                    title: data.title,
                    summary: data.summary,
                    image: data.image,
                    tags: { connect: tags.map(tag => ({ id: tag.id })) },
                    loading: false,
                },
            });
            console.info(`Created bookmark ${updateBookmark.name}-${updatedBookmark.id} with tags ${tags.map(tag => tag.name).join(', ')}`);
        });
    } catch (e) {
        if (newBookMark) {
            // 如果创建书签失败，更新书签的 loading 状态
            await prisma.bookmark.update({
                where: { id: newBookMark.id },
                data: { loading: false },
            });
        }
    }
    return newBookMark;
};


// 获取所有书签
export interface CompleteBookmark extends Bookmark {
    tags: BookmarkTag[]
}
interface GetAllBookmarksOptions {
    keyword?: string;
    tagId?: string|null
}
export const getAllBookmarks = async (options: GetAllBookmarksOptions): Promise<CompleteBookmark[]> => {
    const { keyword, tagId } = options;
    return await prisma.bookmark.findMany({
        take: 100,
        where: {
            AND: [
                keyword ? {
                    OR: [
                        { title: { contains: keyword } },
                    ],
                } : {},
                tagId ? {
                    tags: {
                        some: { id: tagId },
                    },
                } : {},
            ],
        },
        orderBy: { createTime: 'desc' },
        include: { tags: true },
    });
};
// 获取单个书签，不断轮训直到书签加载完成
export const getSingleBookmark = async (id: string): Promise<CompleteBookmark | null> => {
    let bookmark = await prisma.bookmark.findUnique({
        where: { id },
        include: { tags: true }
    });
    while (bookmark?.loading) {
        await new Promise(resolve => setTimeout(resolve, 4000));
        bookmark = await prisma.bookmark.findUnique({
            where: { id },
            include: { tags: true }
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


export interface BookmarkTagWithCount extends BookmarkTag {
    count: number
}
// 获取所有标签，并查询每个标签下的关联多少个书签
export const getAllBookmarkTags = async (): Promise<BookmarkTagWithCount[]> => {
    const data = await prisma.bookmarkTag.findMany({
        include: { bookmarks: true },
    });
    return data.map(item => {
        return {
            ...item,
            count: item.bookmarks.length
        }
    })
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
