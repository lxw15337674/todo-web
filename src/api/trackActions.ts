// app/actions/trackActions.ts
'use server';

import { PrismaClient, TrackMeta, TrackItem } from '@prisma/client';

const prisma = new PrismaClient();

// TrackMeta CRUD
interface CreateTrackMetaParams {
    name: string;
    type: string;
}



export async function createTrackMeta({ name, type,
}: CreateTrackMetaParams): Promise<TrackMeta> {
    return prisma.trackMeta.create({
        data: {
            name,
            type
        },
    });
}

export async function fetchTrackMetas() {
    return prisma.trackMeta.findMany({
        include: {
            countItems: {
                orderBy: {
                    createTime: 'desc', // 根据 createTime 倒序排列
                },
            },
        },
        orderBy: {
            createTime: 'desc', // 根据 createTime 倒序排列
        },
    });
}

interface UpdateTrackMetaParams {
    id: string;
    name?: string;
    type?: string;
    remark?: string;
}

export async function queryTrackMetaById(id: string): Promise<TrackMeta | null> {
    return prisma.trackMeta.findUnique({
        where: { id },
        include: {
            countItems: {
                orderBy: {
                    createTime: 'desc', // 根据 createTime 倒序排列
                },
            },
        },
    });
}
export async function updateTrackMeta({ id, name, type, remark }: UpdateTrackMetaParams): Promise<TrackMeta> {
    return prisma.trackMeta.update({
        where: { id },
        data: {
            name,
            type,
            remark,
        },
    });
}

export async function deleteTrackMeta(id: string): Promise<TrackMeta> {
    return prisma.trackMeta.delete({
        where: { id },
    });
}

export async function createTrackItem(countMetaId: string, createTime: Date, remark: string = ''): Promise<TrackMeta> {
    await prisma.trackItem.create({
        data: {
            remark: remark,
            countMetaId,
            createTime
        },
    });
    const data = await queryTrackMetaById(countMetaId)
    return data as TrackMeta
}

export async function fetchTrackItems(): Promise<TrackItem[]> {
    return prisma.trackItem.findMany();
}

export async function fetchTrackItemById(id: string): Promise<TrackItem | null> {
    return prisma.trackItem.findUnique({
        where: { id },
    });
}

interface UpdateTrackItemParams {
    id: string;
    remark: string;
    countMetaId?: string;
}

export async function updateTrackItem({ id, remark, countMetaId }: UpdateTrackItemParams): Promise<TrackItem> {
    return prisma.trackItem.update({
        where: { id },
        data: {
            remark,
            countMetaId,
        },
    });
}



export async function deleteTrackItem(id: string): Promise<TrackItem> {
    return prisma.trackItem.delete({
        where: { id },
    });
}
