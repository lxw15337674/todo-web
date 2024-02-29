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
      <div style={{ margin: '20px' }}>
        <ReactMarkdown className="[&_*]:whitespace-pre-wrap break-words">
          {data}
        </ReactMarkdown>
      </div>
    </Layout>
  );
};
export default Chat;
