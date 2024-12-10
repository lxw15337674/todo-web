import { PrismaClient, Bookmark, BookmarkTag } from '@prisma/client';

const prisma = new PrismaClient();

// 创建书签
export const createBookmark = async (data: Bookmark): Promise<Bookmark> => {
    return await prisma.bookmark.create({
        data,
    });
};

// 获取所有书签
export const getAllBookmarks = async (): Promise<Bookmark[]> => {
    return await prisma.bookmark.findMany();
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

// 创建标签
export const createBookmarkTag = async (name: string): Promise<BookmarkTag> => {
    return await prisma.bookmarkTag.create({
        data: {
            name
        }
    });
};

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
