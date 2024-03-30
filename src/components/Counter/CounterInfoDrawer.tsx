import {
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import React, { Fragment, useEffect, useMemo } from 'react';
import { useCountStore } from '../../../store/counter';
import Calendar from './Calendar';
import { useObject, usePromise } from 'wwhooks';
import dayjs from 'dayjs';
import { getTypeCounts, removeCounter } from '@/api/counter';

interface State {
  selectedDate: dayjs.Dayjs;
}

const CountInfoDrawer = () => {
  const { setSelectCountId, selectedCountId, selectedCount } = useCountStore(
    (state) => ({
      setSelectCountId: state.setSelectCountId,
      selectedCountId: state.selectedCountId,
      selectedCount: state.selectedCount,
    }),
  );
  const { data: counts, run } = usePromise(
    () => getTypeCounts(selectedCountId!),
    {
      initialData: [],
    },
  );

  const [state, setState] = useObject<State>({
    // 默认为今天
    selectedDate: dayjs(),
  });

  const filteredCounts = useMemo(() => {
    return (
      counts.filter((count) => {
        return dayjs(count.createTime).isSame(state.selectedDate, 'day');
      }) ?? []
    );
  }, [counts, state.selectedDate]);

  useEffect(() => {
    setState({ selectedDate: dayjs() });
  }, [setSelectCountId]);

  useEffect(() => {
    if (selectedCountId) {
      run();
    }
  }, [selectedCountId]);

  return (
    <SwipeableDrawer
      anchor={'right'}
      open={!!selectedCountId}
      onClose={() => {
        setSelectCountId('');
      }}
      onOpen={() => {}}
    >
      <>
        <List className="flex flex-col h-full">
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="h6" color={'primary'} className="strong">
                  {selectedCount?.name}
                </Typography>
              }
            />
          </ListItem>
          <Divider />
          <ListItem>
            <Calendar
              value={state.selectedDate}
              onChange={(date) => {
                setState({ selectedDate: date ?? undefined });
              }}
              selectedDate={counts.map((count) => count.createTime) ?? []}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              color="primary"
              primary={`${state.selectedDate.format('YYYY-MM-DD')} 统计`}
            />
          </ListItem>
          <div className="overflow-auto flex-1">
            {filteredCounts?.map((count, index) => {
              return (
                <Fragment key={count.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <div className="flex justify-between">
                          <div>
                            {dayjs(count.createTime).format('HH:mm:ss')}
                          </div>
                          <span className="text-[#00000073]">
                            第{filteredCounts.length - index}次
                          </span>
                          <Button
                            onClick={() =>
                              removeCounter(count.id).then(() => {
                                run();
                              })
                            }
                            size="small"
                          >
                            删除
                          </Button>
                        </div>
                      }
                    />
                  </ListItem>
                  <Divider />
                </Fragment>
              );
            })}
          </div>
        </List>
      </>
    </SwipeableDrawer>
  );
};
export default CountInfoDrawer;
