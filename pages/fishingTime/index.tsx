import Layout from '@/components/layout';
import React from 'react';
import { usePromise } from 'wwhooks';
import {
  englishToday,
  getFishingTime,
  holiday,
  todayInHistory,
} from '@/api/fishingTime';
import Countdown from './Countdown';

// function dateParse(dateString: string) {
//   const date = new Date(dateString);
//   const year = date.getFullYear();
//   const month = date.getMonth() + 1; // 月份从 0 开始，所以要加 1
//   const day = date.getDate();
//   return `${year}年${month}月${day}日`;
// }

// 计算距离下一个假期的间隔天数, 传入假期日期,如果假期已经过去, 返回-1，否则返回间隔天数
const calculateRestDays = (dateString: string) => {
  const date = new Date(dateString);
  const currentTime = new Date().getTime();
  const targetTime = date.getTime();
  const difference = targetTime - currentTime;
  if (difference <= 0) {
    return -1;
  }
  return Math.floor(difference / 1000 / 60 / 60 / 24);
};

function calculateDaysDifference(startDate: string, endDate: string): number {
  const oneDay: number = 24 * 60 * 60 * 1000; // 一天的毫秒数

  // 将日期字符串转换为日期对象
  const start: Date = new Date(startDate);
  const end: Date = new Date(endDate);

  // 计算两个日期之间的天数差
  const diffDays: number = Math.round(
    Math.abs((start.getTime() - end.getTime()) / oneDay),
  );

  return diffDays;
}

const Chat = () => {
  const { data, isLoading } = usePromise(getFishingTime, {
    manual: false,
  });
  const { data: todayInHistoryData } = usePromise(todayInHistory, {
    manual: false,
    initialData: [],
  });
  const { data: englishTodayData } = usePromise(englishToday, {
    manual: false,
  });
  const { data: nextHolidayData } = usePromise(holiday, {
    manual: false,
  });

  if (isLoading || !data)
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  return (
    <Layout>
      <div>
        <div className="[&_>p]:text-base">
          <div className="m-2">
            <h1 className="text-lg">【摸鱼办】提醒您:</h1>
            <p>
              今天是 {data.year}年{data.month}月{data.day}日, 星期{data.weekday}
              。
            </p>
            <p>
              今年已经过去 {data.passdays} 天 {data.passhours} 小时。
            </p>
            <p>你好, 摸鱼人！工作再忙, 一定不要忘记摸鱼哦！</p>
            <p>
              有事没事起身去茶水间, 去厕所, 去走廊走走,
              去找同事聊聊八卦别老在工位上坐着, 钱是老板的但命是自己的。
            </p>
          </div>
          <div className="m-2">
            <h1 className="text-lg">【下班】</h1>
            <ul>
              <li>
                距离【6点下班】:{' '}
                <Countdown targetTime={new Date().setHours(18, 0, 0, 0)} />
              </li>
            </ul>
          </div>
          <div className="m-2">
            <h1 className="text-lg">【工资】</h1>
            <ul>
              <li>距离【09号发工资】: {data.salaryday9} 天</li>
              <li>距离【20号发工资】: {data.salaryday20} 天</li>
            </ul>
          </div>
          <div className="m-2">
            <h1 className="text-lg">【假期】</h1>
            <ul>
              <li>距离【周六】还有 {data.day_to_weekend} 天</li>
              {nextHolidayData?.map((item, index) => {
                const restDays = calculateRestDays(item.holiday);
                if (restDays < 0) {
                  return null;
                }
                if (!item.start || !item.end) {
                  return (
                    <li key={index}>
                      距离【{item.name}】，还有 {restDays} 天。
                    </li>
                  );
                }
                return (
                  <li key={index}>
                    距离【{item.name}】，还有 {restDays} 天。
                    {item.start} 至 {item.end} 放假调休, 共
                    {calculateDaysDifference(item.start, item.end)}天。
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【每日一句】</h1>
          <p>{englishTodayData?.content} </p>
          <p> {englishTodayData?.translation}</p>
          <h2></h2>
        </div>
      </div>
      <div className="m-2">
        <h1 className="text-lg">【历史上的今天】</h1>
        {todayInHistoryData.map((item, index) => {
          return (
            <div key={index}>
              {item.year}年：{item.title}
            </div>
          );
        })}
      </div>
    </Layout>
  );
};
export default Chat;
