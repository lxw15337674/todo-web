import Layout from '@/components/layout';
import axios from 'axios';
import React from 'react';
import { usePromise } from 'wwhooks';
import Markdown from 'react-markdown';

const Chat = () => {
  const { data } = usePromise(() => axios.get(`/moyu`), {
    manual: false,
    initialData: '',
  });
  return (
    <Layout>
      <div style={{ margin: '10px' }}>
        <Markdown>{data?.data}</Markdown>
      </div>
    </Layout>
  );
};
export default Chat;
