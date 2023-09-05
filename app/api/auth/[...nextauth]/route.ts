import NextAuth, { DefaultSession } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserInfo } from 'api/user';
import { IUserInfo } from 'api/interface';

export const handler = NextAuth({
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
      httpOptions: {
        timeout: 10000,
      },
    }),
    CredentialsProvider({
      // 登录按钮显示 (e.g. "Sign in with Credentials")
      name: 'Credentials',
      credentials: {
        token: { label: 'Token', type: 'text', placeholder: 'Token' },
      },
      async authorize(credentials) {
        const user = await getUserInfo(credentials?.token ?? '');
        if (user) {
          // 返回的对象将保存才JWT 的用户属性中
          return {
            name: user.name,
            email: user.account,
            image: '',
            id: '',
            token: credentials?.token ?? '',
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
  jwt: {
    secret: 'test',
  },
  pages: {
    signIn: '/user/login',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      return { ...token, ...user };
    },
    session: async ({ session }) => {
      return session;
    },
  },
});

export { handler as GET, handler as POST };
