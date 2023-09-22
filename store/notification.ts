import { create } from 'zustand';
import computed from 'zustand-middleware-computed';

interface ComputedState {}
interface Store {
  open: boolean;
  message?: string;
  notification: (message: string) => void;
  close: () => void;
}
export const useNotificationStore = create(
  computed<Store, ComputedState>(
    (set) => ({
      open: false,
      message: '',
      notification: (message) => {
        set({ open: true, message });
      },
      close: () => {
        set({ open: false });
      },
    }),
    {},
  ),
);
