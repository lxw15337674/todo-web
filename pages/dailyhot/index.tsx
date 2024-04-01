'use Client';
import Layout from '@/components/layout';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import React from 'react';
import DailyHotCard from '@/components/DailyHotCard';
import { getHotLists } from '@/api/dailyhot';
import useDailyHotStore from 'store/dailyhot';
import { useMount } from 'wwhooks';

const DailyHot = () => {
  const { hotLists } = useDailyHotStore();
  useMount(async () => {
    for (const item of hotLists) {
      getHotLists(item.name);
    }
  });
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
