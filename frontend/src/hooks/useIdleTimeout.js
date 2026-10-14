import { useEffect, useRef, useCallback } from 'react';

export const useIdleTimeout = (onTimeout, timeoutDuration = 30 * 60 * 1000) => {
  const timerRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onTimeoutRef.current) onTimeoutRef.current();
    }, timeoutDuration);
  }, [timeoutDuration]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    resetTimer();
    events.forEach((e) => window.addEventListener(e, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer]);
};
