import { addCount, removeCount, resetCount } from '@/api/counter';
import { CountMeta } from '@/api/counter/interface';
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
  Paper,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { usePromise } from 'wwhooks';
import { CountTypes } from './CounterFormDialog';
import { useCountStore } from 'store/counter';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';
interface Props {
  data: CountMeta;
}
const CountCard = ({ data }: Props) => {
  const { run, isLoading } = usePromise(() => addCount(data.id));
  const { run: reset, isLoading: resetLoading } = usePromise(() =>
    resetCount(data.id),
  );
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
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
      <Dialog
        maxWidth="xs"
        TransitionProps={{
          onEntering: () => {
            setOpenDelete(true);
          },
        }}
        open={openDelete}
      >
        <DialogTitle>确定删除</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>删除后无法恢复</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={() => {
              setOpenDelete(false);
            }}
          >
            取消
          </Button>
          <Button
            color="error"
            onClick={() => {
              removeCount(data.id);
              setOpenDelete(false);
            }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
      <div className="overflow-hidden p-0 h-full">
        <div className="w-full h-full flex flex-col">
          <Button
            className=" px-2 py-2 block"
            onClick={() => {
              run();
            }}
          >
            <div className="flex w-[45vw] text-left">
              <span title={data.name} className="truncate text-black flex-1">
                {data.name}
              </span>
              <LoadingButton
                loading={isLoading || resetLoading}
                className="w-[20px] "
              />
            </div>
            <Divider />
            <div className=" py-2 text-[#00000073] block text-left">
              <Typography variant="subtitle1" className="truncate text-black ">
                累计{data.count}次
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
            </div>
          </Button>
          <Divider />
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ButtonGroup variant="text">
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
              <IconButton
                className="border-0"
                color="error"
                onClick={() => {
                  setOpenDelete(true);
                }}
              >
                <DeleteIcon />
              </IconButton>
              {data.count > 0 && (
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
              {data.count > 0 && (
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
            </ButtonGroup>
          </div>
        </div>
      </div>
    </Paper>
  );
};
export default CountCard;
