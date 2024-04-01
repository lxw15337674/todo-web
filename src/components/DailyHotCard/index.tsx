import { Avatar, Badge, List, Typography } from 'antd';
import React, { useMemo } from 'react';
import { HotType } from 'store/dailyhot';
const { Text } = Typography;

interface Props {
  data: HotType;
}

const textColor = ['#ea444d', '#ed702d', '#eead3f'];

const DailyHotCard = ({ data }: Props) => {
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
            <Avatar src={<img src={`logo/${data.name}.png`} />} />
            <Typography.Title level={5} style={{ margin: '0 5px' }}>
              {data?.label}
            </Typography.Title>
          </div>
          <Typography.Title level={5} style={{ marginRight: 15 }}>
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
      className="h-full  [&_.ant-list-items]:scroll-container   [&_.ant-list-items]:h-[16rem]"
      loading={data.children.length === 0}
      renderItem={(item, index) => (
        <List.Item className="justify-start ">
          <Badge count={index + 1} color={textColor[index] ?? '#bfbfbf'} />
          <Text
            ellipsis={true}
            className="text-base mx-2 cursor-pointer hover:text-primary flex-1"
            title={item.title}
            onClick={() => {
              window.open(item.url);
            }}
          >
            {item.title}
          </Text>
          <Text className="ml-auto" title={item.hot?.toString()}>
            {item.hot}
          </Text>
        </List.Item>
      )}
    />
  );
};
export default DailyHotCard;
