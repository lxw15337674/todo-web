'use server';
import { PrismaClient, Bookmark, BookmarkTag } from '@prisma/client';
import getSummarizeBookmark from '../ai/aiActions';
import prisma from '../prisma';


interface CreateBookmarkData {
  url: string;
  title: string;
  image: string;
  remark: string;
}

// 创建书签
export const createBookmark = async (
  data: CreateBookmarkData,
): Promise<Bookmark | null> => {

  // 创建新书签
  const newBookmark = await prisma.bookmark.upsert({
    where: { url: data.url },
    update: { ...data, loading: true },
    create: { ...data, loading: true },
  });

  return newBookmark;
};

export async function summarizeBookmark(id: string, url: string) {
  try {
    const tags: BookmarkTag[] = await getBookmarkTags()
    const data = await getSummarizeBookmark(url, tags.map(tag => tag.name));
    if (!data) {
      throw new Error('Failed to get summary data');
    }

    // First find existing tags
    const existingTags = await prisma.bookmarkTag.findMany({
      where: {
        name: { in: data.tags }
      }
    });

    // Create missing tags
    const existingTagNames = existingTags.map(t => t.name);
    const missingTagNames = data.tags.filter(t => !existingTagNames.includes(t));
    const newTags = await Promise.all(
      missingTagNames.map(name =>
        prisma.bookmarkTag.create({ data: { name } })
      )
    );

    const allTags = [...existingTags, ...newTags];
    await prisma.bookmark.update({
      where: { id },
      data: {
        tags: {
          set: [], // This will remove all existing tag connections
        },
      },
    });
    const updatedBookmark = await prisma.bookmark.upsert({
      where: { id },
      create: {
        id,
        url,
        title: data.title,
        summary: data.summary,
        image: data.image,
        tags: {
          connect: allTags.map(tag => ({ id: tag.id }))
        },
        loading: false
      },
      update: {
        title: data.title,
        summary: data.summary,
        image: data.image,
        tags: {
          connect: allTags.map(tag => ({ id: tag.id }))
        },
        loading: false
      },
      include: { tags: true },
    });
    console.info(
      `Created bookmark ${updatedBookmark.title}-${updatedBookmark.id
      } with tags ${updatedBookmark.tags.map((tag) => tag.name).join(', ')}`,
    );
    return updatedBookmark;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// 获取所有书签
export interface CompleteBookmark extends Bookmark {
  tags: BookmarkTag[];
}
interface GetAllBookmarksOptions {
  keyword?: string;
  tagId?: string | null;
}
export const getAllBookmarks = async (
  options: GetAllBookmarksOptions,
): Promise<CompleteBookmark[]> => {
  const { keyword, tagId } = options;
  return await prisma.bookmark.findMany({
    take: 100,
    where: {
      AND: [
        keyword
          ? {
            OR: [{ title: { contains: keyword } }],
          }
          : {},
        tagId
          ? {
            tags: {
              some: { id: tagId },
            },
          }
          : {},
      ],
    },
    orderBy: { createTime: 'desc' },
    include: { tags: true },
  });
};
// 获取单个书签，不断轮训直到书签加载完成
export const getSingleBookmark = async (
  id: string,
): Promise<CompleteBookmark | null> => {
  let bookmark = await prisma.bookmark.findUnique({
    where: { id },
    include: { tags: true },
  });
  while (bookmark?.loading) {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    bookmark = await prisma.bookmark.findUnique({
      where: { id },
      include: { tags: true },
    });
  }
  return bookmark;
};

// 更新书签
export const updateBookmark = async (
  id: string,
  data: Bookmark,
): Promise<Bookmark> => {
  // 删除之前关联的标签
  await prisma.bookmark.update({
    where: { id },
    data: {
      tags: {
        set: [],
      },
    },
  });

  // 更新书签数据
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
  count: number;
}

export const getBookmarkTags = async (): Promise<BookmarkTag[]> => {
  return await prisma.bookmarkTag.findMany();
}

// 获取所有标签，并查询每个标签下的关联多少个书签
export const getAllBookmarkTags = async (): Promise<BookmarkTagWithCount[]> => {
  const data = await prisma.bookmarkTag.findMany({
    include: { bookmarks: true },
  });
  return data
    .map((item) => {
      return {
        ...item,
        count: item.bookmarks.length,
      };
    })
    .sort((a, b) => b.count - a.count);
};

// 通过 URL 获取书签
export const getBookmarkByUrl = async (url: string): Promise<CompleteBookmark | null> => {
  return await prisma.bookmark.findFirst({
    where: { url },
    include: { tags: true },
  });
};

// 通过 URL 删除书签
export const deleteBookmarkByUrl = async (url: string): Promise<Bookmark | null> => {
  const bookmark = await prisma.bookmark.findFirst({
    where: { url },
  });

  if (!bookmark) {
    return null;
  }

  return await prisma.bookmark.delete({
    where: { id: bookmark.id },
  });
};

// 更新标签
export const updateBookmarkTag = async (
  id: string,
  data: BookmarkTag,
): Promise<BookmarkTag> => {
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
