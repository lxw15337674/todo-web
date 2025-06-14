'use server';
import { PrismaClient, Bookmark, BookmarkTag } from '@prisma/client';
import { getSummarizeBookmarkByContent } from '../ai/aiActions';
import prisma from '../prisma';


interface CreateBookmarkData {
  url: string;
  title?: string;
  image?: string;
  remark?: string;
  content?: string; // 页面内容，用于AI摘要
}

// 创建书签
export const createBookmark = async (
  data: CreateBookmarkData,
): Promise<CompleteBookmark | null> => {
  // 验证 URL
  if (!data.url || typeof data.url !== 'string' || data.url.trim() === '') {
    throw new Error('URL is required and cannot be empty');
  }

  const bookmarkData = {
    url: data.url,
    title: data.title || '',
    image: data.image || '',
    remark: data.remark || '',
  };

  // 创建新书签
  const newBookmark = await prisma.bookmark.upsert({
    where: { url: bookmarkData.url },
    update: { ...bookmarkData, loading: true },
    create: { ...bookmarkData, loading: true },
  });
  // 如果提供了内容，则生成AI摘要和标签，并返回完整书签
  if (data.content && data.content.trim() !== '') {
    try {
      const updatedBookmark = await summarizeBookmarkByContent(newBookmark.id, data.content);
      // 如果AI摘要成功，返回包含summary和tags的完整书签
      if (updatedBookmark) {
        return updatedBookmark;
      }
    } catch (error) {
      console.error('生成AI摘要失败:', error);
      // 如果AI摘要失败，至少将loading状态设为false
      await prisma.bookmark.update({
        where: { id: newBookmark.id },
        data: { loading: false },
      }).catch(updateError => {
        console.error('更新loading状态失败:', updateError);
      });
    }
  }

  // 如果没有AI处理，返回包含空tags的完整书签
  const completeBookmark = await prisma.bookmark.findUnique({
    where: { id: newBookmark.id },
    include: { tags: true },
  });

  return completeBookmark;
};

// 通过文章内容总结书签
export async function summarizeBookmarkByContent(id: string, content: string) {
  try {
    const tags: BookmarkTag[] = await getBookmarkTags()
    const data = await getSummarizeBookmarkByContent(content, tags.map(tag => tag.name));
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

    const allTags = [...existingTags, ...newTags];    // Remove all existing tag connections first
    await prisma.bookmark.update({
      where: { id },
      data: {
        tags: {
          set: [], // This will remove all existing tag connections
        },
      },
    });

    // Update bookmark with new data and tags
    const updatedBookmark = await prisma.bookmark.update({
      where: { id },
      data: {
        title: data.title,
        summary: data.summary,
        tags: {
          connect: allTags.map(tag => ({ id: tag.id }))
        },
        loading: false
      },
      include: { tags: true },
    });

    console.info(
      `Updated bookmark ${updatedBookmark.title}-${updatedBookmark.id} with tags ${updatedBookmark.tags.map((tag) => tag.name).join(', ')}`,
    );
    return updatedBookmark;
  } catch (e) {
    console.error('Error in summarizeBookmarkByContent:', e);
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
