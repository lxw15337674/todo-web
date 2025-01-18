'use server';
import { PrismaClient, TaskTag as PrismaTaskTag } from '@prisma/client';
import { getTaskTags } from '../ai/aiActions';

const prisma = new PrismaClient();

export type TaskTag = Omit<PrismaTaskTag, 'deletedAt'>;

export interface NewTaskTag {
  name: string;
  remark?: string;
}

export const fetchTaskTags = async (): Promise<TaskTag[]> => {
  const tags = await prisma.taskTag.findMany({
    where: { deletedAt: null },
    orderBy: { createTime: 'desc' },
  });
  return tags.map(({ deletedAt, ...tag }) => tag);
};

export const createTaskTag = async (data: NewTaskTag): Promise<TaskTag> => {
  const tag = await prisma.taskTag.create({
    data,
  });
  const { deletedAt, ...result } = tag;
  return result;
};

export const deleteTaskTag = async (id: string): Promise<TaskTag> => {
  const tag = await prisma.taskTag.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  const { deletedAt, ...result } = tag;
  return result;
};

export const updateTaskTags = async (
  taskId: string,
  tagIds: string[],
): Promise<void> => {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      tags: {
        set: tagIds.map((id) => ({ id })),
      },
    },
  });
};

// 生成任务标签,返回标签id
export const generateTaskTags = async (content: string): Promise<TaskTag[]> => {
  const existedTags = await fetchTaskTags();
  const tags = await getTaskTags(
    content,
    existedTags.map((tag) => tag.name),
  );

  // 批量创建标签
  await prisma.taskTag.createMany({
    data: tags.map((tag) => ({ name: tag })),
    skipDuplicates: true, // 避免重复创建
  });

  // 查询新创建的标签
  const newTags = await prisma.taskTag.findMany({
    where: {
      name: {
        in: tags,
      },
      deletedAt: null,
    },
  });

  return newTags.map(({ deletedAt, ...tag }) => tag);
};
