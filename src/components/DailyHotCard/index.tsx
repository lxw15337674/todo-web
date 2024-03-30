import { getHotLists } from '@/api/dailyhot';
import { Paper } from '@mui/material';
import React, { useState } from 'react';
import useDailyHotStore, { HotType } from 'store/dailyhot';
import { usePromise } from 'wwhooks';
interface Props {
    data: HotType
}
const DailyHotCard = ({ data }: Props) => {
    console.log(data)
    return <Paper>
        {data.name}
        {
            (data.children??[]).map((item, index) => {
                return <div key={index}>
                    {item.title}
                </div>
            })
        }
    </Paper>
}
export default DailyHotCard;