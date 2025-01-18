import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 1000,
): T {
  const lastRun = useRef<number>(0);
  const timeout = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (lastRun.current && now - lastRun.current < delay) {
        // 如果还在节流时间内，取消之前的延迟执行并设置新的延迟执行
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        timeout.current = setTimeout(() => {
          lastRun.current = now;
          fn(...args);
        }, delay);
        return;
      }

      lastRun.current = now;
      fn(...args);
    },
    [fn, delay],
  ) as T;
}
