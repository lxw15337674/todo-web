import Layout from '@/components/layout';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import React, { useState } from 'react';
import DailyHotCard from '@/components/DailyHotCard';
import { getHotLists } from '@/api/dailyhot';
import useDailyHotStore from 'store/dailyhot';
import { useMount, usePromise } from 'wwhooks';

export async function getServerSideProps() {
    // Fetch data from external API
    const res = await fetch(`https://.../data`)
    const data = await res.json()

    // Pass data to the page via props
    return { props: { data } }
}

const DailyHot = () => {
    const { hotLists } = useDailyHotStore()
    useMount(async () => {
        for (let item of hotLists) {
            await getHotLists(item.name)
        }
    })
    return <Layout>
        <Grid container spacing={2}>
            {hotLists.map(item => {
                if (item.children.length === 0) {
                    return null
                }
                return <Grid item xs={6} key={item.name}>
                    <DailyHotCard data={item} />
                </Grid>
            })}
        </Grid>
    </Layout>
}
export default DailyHot;