import Layout from '@/components/layout';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import React from 'react';
import DailyHotCard from '@/components/DailyHotCard';
import { getHotLists } from '@/api/dailyhot';
import { news } from '../../src/config/dailyhotConfig';
import { IData } from '@/api/dailyhot';

export interface HotType {
  label: string;
  name: string;
  order: number;
  show: boolean;
  subtitle?: string;
  updateTime?: string;
  children: IData[];
}

export const maxDuration = 60; // This function can run for a maximum of 5 seconds

export async function getStaticProps() {
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
  const hotLists = await Promise.all(requests);
  return {
    props: { hotLists },
    revalidate: 60,
  };
}
interface Props {
  hotLists: HotType[];
}
const DailyHot = ({ hotLists = [] }: Props) => {
  return (
    <Layout>
      <div className="m-2">
        <div className="grid md:grid-cols-3 gap-4 ">
          {hotLists.map((item) => {
            return (
              <div className="w-full overflow-auto" key={item.name}>
                <DailyHotCard data={item} />
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};
export default DailyHot;
