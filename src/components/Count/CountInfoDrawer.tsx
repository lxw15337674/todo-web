import {
  Divider,
  List,
  ListItem,
  ListItemText,
  SwipeableDrawer,
} from '@mui/material';
import React, { Fragment } from 'react';
import { formatDate } from '../../utils/date';
import { useCountStore } from '../../../store/count';

const CountInfoDrawer = () => {
  const { setSelectCountId, selectedCountId, selectedCount } = useCountStore(
    (state) => ({
      setSelectCountId: state.setSelectCountId,
      selectedCountId: state.selectedCountId,
      selectedCount: state.selectedCount,
    }),
  );

  return (
    <SwipeableDrawer
      anchor={'right'}
      open={!!selectedCountId}
      onClose={() => {
        setSelectCountId('');
      }}
      onOpen={() => {}}
    >
      <List sx={{ bgcolor: 'background.paper' }}>
        {selectedCount?.counts.map((count, index) => {
          return (
            <Fragment key={count.id}>
              <ListItem>
                <ListItemText
                  primary={formatDate(count.createTime)}
                  secondary={`第${index + 1}次`}
                />
              </ListItem>
              <Divider />
            </Fragment>
          );
        })}
      </List>
    </SwipeableDrawer>
  );
};
export default CountInfoDrawer;
