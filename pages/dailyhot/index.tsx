import Layout from '@/components/layout';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import React from 'react';
import DailyHotCard from '@/components/DailyHotCard';
import { getHotLists } from '@/api/dailyhot';
import useDailyHotStore, { HotType } from 'store/dailyhot';

export async function getServerSideProps() {
  const { hotLists } = useDailyHotStore.getState();
  await Promise.all(hotLists.map((item) => getHotLists(item.name)));
  return {
    props: { hotLists: useDailyHotStore.getState().hotLists },
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
