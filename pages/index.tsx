import Layout from 'src/components/layout';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function IndexPage() {
  //  自动重定向到todo
  const router = useRouter();
  useEffect(() => {
    router.push('/todo');
  }, [router]);
  return <Layout>首頁</Layout>;
}
