import React, { useState, useEffect } from 'react';

interface Props {
  targetTime: number;
}
const calculateRemainingTime = (targetTime: number) => {
  const currentTime = new Date().getTime();
  const difference = targetTime - currentTime;

  if (difference <= 0) {
    // 倒计时已结束
    return 0;
  }

  // 将毫秒转换为秒，并向下取整
  return Math.floor(difference / 1000);
};
const Countdown = ({ targetTime }: Props) => {
  const [remainingTime, setRemainingTime] = useState(
    calculateRemainingTime(targetTime),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime(calculateRemainingTime(targetTime));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [targetTime]);

  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;
  return (
    <span>
      {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:
      {seconds.toString().padStart(2, '0')}
    </span>
  );
};

export default Countdown;
