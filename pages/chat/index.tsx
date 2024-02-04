import Layout from '@/components/layout';
import { Button, Input } from '@mui/material';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useArray } from 'wwhooks';

const Chat = () => {
  const ws = useRef<Socket | null>(null);
  const [messages, action] = useArray<string>([]);
  const [text, setText] = useState<string>('');
  const sendMessage = () => {
    action.push(text);
    ws.current?.emit('findAllChatSocket', text);
  };
  //启动
  useLayoutEffect(() => {
    if (ws.current) {
      return;
    }
    ws.current = io('http://localhost:6060');
    const socket = ws.current;
    socket.on('connect', function () {
      console.log('connect');
    });
    socket.on('message', (data: string) => {
      action.push(data);
    });
  }, [ws]);

  return (
    <Layout>
      聊天室
      <div>
        <Input
          onChange={(e) => {
            setText(e.target.value);
          }}
        ></Input>
        <Button onClick={sendMessage}>提交</Button>
        <div>
          消息：
          {messages.map((item, index) => {
            return <div key={index}>{item}</div>;
          })}
        </div>
      </div>
    </Layout>
  );
};
export default Chat;
