import axios, { AxiosResponse } from 'axios';

declare module 'axios' {
  export interface AxiosInstance {
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<T>;
  }
}

export const service = axios.create({});

export interface ResponseData {
  code: number;
  data?: any;
  message: string;
}

service.interceptors.response.use(
  <T = any>(res: AxiosResponse<ResponseData>): Promise<T> => {
    if (res.data.code === 200) {
      return Promise.resolve(res.data.data);
    }
    return Promise.reject(new Error(res.data.message || '请求失败，请重试'));
  },
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/user/login';
      return;
    }
    Promise.reject(
      new Error(err?.response?.statusText || '服务器错误，请重试'),
    );
  },
);

service.interceptors.request.use((config) => {
  const token = localStorage?.getItem('token');
  config.headers.Authorization = 'Bearer ' + token;
  config.baseURL = process.env.API_URL;
  return config;
});
