import {
  Autocomplete,
  Checkbox,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useTodoStore } from 'store/todo';
import dayjs from 'dayjs';
import {
  DateTimeField,
  DateTimePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useObject, usePromise } from 'wwhooks';
import { Task, TaskType } from 'api/todo/interface';
import { updateTask } from 'api/todo/task';
import AutoSelect from 'components/AutoSelect';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { createTaskType } from 'api/todo/taskType';

const PriorityTypes = ['重要紧急', '重要不紧急', '不重要紧急', '不重要不紧急'];

const TaskInfoDraw = () => {
  const { selectedTask, taskTypes } = useTodoStore();
  const [nextTodo, setNextTodo] = useObject<Task>({});
  const { run: updateTaskRes } = usePromise(
    (task: Task) =>
      updateTask({
        id: selectedTask?.id,
        ...task,
      }),
    {
      debounceInterval: 500,
    },
  );
  useEffect(() => {
    setNextTodo({
      title: selectedTask?.title,
      type: selectedTask?.type,
      priority: selectedTask?.priority,
      remark: selectedTask?.remark,
    });
  }, [selectedTask]);

  const types = useMemo(() => {
    return (
      (nextTodo?.type?.split(',') ?? [])
        ?.map((item) => {
          return taskTypes?.find((v) => v.id === item) as TaskType;
        })
        .filter((item) => !!item) ?? []
    );
  }, [nextTodo?.type, taskTypes]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="shadow-2xl ml-2 px-2 bg-slate-50 w-[300px]">
        <Divider />
        <List>
          {/* {Object.entries(selectedTask).map(([key, string], index) => (
          <ListItem key={text}>
            <ListItemIcon>123</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))} */}

          <ListItem disablePadding className=" bg-white mb-4">
            <IconButton
              onClick={() => {
                updateTaskRes({
                  status: selectedTask?.status === 'done' ? 'todo' : 'done',
                });
              }}
            >
              {selectedTask?.status === 'done' ? (
                <StarIcon
                  sx={{
                    color: '#2564cf',
                  }}
                />
              ) : (
                <StarBorderIcon
                  sx={{
                    color: '#2564cf',
                  }}
                />
              )}
            </IconButton>
            <ListItemText className="ml-4">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                id="standard-basic"
                variant="standard"
                value={nextTodo?.title}
                onChange={(e) => {
                  setNextTodo({
                    title: e.target.value,
                  });
                }}
                onBlur={() => {
                  updateTaskRes({
                    title: nextTodo.title,
                  });
                }}
              />
            </ListItemText>
          </ListItem>

          <ListItem disablePadding className=" bg-white mb-4">
            <AutoSelect<TaskType>
              multiple
              onAddOption={(v) => {
                return createTaskType(v);
              }}
              onChange={(value) => {
                setNextTodo({
                  type: value.map((v) => v.id).join(','),
                });
              }}
              disableCloseOnSelect
              value={types}
              onBlur={() => {
                updateTaskRes({
                  type: nextTodo.type,
                });
              }}
              options={taskTypes}
              label="类型"
            />
          </ListItem>

          <ListItem disablePadding className=" bg-white mb-4">
            <Autocomplete
              fullWidth
              size="small"
              value={nextTodo?.priority ?? undefined}
              onChange={(e, v) => {
                setNextTodo({
                  priority: v ?? '',
                });
              }}
              onBlur={() => {
                updateTaskRes({
                  priority: nextTodo.priority,
                });
              }}
              options={PriorityTypes}
              renderInput={(params) => <TextField {...params} label="优先级" />}
            />
          </ListItem>

          <ListItem disablePadding className=" bg-white mb-4">
            <TextField
              fullWidth
              label="备注"
              size="small"
              multiline
              rows={2}
              id="outlined-multiline-static"
              value={nextTodo?.remark ?? ''}
              onChange={(e) => {
                setNextTodo({
                  remark: e.target.value,
                });
              }}
              onBlur={() => {
                updateTaskRes({
                  remark: nextTodo.remark,
                });
              }}
            />
          </ListItem>
          {selectedTask?.finishTime && (
            <ListItem disablePadding className=" bg-white mb-4">
              <DateTimeField
                label="结束时间"
                value={dayjs(selectedTask?.finishTime ?? '')}
                size="small"
                fullWidth
                disabled
                readOnly
              />
            </ListItem>
          )}

          {/* <ListItem disablePadding className=" bg-white mb-4">
            <DateTimePicker
              label="截止时间"
              className={'w-full'}
              value={dayjs(selectedTask?.createTime)}
            />
          </ListItem> */}

          <ListItem disablePadding className=" bg-white mb-4">
            <DateTimeField
              label="创建时间"
              value={dayjs(selectedTask?.createTime)}
              size="small"
              fullWidth
              disabled
              readOnly
            />
          </ListItem>

          <ListItem disablePadding className=" bg-white mb-4">
            <DateTimeField
              label="更新时间"
              value={dayjs(selectedTask?.updateTime)}
              disabled
              readOnly
              fullWidth
              size="small"
            />
          </ListItem>
        </List>
        <Divider />
      </div>
    </LocalizationProvider>
  );
};
export default TaskInfoDraw;
