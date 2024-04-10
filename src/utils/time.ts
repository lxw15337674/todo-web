export function calculateDaysDifference(
  startDate: string,
  endDate: string,
): number {
  const oneDay: number = 24 * 60 * 60 * 1000; // 一天的毫秒数

  // 将日期字符串转换为日期对象
  const start: Date = new Date(startDate);
  const end: Date = new Date(endDate);

  // 计算两个日期之间的天数差
  const diffDays: number = Math.round(
    Math.abs((start.getTime() - end.getTime()) / oneDay),
  );

  return diffDays + 1;
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

export const { daysToLive, percentage } = lifeStats('1994-11-08', 70);

export const getTime = () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][
    new Date().getDay()
  ];
  const passdays = Math.floor(
    (+new Date() - +new Date(year, 0, 0)) / (1000 * 60 * 60 * 24),
  );
  const passhours = Math.floor(
    (+new Date() - +new Date(year, 0, 0)) / (1000 * 60 * 60),
  );
  const salaryday1 = lastDayOfMonth - day;
  const salaryday5 = day <= 5 ? 5 - day : lastDayOfMonth - day + 5;
  const salaryday10 = day <= 10 ? 10 - day : lastDayOfMonth - day + 10;
  const salaryday12 = day <= 12 ? 12 - day : lastDayOfMonth - day + 12;
  const salaryday15 = day <= 15 ? 15 - day : lastDayOfMonth - day + 15;
  const salaryday20 = day <= 20 ? 20 - day : lastDayOfMonth - day + 20;
  const day_to_weekend = 6 - new Date().getDay();
  return {
    year,
    month,
    day,
    weekday,
    passdays,
    passhours,
    salaryday1,
    salaryday5,
    salaryday12,
    salaryday10,
    salaryday15,
    salaryday20,
    day_to_weekend,
  };
};

export const {
  daysUntilEndOfWeek,
  percentageCompletedOfWeek,
  daysUntilEndOfMonth,
  percentageCompletedOfMonth,
  daysUntilEndOfYear,
  percentageCompletedOfYear,
} = daysAndPercentageRemaining();

// 计算距离下一个假期的间隔天数, 传入假期日期,如果假期已经过去, 返回-1，否则返回间隔天数
export const calculateRestDays = (dateString: string) => {
  const date = new Date(dateString);
  const currentTime = new Date().getTime();
  const targetTime = date.getTime();
  const difference = targetTime - currentTime + 1000 * 60 * 60 * 24;
  if (difference <= 0) {
    return -1;
  }
  return Math.floor(difference / 1000 / 60 / 60 / 24);
};
