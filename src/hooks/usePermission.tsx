import useConfigStore from '../../store/config';
import { useMount } from 'ahooks';
import { redirect } from 'next/navigation';

export function usePermission() {
  const { validateEditCode } = useConfigStore();
  useMount(() => {
    validateEditCode().then((hasEditCodePermission) => {
      if (!hasEditCodePermission) {
        redirect('/login');
      }
    });
  });
}
