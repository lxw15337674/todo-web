export interface CountMeta {
  id: string;
  name: string;
  type: string;
  remark: string;
  createTime: Date;
  updateTime: Date;
  userId: string;
  counts: CountItem[];
}

export type CreateCountMeta = Pick<CountMeta, 'type' | 'remark' | 'name'>;

export type UpdateCountMeta = Pick<
  CountMeta,
  'type' | 'remark' | 'name' | 'id'
>;

export interface CountItem {
  id: string;
  remark: string;
  createTime: Date;
  updateTime: Date;
  countId: CountMeta;
}
