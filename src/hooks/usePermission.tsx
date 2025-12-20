import useConfigStore from '../../store/config';
import { useEffect } from 'react';
import { redirect, usePathname } from 'next/navigation';
import { Apps } from '../../app/RouterConfig';

export function usePermission() {
  const { validateEditCode } = useConfigStore();
  const pathname = usePathname();

  useEffect(() => {
    const currentApp = Apps.find(app => app.url === pathname);
    
    if (currentApp?.auth) {
      validateEditCode().then((hasEditCodePermission) => {
        if (!hasEditCodePermission) {
          redirect('/login');
        }
      });
    }
  }, [pathname, validateEditCode]);
}