// app/actions/trackActions.ts
'use server';

import { PrismaClient, TrackMeta, TrackItem } from '@prisma/client';

const prisma = new PrismaClient();

// TrackMeta CRUD
interface CreateTrackMetaParams {
    name: string;
    remark: string;
}

export async function createTrackMeta({ name,  remark }: CreateTrackMetaParams): Promise<TrackMeta> {
    return prisma.trackMeta.create({
        data: {
            name,
            remark,
        },
    });
}

export async function getTrackMetas(): Promise<TrackMeta[]> {
    return prisma.trackMeta.findMany();
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

// TrackItem CRUD
interface CreateTrackItemParams {
    remark: string;
    countMetaId?: string;
}

export async function createTrackItem({ remark, countMetaId }: CreateTrackItemParams): Promise<TrackItem> {
    return prisma.trackItem.create({
        data: {
            remark,
            countMetaId,
        },
    });
}

export async function getTrackItems(): Promise<TrackItem[]> {
    return prisma.trackItem.findMany();
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