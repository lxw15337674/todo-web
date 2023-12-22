export interface Counter {
  id: string;
  name: string;
  type: string;
  remark: string;
  createTime: Date;
  updateTime: Date;
  userId: string;
}

export interface CountMeta extends Counter {
  count: number;
}

export interface CountDetail extends Counter {
  counts: CountItem[];
}

export type CreateCountMeta = Pick<Counter, 'type' | 'remark' | 'name'>;

export type UpdateCountMeta = Pick<Counter, 'type' | 'remark' | 'name' | 'id'>;

export interface CountItem {
  id: string;
  remark: string;
  createTime: Date;
  updateTime: Date;
  countMeta: CountMeta;
}
