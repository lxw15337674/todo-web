import { Asset } from '@prisma/client';

export type AssetFormData = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;