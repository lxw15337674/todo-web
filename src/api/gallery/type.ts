import { Producer } from "@prisma/client";

export type UpdateProducer = Pick<Producer, 'id'| 'name' |'weiboIds' >;

export type NewProducer = Pick<Producer,'name'>;
