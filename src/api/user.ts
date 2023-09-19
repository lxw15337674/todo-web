import { IUser, IUserInfo } from './interface';
import { service } from './index';
import axios from 'axios';

export function userLogin(user: IUser): Promise<string> {
  return service.post('/user/login', user).then((token) => {
    // 保存token到localStorage
    if (token) {
      localStorage.setItem('token', token);
    }
    return token;
  });
}

export function getUserInfo(token: string): Promise<IUserInfo> {
  // 这个地方的token是从credentials中获取的
  return axios
    .get(`${process.env.API_URL}/user/getInfo`, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
    .then((res) => {
      return res.data.data;
    });
}

// export function registerUser(user: IUser): Promise<string> {
//   return service.post('/user/register', user).then((token) => {
//     // 保存token到localStorage
//     if (token) {
//       localStorage.setItem('token', token);
//     }
//     return token;
//   });
// }

export interface OauthUser {
  email: string;
  name: string;
}

export function oauthUser(user: OauthUser): Promise<string> {
  return service.post('/user/register', user).then((token) => {
    // 保存token到localStorage
    if (token) {
      localStorage.setItem('token', token);
    }
    return token;
  });
}
