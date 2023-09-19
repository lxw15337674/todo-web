import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

// https://next-auth.js.org/configuration/initialization#simple-initialization
export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
      httpOptions: {
        timeout: 50000,
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        name: { label: 'name', type: 'text' },
        account: { label: 'Account', type: 'text' },
        id: { label: 'id', type: 'text' },
      },
      async authorize(credentials) {
        if (credentials?.name) {
          // 返回的对象将保存才JWT 的用户属性中
          return {
            name: credentials.name,
            email: credentials.account,
            image: '',
            id: credentials.id,
          };
        } else {
          // 跳转到错误页面，并且携带错误信息 http://localhost:3000/api/auth/error?error=用户名或密码错误
          throw new Error('用户名或密码错误');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/user/login',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      console.log('jwt');
      return { ...token, ...user };
    },
    // signIn: async (info: any) => {
    //   console.log('signIn');
    //   await oauthUser({
    //     email: info.email,
    //     name: info.name,
    //   });
    //   return true;
    // },
  },
};

export default NextAuth(authOptions);
