'use client';

import Layout from '@/components/layout';
import React from 'react';
import DailyHotCard from './DailyHotCard';
import { getHotLists } from '@/api/dailyhot';
import { news } from '../../src/config/dailyhotConfig';
import { IData } from '@/api/dailyhot';

export interface HotType {
  label: string;
  name: string;
  order: number;
  show?: boolean;
  subtitle?: string;
  updateTime?: string;
  children: IData[];
}

const DailyHot = async () => {
  const requests =  news.map((item) =>
    getHotLists(item.name).then((res) => {
      return {
        ...item,
        subtitle: res?.subtitle ?? '',
        updateTime: res?.updateTime ?? Date.now().toString(),
        children: res?.data ?? [],
      };
    }),
  )  
  const hotLists: HotType[] = await Promise.all(requests);
  return (
      <div className="m-2">
        <div className="grid md:grid-cols-3 gap-4 ">
          {hotLists.map((item) => {
            return (
              <div className="w-full overflow-auto" key={item.name}>
                <DailyHotCard data={item } />
              </div>
            );
          })}
        </div>
      </div>
  );
};
export default DailyHot;
