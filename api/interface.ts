export interface IUser {
  account: string;
  password: string;
}

export interface IUserInfo {
  id: number;
  account: string;
  password: string;
  name: string;
  role: string;
  createTime: Date;
  updateTime: Date;
}

