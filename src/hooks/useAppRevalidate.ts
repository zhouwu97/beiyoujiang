'use client';

import { useEffect, useRef } from 'react';

/**
 * 统一处理从后台回到前台、窗口重新获得焦点和网络恢复。
 * 只有离开后台超过 minBackgroundMs 才触发，避免每次切换标签都打接口。
 */
export function useAppRevalidate(
  callback: () => void | Promise<void>,
  minBackgroundMs = 120_000
): void {
  const callbackRef = useRef(callback);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const maybeRevalidate = (force = false) => {
      const hiddenAt = hiddenAtRef.current;
      const stale = hiddenAt !== null && Date.now() - hiddenAt >= minBackgroundMs;
      if (force || stale) {
        hiddenAtRef.current = null;
        void callbackRef.current();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else {
        maybeRevalidate();
      }
    };
    const onFocus = () => maybeRevalidate();
    const onOnline = () => maybeRevalidate(true);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [minBackgroundMs]);
}
