import { addCount, resetCount } from '@/api/count/count';
import { CountMeta } from '@/api/count/interface';
import { StarBorder } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemButton,
  Paper,
  Rating,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { usePromise } from 'wwhooks';
import StarIcon from '@mui/icons-material/Star';
import { CountTypes } from './CountFormDialog';
import { useCountStore } from 'store/count';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';

interface Props {
  data: CountMeta;
}
const CountCard = ({ data }: Props) => {
  const { run, isLoading } = usePromise(() => addCount(data.id));
  const { run: reset, isLoading: resetLoading } = usePromise(() =>
    resetCount(data.id),
  );
  const [open, setOpen] = useState(false);
  const { setSelectCountId, setStore } = useCountStore((state) => ({
    setSelectCountId: state.setSelectCountId,
    setStore: state.setStore,
  }));

  return (
    <Paper className="border mr-2 h-full " elevation={1}>
      <Dialog
        maxWidth="xs"
        TransitionProps={{
          onEntering: () => {
            setOpen(true);
          },
        }}
        open={open}
      >
        <DialogTitle>确定重置</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>重置后将清空计数</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={() => {
              setOpen(false);
            }}
          >
            取消
          </Button>
          <Button
            color="error"
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            重置
          </Button>
        </DialogActions>
      </Dialog>
      <ListItemButton
        className="overflow-hidden w-full p-0 h-full"
        onClick={() => {
          run();
        }}
      >
        <div className="w-full h-full flex flex-col">
          <div className="px-2 py-2 flex">
            <div title={data.name} className="truncate text-black  flex-1">
              {data.name}
            </div>
            <LoadingButton
              loading={isLoading || resetLoading}
              className="w-[30px]"
            />
          </div>
          <Divider />
          <div className="px-2 py-2 text-[#00000073] flex-1">
            <Typography variant="subtitle1" className="truncate text-black ">
              累计{data.counts.length}次
            </Typography>
            <Typography
              variant="subtitle1"
              title={CountTypes.find((v) => v.key === data.type)?.name}
              className="truncate text-black "
            >
              {CountTypes.find((v) => v.key === data.type)?.name}
            </Typography>
            <Typography
              variant="body2"
              title={dayjs(data.updateTime).format('YYYY-MM-DD HH:mm:ss')}
              className="truncate "
            >
              {dayjs(data.updateTime).format('YYYY-MM-DD HH:mm:ss')}
            </Typography>

            <Typography title={data.remark} variant="body2">
              {data?.remark === '' ? '无备注' : data.remark}
            </Typography>
            <Rating
              className="mt-2"
              readOnly
              icon={
                <StarIcon
                  sx={{
                    color: '#2564cf',
                  }}
                />
              }
              emptyIcon={
                <StarBorder
                  sx={{
                    color: '#2564cf',
                  }}
                />
              }
              defaultValue={2}
              max={5}
            />
          </div>
          <Divider />
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ButtonGroup variant="text">
              {data.counts.length > 0 && (
                <IconButton
                  className="border-0"
                  onClick={() => {
                    setOpen(true);
                  }}
                  color="warning"
                >
                  <RestartAltIcon />
                </IconButton>
              )}
              <IconButton
                className="border-0"
                color="info"
                onClick={() => {
                  setStore({
                    editCountId: data.id,
                    editFormVisible: true,
                  });
                }}
              >
                <EditIcon />
              </IconButton>
              {data.counts.length > 0 && (
                <IconButton
                  className="border-0"
                  onClick={() => {
                    setSelectCountId(data.id);
                  }}
                  color="success"
                >
                  <BarChartIcon />
                </IconButton>
              )}
            </ButtonGroup>
          </div>
        </div>
      </ListItemButton>
    </Paper>
  );
};
export default CountCard;
