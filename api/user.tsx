import axios from 'axios';

interface IUser {
  account: string;
  password: string;
}

export function userLogin(user: IUser): Promise<any> {
  return axios
    .post('http://localhost:6060/api/user/login', user)
    .then((res) => {
      console.log('data', res);
      return res;
    });
}

export function getUserInfo(): Promise<any> {
  return axios
    .get('http://localhost:6060/api/user/getInfo')
    .then((res) => {
      return res;
    })
    .catch((res) => {
      console.log(res);
    });
}
