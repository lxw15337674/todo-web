import { HotType } from '@/public/app/dailyhot/page';
import Image from 'next/image';
import React from 'react';
import dayjs from 'dayjs'; // 新增 dayjs 导入
import { Card } from '../../src/components/ui/card';
import { ScrollArea } from '../../src/components/ui/scroll-area';
import Link from 'next/link';

interface Props {
  data: HotType;
}
export const formatTime = (timestamp?: string) => {
  if (!timestamp) return ''
  const date = dayjs(timestamp);
  const now = dayjs();

  const diffInSeconds = now.diff(date, 'second');
  const diffInMinutes = now.diff(date, 'minute');
  const diffInHours = now.diff(date, 'hour');
  if (diffInSeconds < 60) {
    return "刚刚更新";
  } else if (diffInMinutes < 60) {
    const minutes = Math.floor(diffInMinutes);
    return `${minutes}分钟前更新`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours}小时前更新`;
  } else {
    return date.format('M月D日');
  }
};
const DailyHotCard = ({ data }: Props) => {
  const date = formatTime(data.updateTime)
  return (
    <Card className="w-full max-w-2xl bg-zinc-900 text-white">
      <div className="p-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Image
            src={`/logo/${data.name}.png`}
            alt="avatar"
            loading='lazy'
            width={24}
            height={24}
            style={{
              height: 24
            }}
          />
          <span className="font-bold ">{data.label}</span>
        </div>
      </div>
      <ScrollArea className="h-[410px]">
        <div className="divide-y divide-zinc-800">
          {data.children.map((topic, index) => (
            <div key={index} className="flex items-center gap-4 p-2 hover:bg-zinc-800/50 transition-colors">
              <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-zinc-400">{index}</span>
              </div>
              <Link
                href={topic.url}
                target="_blank"
                rel="noopener noreferrer"
                className=" min-w-0 text-base  cursor-pointer text-zinc-50 hover:text-blue-400 flex-1 visited:text-blue-600  w-32"

                title={topic.title}
              >
                {topic.title}
              </Link>
              <div className="text-sm text-zinc-400 shrink-0">{topic.hot}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-zinc-800">
        <p className="text-sm text-zinc-400 text-right">更新时间:{date}</p>
      </div>
    </Card>
  );
};
export default DailyHotCard;
