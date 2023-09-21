import dayjs from 'dayjs';

export const formatDate = (time: string | Date) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};
