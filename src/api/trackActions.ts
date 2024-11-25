// app/actions/trackActions.ts
'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TrackMeta CRUD
export async function createTrackMeta(name: string, type: string, remark: string, userId?: string) {
    return prisma.trackMeta.create({
        data: {
            name,
            type,
            remark,
            userId,
        },
    });
}

export async function getTrackMetas() {
    return prisma.trackMeta.findMany();
}

export async function updateTrackMeta(id: string, name: string, type: string, remark: string, userId?: string) {
    return prisma.trackMeta.update({
        where: { id },
        data: {
            name,
            type,
            remark,
            userId,
        },
    });
}

export async function deleteTrackMeta(id: string) {
    return prisma.trackMeta.delete({
        where: { id },
    });
}

// TrackItem CRUD
export async function createTrackItem(remark: string, countMetaId?: string) {
    return prisma.trackItem.create({
        data: {
            remark,
            countMetaId,
        },
    });
}

export async function getTrackItems() {
    return prisma.trackItem.findMany();
}

export async function updateTrackItem(id: string, remark: string, countMetaId?: string) {
    return prisma.trackItem.update({
        where: { id },
        data: {
            remark,
            countMetaId,
        },
    });
}

export async function deleteTrackItem(id: string) {
    return prisma.trackItem.delete({
        where: { id },
    });
}