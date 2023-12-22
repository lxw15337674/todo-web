import React, { useMemo } from 'react';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { Badge } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  DateCalendar,
  DateCalendarProps,
} from '@mui/x-date-pickers/DateCalendar';

const isTimeInDay = (time: Date, day: Dayjs) => {
  const timeObj = dayjs(time);
  return timeObj.isSame(day, 'day');
};

function ServerDay(props: PickersDayProps<Dayjs> & { selectedDate?: Date[] }) {
  const { selectedDate = [], day, outsideCurrentMonth, ...other } = props;
  const selectedTime = useMemo(() => {
    return selectedDate.filter((item) => isTimeInDay(item, props.day));
  }, [props.day, selectedDate]);

  return (
    <Badge
      overlap="circular"
      badgeContent={selectedTime.length}
      color="success"
    >
      <PickersDay
        {...other}
        key={props.day.toString()}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>
  );
}

interface Props extends DateCalendarProps<Dayjs> {
  selectedDate: Date[];
}

function Calendar({ selectedDate, ...props }: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        {...props}
        slotProps={{
          day: {
            selectedDate,
          } as any,
        }}
        slots={{
          day: ServerDay,
        }}
      />
    </LocalizationProvider>
  );
}

export default Calendar;
