import { IUser, IUserInfo } from './interface';
import { service } from './index';
import axios from 'axios';

export function userLogin(user: IUser): Promise<string> {
  return service
    .post('http://localhost:6060/api/user/login', user)
    .then((token) => {
      // 保存token到localStorage
      if (token) {
        localStorage.setItem('token', token);
      }
      return token;
    });
}

export function getUserInfo(token: string): Promise<IUserInfo> {
  return axios
    .get('http://localhost:6060/api/user/getInfo', {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
    .then((res) => {
      return res.data.data;
    });
}
