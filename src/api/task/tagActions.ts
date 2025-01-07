'use server';
import { PrismaClient, TaskTag as PrismaTaskTag } from '@prisma/client';

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

export const updateTaskTags = async (taskId: string, tagIds: string[]): Promise<void> => {
    await prisma.task.update({
        where: { id: taskId },
        data: {
            tags: {
                set: tagIds.map(id => ({ id })),
            },
        },
    });
};
