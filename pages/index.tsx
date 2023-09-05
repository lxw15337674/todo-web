import { useSession } from 'next-auth/react';
import Layout from '../components/layout';
import { useRouter } from 'next/router';
import { useMount } from 'wwhooks';

export default function IndexPage() {
  return (
    <Layout>
      <h1>NextAuth.js Example</h1>
      <p>
        This is an example site to demonstrate how to use{' '}
        <a href="https://next-auth.js.org">NextAuth.js</a> for authentication.
      </p>
    </Layout>
  );
}
