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
    .get(`https://daily-hot-api-chi-topaz.vercel.app/${type}`)
    .then((res) => {
      return res.data;
    })
    .catch((res) => {
      console.error(res.message);
    });
};
