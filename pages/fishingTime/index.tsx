import Layout from '@/components/layout';
import React from 'react';
import { usePromise } from 'wwhooks';
import { getFishingTime, todayInHistory } from '@/api/fishingTime';

function dateParse(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 月份从 0 开始，所以要加 1
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

const Chat = () => {
  const { data, isLoading } = usePromise(getFishingTime, {
    manual: false,
  });
  const { data: todayInHistoryData } = usePromise(todayInHistory, {
    manual: false,
    initialData: [],
  });
  if (isLoading || !data) return <div>loading...</div>;
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
            <h1 className="text-lg">【工资】</h1>
            <ul>
              <li>距离【05号发工资】: {data.salaryday5} 天</li>
              <li>距离【09号发工资】: {data.salaryday9} 天</li>
              <li>距离【15号发工资】: {data.salaryday15} 天</li>
              <li>距离【20号发工资】: {data.salaryday20} 天</li>
              <li>距离【月底发工资】: {data.salaryday1} 天</li>
            </ul>
          </div>
          <div className="m-2">
            <h1 className="text-lg">【假期】</h1>
            <ul>
              <li>距离【周六】还有 {data.day_to_weekend} 天</li>
              <li>
                距离下一个法定节假日【{data.nextHoliday.name}】
                {dateParse(data.nextHolidayDate)}，还有 {data.nextHoliday.rest}{' '}
                天
              </li>
            </ul>
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
      </div>
    </Layout>
  );
};
export default Chat;
