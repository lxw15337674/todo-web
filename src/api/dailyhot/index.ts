import axios from 'axios';
import { unstable_cache } from 'next/cache';

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

export const getHotLists = unstable_cache((type: string) => {
  return axios
    .get(`https://dailyhot.hkg1.zeabur.app/${type}`,{
      params:{
        cache:true
      }
    })
    .then((res) => {
      return res.data;
    })
    .catch((res) => {
      console.error(res.message);
    });
} , ['hot'], { revalidate: 60 * 60  });