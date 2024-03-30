import axios from "axios";
import useDailyHotStore from "store/dailyhot";

export interface New {
    title: string;
    pic: string;
    hot: string;
    url: string;
    mobileUrl: string;
}

export const getHotLists = (type:string) => {
    return axios.get(`/routing/dailyHot/${type}`).then((res)=>{
        useDailyHotStore.getState().setHotLists(type, res.data);
    })
};
