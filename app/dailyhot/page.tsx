import React from 'react';
import DailyHotCard from './DailyHotCard';
import { news } from '../../src/config/dailyhotConfig';
import { IData } from '@/api/dailyhot';
import axios from 'axios';

export interface HotType {
  label: string;
  name: string;
  show?: boolean;
  subtitle?: string;
  updateTime?: string;
  children: IData[];
}

export const revalidate = 60

const getHotLists = (
  async (type: string) => {
    return axios
      .get(`https://dailyhot.hkg1.zeabur.app/${type}`, {
        params: {
          cache: true,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((res) => {
        console.error(res.message);
      });
  })

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
