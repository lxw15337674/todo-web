'use server';
import prisma from '../prisma';
import { Asset } from '@prisma/client';
import { AssetFormData } from './types';

export async function getAssets(): Promise<Asset[]> {
    return prisma.asset.findMany({
        orderBy: { date: 'desc' }
    });
}


export async function createAsset(data: AssetFormData): Promise<Asset> {
    return prisma.asset.create({
        data: {
            name: data.name,
            amount: data.amount,
            date: data.date,
            description: data.description
        }
    });
}

export async function updateAsset(id: string, data: AssetFormData): Promise<Asset> {
    return prisma.asset.update({
        where: { id },
        data: {
            name: data.name,
            amount: data.amount,
            date: data.date,
            description: data.description
        }
    });
}

export async function deleteAsset(id: string): Promise<Asset> {
    return prisma.asset.delete({
        where: { id }
    });
}
