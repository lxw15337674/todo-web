import Layout from 'src/components/layout';
import { useDebounceFn, useMount, useObject, usePromise } from 'wwhooks';
import { createTask, getTaskList, updateTask } from 'src/api/todo/task';
import { StarBorder } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Grid,
  List,
  ListItemButton,
  Stack,
  IconButton,
  TextField,
  InputBase,
  Paper,
  InputAdornment,
} from '@mui/material';
import { Task } from 'src/api/todo/interface';
import { useTodoStore } from '../../store/todo';
import TaskInfoDraw from '@/components/Todo/TaskInfoDraw';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import { useMemo } from 'react';
import { getTaskTypeList } from 'src/api/todo/taskType';
export default function IndexPage() {
  const { tasks, selectedTaskId, setSelectTaskId } = useTodoStore((state) => ({
    tasks: state.tasks,
    selectedTaskId: state.selectedTaskId,
    setSelectTaskId: state.setSelectTaskId,
  }));

  const [newTask, setNewTask] = useObject<Task>({
    title: '',
  });

  const [state, setState] = useObject({
    search: '',
    anchorEl: null as (EventTarget & HTMLButtonElement) | null,
  });
  useMount(() => {
    getTaskList();
    getTaskTypeList();
  });

  const { run: createTaskRes, isLoading: createTaskLoading } = usePromise(
    createTask,
    {
      debounceInterval: 300,
      onSuccess: () => {
        setNewTask({
          title: '',
        });
      },
    },
  );

  const { run: updateTaskRes } = usePromise(updateTask, {
    debounceInterval: 300,
  });

  const [onFilter] = useDebounceFn((v) => {
    setState({
      search: v,
    });
  });

  const filterTasks = useMemo(() => {
    return tasks?.filter((task) => {
      if (task?.title?.includes(state.search)) {
        return true;
      }
      if (task.remark?.includes(state.search)) {
        return true;
      }
      if (task.type?.includes(state.search)) {
        return true;
      }
    });
  }, [tasks, state.search]);

  return (
    <Layout>
      <div className="flex h-full">
        <div className="flex-1 m-3 flex flex-col ">
          <Paper className="mb-4" elevation={3}>
            <TextField
              autoFocus
              fullWidth
              required
              variant="standard"
              className="px-2 py-2"
              multiline
              value={newTask.title}
              onChange={(e) => {
                setNewTask({
                  title: e.target.value,
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  createTaskRes(newTask);
                }
              }}
            />
            <div className="  p-[6px] flex">
              <LoadingButton
                loading={createTaskLoading}
                size="small"
                className="ml-auto  bg-primary"
                variant="contained"
                onClick={() => {
                  createTaskRes(newTask);
                }}
              >
                提交
              </LoadingButton>
            </div>
          </Paper>
          <div className="flex">
            {/* <div className="flex mb-4 ">
              <Button
                variant="outlined"
                startIcon={<SortIcon fontSize="small" />}
                size="small"
                onClick={(e) => {
                  setState({
                    anchorEl: e.currentTarget,
                  });
                }}
              >
                排序
              </Button>
              <Menu
                anchorEl={state.anchorEl}
                open={Boolean(state.anchorEl)}
                onClose={() => {
                  setState({
                    anchorEl: null,
                  });
                }}
              >
                <MenuItem selected>优先级</MenuItem>
                <MenuItem>创建时间</MenuItem>
                <MenuItem>更新时间</MenuItem>
              </Menu>
            </div> */}
            <Paper className="ml-auto flex mb-4 flex-center " elevation={2}>
              <InputAdornment position="start" className="m-2">
                <SearchIcon fontSize="small" />
              </InputAdornment>
              <InputBase
                className="mr-4 w-60"
                placeholder="筛选(支持标题、简介、类型)"
                onChange={(e) => {
                  onFilter(e.target.value);
                }}
              />
            </Paper>
          </div>

          <div className=" overflow-auto flex-1 ">
            <List>
              <Stack spacing={1}>
                {filterTasks?.map((task) => (
                  <div className="border mr-2 shadow-sm" key={task.id}>
                    <Grid container>
                      <Grid
                        item
                        className="
                        border-r  border-border"
                      >
                        <IconButton
                          className="m-1"
                          onClick={() => {
                            if (task?.status === 'done') {
                              updateTaskRes({
                                id: task.id,
                                status: 'todo',
                              });
                            } else {
                              updateTaskRes({
                                id: task.id,
                                status: 'done',
                              });
                            }
                          }}
                        >
                          {task?.status === 'done' ? (
                            <StarIcon
                              sx={{
                                color: '#2564cf',
                              }}
                            />
                          ) : (
                            <StarBorder
                              sx={{
                                color: '#2564cf',
                              }}
                            />
                          )}
                        </IconButton>
                      </Grid>
                      <Grid item xs>
                        <ListItemButton
                          className="overflow-hidden w-full "
                          onClick={() => {
                            setSelectTaskId(
                              selectedTaskId === task.id ? 0 : task?.id ?? 0,
                            );
                          }}
                          selected={selectedTaskId === task.id}
                        >
                          <span className="my-1 max-w-[100px] 	">
                            {task.title}
                          </span>
                        </ListItemButton>
                      </Grid>
                    </Grid>
                  </div>
                ))}
              </Stack>
            </List>
          </div>
        </div>
        {!!selectedTaskId && <TaskInfoDraw />}
      </div>
    </Layout>
  );
}
