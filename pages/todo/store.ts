import { Task } from 'api/todo/interface';
import { create } from 'zustand';
import computed from 'zustand-middleware-computed';

interface ComputedState {
  selectedTask: Task | undefined;
}
interface Store {
  tasks: Task[];
  selectedTaskId: number;
  setSelectTaskId: (id: number) => void;
}
export const useTodoStore = create(
  computed<Store, ComputedState>(
    (set, get) => ({
      tasks: [],
      selectedTaskId: 0,
      setSelectTaskId: (id: number) => {
        set({ selectedTaskId: get().selectedTaskId++ });
      },
    }),
    {
      selectedTask: (state) => {
        return state.tasks.find((task) => task.id === state.selectedTaskId);
      },
    },
  ),
);
