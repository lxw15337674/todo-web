import { Task, TaskType } from 'src/api/todo/interface';
import { create } from 'zustand';
import computed from 'zustand-middleware-computed';

interface ComputedState {
  selectedTask: Task | undefined;
}
interface Store {
  tasks?: Task[];
  selectedTaskId?: number;
  setSelectTaskId: (id: number) => void;
  taskTypes: TaskType[];
}
export const useTodoStore = create(
  computed<Store, ComputedState>(
    (set) => ({
      tasks: [],
      selectedTaskId: 1,
      setSelectTaskId: (id: number) => {
        set({ selectedTaskId: id });
      },
      taskTypes: [],
    }),
    {
      selectedTask: (state) => {
        return state?.tasks?.find((task) => task.id === state.selectedTaskId);
      },
    },
  ),
);
