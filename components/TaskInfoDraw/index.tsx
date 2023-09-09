import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from '@mui/material';
import React from 'react';
import { useTodoStore } from 'store/todo';
import dayjs from 'dayjs';
import {
  DateField,
  DateTimeField,
  DateTimePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MenuProps, theme } from 'antd';
import { useObject } from 'wwhooks';
import { Task } from 'api/todo/interface';
const names = [
  'Oliver Hansen',
  'Van Henry',
  'April Tucker',
  'Ralph Hubbard',
  'Omar Alexander',
  'Carlos Abbott',
  'Miriam Wagner',
  'Bradley Wilkerson',
  'Virginia Andrews',
  'Kelly Snyder',
];
const TaskInfoDraw = () => {
  const { selectedTask } = useTodoStore();
  const [state, setState] = useObject<Task>({});
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="shadow-2xl ml-2 px-2 bg-slate-50 min-w-[200px] max-w-xs">
        <Divider />
        <List>
          {/* {Object.entries(selectedTask).map(([key, string], index) => (
          <ListItem key={text}>
            <ListItemIcon>123</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))} */}

          <ListItem disablePadding className=" bg-white mb-4">
            <ListItemButton dense>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selectedTask?.status === 'done'}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText primary={selectedTask?.title} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding className=" bg-white mb-4">
            <Autocomplete
              multiple
              options={names}
              size="small"
              disableCloseOnSelect
              getOptionLabel={(option) => option}
              style={{ width: 500 }}
              renderInput={(params) => <TextField {...params} label="类型" />}
            />
          </ListItem>

          <ListItem disablePadding className=" bg-white mb-4">
            <Autocomplete
              size="small"
              options={names}
              disableCloseOnSelect
              getOptionLabel={(option) => option}
              style={{ width: 500 }}
              renderInput={(params) => <TextField {...params} label="优先级" />}
            />
          </ListItem>

          {/* <ListItem disablePadding className=" bg-white mb-4">
            <FormControl sx={{ m: 1, width: 300 }}>
              <InputLabel id="demo-multiple-chip-label">Chip</InputLabel>
              <Select
                labelId="demo-multiple-chip-label"
                id="demo-multiple-chip"
                multiple
                defaultValue={state?.type ? (state?.type).split(',') : []}
                input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {names.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ListItem> */}

          <ListItem disablePadding className=" bg-white mb-4">
            <TextField
              fullWidth
              label="备注"
              size="small"
              multiline
              rows={2}
              id="outlined-multiline-static"
              defaultValue={selectedTask?.remark}
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

          <ListItem disablePadding className=" bg-white mb-4">
            <DateTimePicker
              label="截止时间"
              className={'w-full'}
              value={dayjs(selectedTask?.createTime)}
            />
          </ListItem>

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
