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
import { Progress } from 'antd';

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
function daysAndPercentageRemaining(): {
  daysUntilEndOfWeek: number;
  percentageCompletedOfWeek: number;
  daysUntilEndOfMonth: number;
  percentageCompletedOfMonth: number;
  daysUntilEndOfYear: number;
  percentageCompletedOfYear: number;
} {
  // 获取当前日期
  const now = new Date();

  // 获取本周结束日期
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  // 计算距离本周结束的天数和百分比
  const daysUntilEndOfWeek = Math.floor(
    (endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const percentageCompletedOfWeek = Math.round(
    ((7 - daysUntilEndOfWeek) / 7) * 100,
  );

  // 获取本月结束日期
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);

  // 计算距离本月结束的天数和百分比
  const daysUntilEndOfMonth = Math.floor(
    (endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const percentageCompletedOfMonth = Math.round(
    ((endOfMonth.getDate() - daysUntilEndOfMonth) / endOfMonth.getDate()) * 100,
  );

  // 获取本年结束日期
  // 距离本年结束的天数
  const today = new Date();
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  const diffTime = Math.abs(endOfYear.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const daysUntilEndOfYear = Math.floor(diffDays);
  const year = today.getFullYear();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInYear = isLeapYear ? 366 : 365;
  // 已经过去的百分比
  const percentageCompletedOfYear = Math.round(
    ((daysInYear - daysUntilEndOfYear) / daysInYear) * 100,
  );
  return {
    daysUntilEndOfWeek,
    percentageCompletedOfWeek,
    daysUntilEndOfMonth,
    percentageCompletedOfMonth,
    daysUntilEndOfYear,
    percentageCompletedOfYear,
  };
}
function lifeStats(birthDate: string, lifeExpectancy: number) {
  // 将出生日期转换为时间戳
  const birthDateTimestamp = new Date(birthDate).getTime();

  // 计算出生以来经过的天数
  const daysSinceBirth = Math.floor(
    (Date.now() - birthDateTimestamp) / (1000 * 60 * 60 * 24),
  );

  // 计算剩余寿命的天数
  const daysToLive = Math.floor(lifeExpectancy * 365.25 - daysSinceBirth);

  // 计算百分比
  const percentage = Math.round(
    (daysSinceBirth / (lifeExpectancy * 365.25)) * 100,
  );

  return { daysToLive, percentage };
}

const { daysToLive, percentage } = lifeStats('1994-11-08', 70);
// 示例用法
const {
  daysUntilEndOfWeek,
  percentageCompletedOfWeek,
  daysUntilEndOfMonth,
  percentageCompletedOfMonth,
  daysUntilEndOfYear,
  percentageCompletedOfYear,
} = daysAndPercentageRemaining();
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
              今年已经过去 {data.passdays} 天，共{data.passhours} 小时
            </p>
          </div>
          <div className="m-2">
            <h1 className="text-lg">【下班】</h1>
            <ul>
              <li>
                距离【7点下班】：
                <Countdown targetTime={new Date().setHours(19, 0, 0, 0)} />
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
            <h1 className="text-lg">【倒计时】</h1>
            <ul>
              <div className="w-100">
                <li>距离【本周结束】还有 {daysUntilEndOfWeek} 天</li>
                <Progress percent={percentageCompletedOfWeek} />
                <li>距离【本月结束】还有 {daysUntilEndOfMonth} 天</li>
                <Progress percent={percentageCompletedOfMonth} />
                <li>距离【本年结束】还有 {daysUntilEndOfYear} 天</li>
                <Progress percent={percentageCompletedOfYear} />
                <li>距离【70岁结束】还有 {daysToLive} 天</li>
                <Progress percent={percentage} />
              </div>
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
