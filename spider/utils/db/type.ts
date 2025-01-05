import { Producer } from "@prisma/client";

export type UpdateProducer = Omit<Producer, 'createTime' | 'updateTime' | 'deletedAt'>;

export type NewProducer = Pick<Producer,'name' | 'weiboIds' | 'xiaohongshuIds' | 'douyinIds' | 'weiboChaohua'>;