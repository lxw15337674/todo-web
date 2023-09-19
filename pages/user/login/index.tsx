import { Button, Form, Input } from 'antd';
import { IUser } from 'api/interface';
import { getUserInfo, userLogin } from 'api/user';
import { signIn } from 'next-auth/react';
import React from 'react';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getCsrfToken } from "next-auth/react"

const Login = () => {
  return (
    <div className="flex-center bg-[#f3f3f3] h-full">
      <div className="px-10 py-14 bg-white w-[400px]">
        <Form<IUser>
          name="basic"
          layout="vertical"
          autoComplete="off"
          action={'/api/auth/callback/credentials'}
          onFinish={(values) => {
            userLogin(values).then((token) => {
              getUserInfo(token ?? '').then((user) => {
                signIn('credentials', { ...user, callbackUrl: '/' });
              })
            });
          }}
        >
          <Form.Item
            label="Account"
            name="account"
            rules={[{ required: true, message: 'Please input your account!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              className=" bg-[#4096ff] w-full "
              htmlType="submit"
            >
              Sigin in
            </Button>
          </Form.Item>
        </Form>
        <button
          className="w-full bg-black text-white h-10 text-sm"
          onClick={() => {
            signIn('github', { callbackUrl: '/' });
          }}
        >
          Sign in with Github
        </button>
      </div>
    </div>
  );
};

export default Login;