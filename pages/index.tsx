import Layout from 'src/components/layout';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Box, CircularProgress } from '@mui/material';

export default function IndexPage() {
  //  自动重定向到todo
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    if (session?.accessToken && status === 'authenticated') {
      localStorage.setItem('token', session?.accessToken);
    }
    if (localStorage.getItem('token')) {
      router.push('/counter');
    }
  }, [session]);
  return (
    <Layout>
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    </Layout>
  );
}
