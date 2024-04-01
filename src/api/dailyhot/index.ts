import { message } from 'antd';
import axios from 'axios';
import useDailyHotStore from 'store/dailyhot';

export interface IData {
  title: string;
  desc: string;
  hot: number;
  url: string;
  mobileUrl: string;
}

export interface IRootObject {
  code: number;
  message: string;
  name: string;
  title: string;
  subtitle: string;
  from: string;
  total: number;
  updateTime: string;
  data: IData[];
}

export const getHotLists = (type: string) => {
  return axios
    .get(`/routing/dailyHot/${type}`)
    .then((res) => {
      if (res.data.data) {
        useDailyHotStore.getState().setHotLists(type, res.data as IRootObject);
      }
    })
    .catch((res) => {
      message.error(res.message);
    });
};
