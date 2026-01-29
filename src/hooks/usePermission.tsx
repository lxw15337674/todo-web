import useConfigStore from '../../store/config';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Apps } from '../../app/RouterConfig';

export function usePermission() {
  const { checkAuth } = useConfigStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const currentApp = Apps.find(app => pathname === app.url || pathname.startsWith(`${app.url}/`));
    const requiredRoles = currentApp?.requiredRoles;

    if (requiredRoles && requiredRoles.length > 0) {
      let cancelled = false;
      checkAuth().then((role) => {
        if ((role === 'none' || !requiredRoles.includes(role)) && !cancelled) {
          router.push('/login');
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [pathname, checkAuth, router]);
}
