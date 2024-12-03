import React from 'react';
import DailyHotCard from './DailyHotCard';
import { news } from '../../src/config/dailyhotConfig';
import { IData } from '@/api/dailyhot';
import { unstable_cache } from 'next/cache';
import axios from 'axios';

export interface HotType {
  label: string;
  name: string;
  show?: boolean;
  subtitle?: string;
  updateTime?: string;
  children: IData[];
}
const getHotLists = unstable_cache((
  async (type: string) => {
    return axios
      .get(`https://dailyhot.hkg1.zeabur.app/${type}`, {
        params: {
          cache: false,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((res) => {
        console.error(res.message);
      });
  }),
  ['getHotLists'],
  {
    revalidate: 60 * 60 // 1 hour
  }
)

const DailyHot = async () => {
  const requests = news.map((item) =>
    getHotLists(item.name).then((res) => {
      return {
        ...item,
        subtitle: res?.subtitle ?? '',
        updateTime: res?.updateTime ?? Date.now().toString(),
        children: res?.data ?? [],
      };
    }),
  );
  const hotLists: HotType[] = await Promise.all(requests);
  return (
    <div className="m-4">
      <div className="grid md:grid-cols-3 gap-4">
        {hotLists.map((item) => {
          return (
            <div className="w-full overflow-auto" key={item.name}>
              <DailyHotCard data={item} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DailyHot;