'use server';
import { PrismaClient, Task as PrismaTask, TrackItem, TaskTag, Priority } from '@prisma/client';
import { createTrackItem, fetchTrackMetas } from '../habitActions';
import { generateTaskTags } from './tagActions';

const prisma = new PrismaClient();
export type TaskType = 'task' | 'track';

export type Task = PrismaTask & {
  tags: TaskTag[];
};

export type NewTask = Omit<
  PrismaTask,
  'id' | 'createTime' | 'updateTime' | 'deletedAt'
> 

export const createTask = async (taskData: NewTask): Promise<Task> => {
  const tags = await generateTaskTags(taskData.name || '')

  return await prisma.task.create({
    data: {
      ...taskData,
      tags: {
        connect: tags
      }
    },
    include: {
      tags: true
    }
  });
};

export const fetchTasks = async (): Promise<Task[]> => {
  return await prisma.task.findMany({
    orderBy: { createTime: 'desc' },
    include: {
      tags: true
    }
  });
};

// 聚合查询
export interface AggregatedTask extends Task {
  type: TaskType;
  countItems?: TrackItem[];
  updatedAt: string | Date;
}

export const fetchAggregatedTask = async () => {
  const tasks = await fetchTasks();
  const tracks = await fetchTrackMetas();
  const taskItems = tasks.map((item) => ({ ...item, type: 'task' }));
  const trackItems = tracks.map((item) => {
    const todayTrackItem = item.countItems.find((countItem) => {
      return (
        new Date(countItem.createTime).toDateString() ===
        new Date().toDateString()
      );
    });
    return { ...item, type: 'track', status: todayTrackItem ? '1' : '0', tags: [] };
  });
  return [...taskItems, ...trackItems] as AggregatedTask[];
};

interface UpdateTaskParams
  extends Partial<Omit<PrismaTask, 'id' | 'createTime' | 'updateTime'>> {
}

export const updateTask = async (id: string, params: UpdateTaskParams) => {
  return await prisma.task.update({
    where: { id },
    data: params,
    include: {
      tags: true
    }
  });
};

export const deleteTask = async (id: string): Promise<Task> => {
  return await prisma.task.delete({
    where: { id },
    include: {
      tags: true
    }
  });
};
