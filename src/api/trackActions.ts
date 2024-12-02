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
            countItems: true, // 包含关联的 TrackItem
        },
    });
}

interface UpdateTrackMetaParams {
    id: string;
    name: string;
    type: string;
    remark: string;
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

interface DeleteTrackMetaParams {
    id: string;
}

export async function deleteTrackMeta({ id }: DeleteTrackMetaParams): Promise<TrackMeta> {
    return prisma.trackMeta.delete({
        where: { id },
    });
}

export async function createTrackItem(countMetaId: string, remark: string = ''): Promise<TrackItem> {
    return prisma.trackItem.create({
        data: {
            remark: remark,
            countMetaId,
        },
    });
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

interface DeleteTrackItemParams {
    id: string;
}

export async function deleteTrackItem({ id }: DeleteTrackItemParams): Promise<TrackItem> {
    return prisma.trackItem.delete({
        where: { id },
    });
}
