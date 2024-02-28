import Layout from '@/components/layout';
import React from 'react';
import { usePromise } from 'wwhooks';
import ReactMarkdown from 'react-markdown';
import { getFishingTime } from '@/api/fishingTime';

const Chat = () => {
  const { data } = usePromise(getFishingTime, {
    manual: false,
    initialData: '',
  });
  return (
    <Layout>
      <div style={{ margin: '10px' }}>
        <ReactMarkdown>{data}</ReactMarkdown>
      </div>
    </Layout>
  );
};
export default Chat;
