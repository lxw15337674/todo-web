'use server';
import { PrismaClient, Task, TrackItem } from '@prisma/client';
import { createTrackItem, fetchTrackMetas } from './HabitActions';

const prisma = new PrismaClient();
export type TaskType = 'task' | 'track';
export type NewTask = Omit<Task, 'id' | 'createTime' | 'updateTime' | 'deletedAt'>


export const createTask = async (data: NewTask): Promise<Task> => {
    return await prisma.task.create({
        data,
    });
};


export const fetchTasks = async (): Promise<Task[]> => {
    return await prisma.task.findMany({
        orderBy: { createTime: 'desc' },
    });
};


// 聚合查询
export interface AggregatedTask extends Task {
    type: TaskType,
    countItems?: TrackItem[]
}
export const fetchAggregatedTask = async () => {
    const tasks = await fetchTasks();
    const tracks = await fetchTrackMetas();
    const taskItems = tasks.map(item => ({ ...item, type: 'task' }));
    const trackItems = tracks.map(item => {
        const todayTrackItem = item.countItems.find(countItem => {
            return new Date(countItem.createTime).toDateString() === new Date().toDateString();
        });
        return { ...item, type: 'track', status: todayTrackItem ? '1' : '0' };
    });
    return [...taskItems, ...trackItems] as AggregatedTask[]
};

interface UpdateTaskParams extends Partial<Omit<Task, 'id' | 'createTime' | 'updateTime'>> {
    type: TaskType
}

export const updateTask = async (id: string, data: UpdateTaskParams) => {
    if (data.type === 'track') {
        await createTrackItem(id);
        return
    }
    await prisma.task.update({
        where: { id },
        data,
    });
};

export const deleteTask = async (id: string): Promise<Task> => {
    return await prisma.task.delete({
        where: { id },
    });
};
