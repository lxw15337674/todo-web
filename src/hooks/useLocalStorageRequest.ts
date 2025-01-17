import { useRequest } from 'ahooks';
import { isBrowser } from '../lib/utils';

const useLocalStorageRequest: typeof useRequest = (
  request,
  { cacheKey, ...rest }: any,
) => {
  const res = useRequest(request, {
    ...rest,
    cacheKey,
    setCache: (data) => {
      if (!isBrowser()) {
        return;
      }
      localStorage.setItem(cacheKey, JSON.stringify(data));
    },
    getCache: () => {
      if (!isBrowser()) return {};
      return JSON.parse(localStorage.getItem(cacheKey) || '{}');
    },
  });

  return res;
};
export default useLocalStorageRequest;
