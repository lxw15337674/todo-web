import Layout from '../../components/layout';
import { useObject, usePromise } from 'wwhooks';
import { createTask, getTaskList, updateTask } from 'api/todo/task';
import StarIcon from '@mui/icons-material/Star';
import { StarBorder } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Button,
  Grid,
  Input,
  List,
  ListItemButton,
  Stack,
  IconButton,
  TextField,
} from '@mui/material';
import TaskInfoDraw from 'components/TaskInfoDraw';
import { Task } from 'api/todo/interface';
import { useTodoStore } from '../../store/todo';
import _ from 'lodash';

export default function IndexPage() {
  const store = useTodoStore();
  const { tasks, selectedTaskId, setSelectTaskId } = store;
  console.log(store);
  const [newTask, setNewTask] = useObject<Task>({
    title: '',
  });

  const { reload } = usePromise(getTaskList, {
    manual: false,
  });

  const { run: createTaskRes, isLoading: createTaskLoading } = usePromise(
    createTask,
    {
      debounceInterval: 300,
      onSuccess: () => {
        reload();
        setNewTask({
          title: '',
        });
      },
    },
  );

  const { run: updateTaskRes } = usePromise(updateTask, {
    debounceInterval: 300,
    onSuccess: () => {
      reload();
    },
  });

  return (
    <Layout>
      <div className="flex h-full">
        <div className="flex-1 m-3 flex flex-col ">
          <div className="border mb-4">
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
            <div className="shadow-lg  p-[6px] flex">
              <LoadingButton
                loading={createTaskLoading}
                size="small"
                className="ml-auto  bg-primary"
                variant="contained"
                onClick={() => {
                  createTaskRes(newTask);
                }}
              >
                发送
              </LoadingButton>
            </div>
          </div>

          <div className=" overflow-auto flex-1 ">
            <List>
              <Stack spacing={1}>
                {tasks?.map((task) => (
                  <div className="border mr-2 shadow-sm" key={task.id}>
                    <Grid container>
                      <Grid
                        item
                        className="
                        border-r  border-border"
                      >
                        <IconButton className="m-1">
                          {task?.status === 'done' ? (
                            <StarIcon
                              sx={{
                                color: '#2564cf',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                updateTaskRes({
                                  id: task.id,
                                  status: 'todo',
                                });
                              }}
                            />
                          ) : (
                            <StarBorder
                              sx={{
                                color: '#2564cf',
                              }}
                              onClick={() => {
                                updateTaskRes({
                                  id: task.id,
                                  status: 'done',
                                });
                              }}
                            />
                          )}
                        </IconButton>
                      </Grid>
                      <Grid item xs>
                        <ListItemButton
                          onClick={() => {
                            setSelectTaskId(
                              selectedTaskId === task.id ? 0 : task?.id ?? 0,
                            );
                          }}
                          selected={selectedTaskId === task.id}
                        >
                          <div className="my-1">{task.title}</div>
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
