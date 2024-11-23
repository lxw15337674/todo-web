import { Avatar, Badge, List, Typography } from 'antd';
import { HotType } from '@/public/app/dailyhot/page';
import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
const { Text } = Typography;

interface Props {
  data: HotType;
}

const textColor = ['#ea444d', '#ed702d', '#eead3f'];

const DailyHotCard = ({ data }: Props) => {
  const [imageExists, setImageExists] = useState(true);
  useEffect(() => {
    const img = new window.Image();
    img.src = `/logo/${data.name}.png`;
    img.onload = () => setImageExists(true);
    img.onerror = () => setImageExists(false);
  }, [data.name]);

  const date = useMemo(() => {
    if (!data.updateTime) {
      return '';
    }
    const date = new Date(data.updateTime);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }, [data.updateTime]);
  return (
    <List
      header={
        <div className="flex justify-between  items-center">
          <div className="flex items-center">
            {imageExists && (
              <Avatar
                src={
                  <Image
                    src={`/logo/${data.name}.png`}
                    alt="avatar"
                    width={30}
                    height={30}
                  />
                }
              />
            )}
            <Typography.Title level={5} style={{ margin: '0 5px' }}>
              {data?.label}
            </Typography.Title>
          </div>
          <Typography.Title level={5} className="mb-0 mr-[15px]">
            {data?.subtitle}
          </Typography.Title>
        </div>
      }
      footer={
        data.children.length > 0 && (
          <div className="text-right">更新时间：{date}</div>
        )
      }
      itemLayout="horizontal"
      dataSource={data.children}
      bordered
      size="small"
      className="h-full  [&_.ant-list-items]:scroll-container   [&_.ant-list-items]:h-[22rem] w-full"
      loading={data.children.length === 0}
      renderItem={(item, index) => (
        <List.Item className="justify-start ">
          <Badge count={index + 1} color={textColor[index] ?? '#bfbfbf'} />
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base mx-2 cursor-pointer hover:text-primary flex-1 visited:text-purple-800 truncate"
            title={item.title}
          >
            {item.title}
          </a>
          <Text className="ml-auto" title={item.hot?.toString()}>
            {item.hot}
          </Text>
        </List.Item>
      )}
    />
  );
};
export default DailyHotCard;
