import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { userLogin } from 'api/user';

export const handler = NextAuth({
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    CredentialsProvider({
      // 登录按钮显示 (e.g. "Sign in with Credentials")
      name: 'Credentials',
      // credentials 用于配置登录页面的表单
      credentials: {
        email: {
          label: '用户名',
          type: 'text',
          placeholder: '请输入用户型',
        },
        password: {
          label: '密码',
          type: 'password',
          placeholder: '请输入密码',
        },
      },
      async authorize(credentials) {
        const user = await userLogin({
          account: credentials?.email ?? '',
          password: credentials?.password ?? '',
        });
        
        if (user) {
          // 返回的对象将保存才JWT 的用户属性中
          return user;
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
  // debug: true,
  callbacks: {
    async jwt({ token, user }) {
      // first call of jwt function just user object is provided
      if (user?.email) {
        return { ...token, ...user };
      }

      // on subsequent calls, token is provided and we need to check if it's expired
      if (token?.accessTokenExpires) {
        return { ...token, ...user };
      }

      return { ...token, ...user };
    },

    async session({ session, token }) {
      // the token object is what returned from the `jwt` callback, it has the `accessToken` that we assigned before
      // Assign the accessToken to the `session` object, so it will be available on our app through `useSession` hooks
      if (token) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
