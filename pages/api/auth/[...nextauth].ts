import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { oauthUser } from '@/api/user';

// https://next-auth.js.org/configuration/initialization#simple-initialization
export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
      httpOptions: {
        timeout: 40000,
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
  // debug: true,
  callbacks: {
    jwt: async (info) => {
      const { token, user } = info;
      return { ...token, ...user };
    },
    async session({ session, token }) {
      // console.log('session ', session, token, user);
      session.user.id = token.id as string;
      session.accessToken = token.accessToken as string;
      return session;
    },
    async signIn(user) {
      if (user.account?.type === 'credentials') {
        return true;
      }
      user.user.accessToken = await oauthUser(
        user.account?.access_token as string,
      );
      return true;
    },
  },
};

export default NextAuth(authOptions);
