import Layout from '@/components/layout';
import React, { useMemo } from 'react';
import { usePromise } from 'wwhooks';
import { englishToday, holiday, todayInHistory } from '@/api/fishingTime';
import Countdown from './Countdown';
import { Progress } from 'antd';
import {
  daysUntilEndOfWeek,
  percentageCompletedOfWeek,
  daysUntilEndOfMonth,
  percentageCompletedOfMonth,
  daysUntilEndOfYear,
  percentageCompletedOfYear,
  daysToLive,
  percentage,
  calculateDaysDifference,
  calculateRestDays,
  getTime,
} from '@/utils/time';
import NoSSR from '@/components/NoSSR';

const Chat = () => {
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

  const fishingTime = useMemo(() => getTime(), []);

  return (
    <Layout>
      <div>
        <div className="[&_>p]:text-base">
          <div className="m-2">
            <h1 className="text-lg">【摸鱼办】提醒您:</h1>
            <p>
              今天是 {fishingTime.year}年{fishingTime.month}月{fishingTime.day}
              日, 星期{fishingTime.weekday}。
            </p>
          </div>
          <div className="m-2">
            <h1 className="text-lg">【下班】</h1>
            <ul>
              <li>
                距离【6点下班】：
                <NoSSR>
                  <Countdown targetTime={new Date().setHours(18, 0, 0, 0)} />
                </NoSSR>
              </li>
            </ul>
          </div>
          <div className="m-2">
            <h1 className="text-lg">【工资】</h1>
            <ul>
              <li>距离【20号发工资】: {fishingTime.salaryday20} 天</li>
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
              <li>距离【周六】还有 {fishingTime.day_to_weekend} 天</li>
              {nextHolidayData?.map((item, index) => {
                const restDays = calculateRestDays(item.holiday);
                if (restDays < 0) {
                  return null;
                }
                if (!item.start || !item.end) {
                  return (
                    <li key={index}>
                      距离【{item.name}】还有 {restDays} 天。
                    </li>
                  );
                }
                return (
                  <li key={index}>
                    距离【{item.name}】还有 {restDays} 天。
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
