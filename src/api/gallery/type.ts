import { Producer } from "@prisma/client";

export type UpdateProducer = Omit<Producer, 'createTime' | 'updateTime' | 'deletedAt'> & { id: string };

export type NewProducer = Pick<Producer,'name'>;