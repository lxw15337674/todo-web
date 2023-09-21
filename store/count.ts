import { CountMeta } from 'src/api/count/interface';
import { create } from 'zustand';
import computed from 'zustand-middleware-computed';

interface ComputedState {
  selectedCount: CountMeta | undefined;
  editCount: CountMeta | undefined;
}
interface Store {
  counts?: CountMeta[];
  selectedCountId?: string;
  setSelectCountId: (id: string) => void;
  editCountId?: string;
  setEditCountId: (id: string) => void;
  editFormVisible: boolean;
  setStore: (store: Partial<Store>) => void;
}
export const useCountStore = create(
  computed<Store, ComputedState>(
    (set) => ({
      counts: [],
      editFormVisible: false,
      selectedCountId: '',
      setSelectCountId: (id: string) => {
        set({ selectedCountId: id });
      },
      setEditCountId: (id: string) => {
        set({ editCountId: id });
      },
      countTypes: [],
      editCountId: '',
      setStore: (store: Partial<Store>) => {
        set(store);
      },
    }),
    {
      selectedCount: (state) => {
        return state?.counts?.find(
          (count) => count.id === state.selectedCountId,
        );
      },
      editCount: (state) => {
        return state?.counts?.find((count) => count.id === state.editCountId);
      },
    },
  ),
);
