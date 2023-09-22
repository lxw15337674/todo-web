import dayjs from 'dayjs';

export const formatDate = (
  time: string | number | Date | dayjs.Dayjs | null | undefined,
) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};
