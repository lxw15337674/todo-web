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
        subtitle: res.subtitle,
        updateTime: res.updateTime,
        children: res.data ?? [],
      };
    }),
  );
  const hotLists = await Promise.all(requests);
  return {
    props: { hotLists },
    revalidate: 10,
  };
}
interface Props {
  hotLists: HotType[];
}
const DailyHot = ({ hotLists = [] }: Props) => {
  return (
    <Layout>
      <div className="m-2">
        <Grid container spacing={2}>
          {hotLists.map((item) => {
            return (
              <Grid xs={4} key={item.name}>
                <DailyHotCard data={item} />
              </Grid>
            );
          })}
        </Grid>
      </div>
    </Layout>
  );
};
export default DailyHot;
