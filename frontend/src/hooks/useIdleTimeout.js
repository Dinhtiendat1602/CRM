import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook useIdleTimeout - Quản lý Session Timeout 30 phút theo SRS 5.3
 * Tự động kích hoạt cảnh báo đếm ngược trước khi phiên làm việc hết hạn.
 * 
 * @param {Object} options
 * @param {Function} options.onTimeout - Hàm gọi khi hết hạn (30 phút)
 * @param {number} [options.timeoutDuration=1800000] - Tổng thời gian hết hạn (mặc định 30 phút = 1,800,000ms)
 * @param {number} [options.warnDuration=120000] - Thời gian cảnh báo trước khi hết hạn (mặc định 2 phút = 120,000ms)
 */
export const useIdleTimeout = ({
  onTimeout,
  timeoutDuration = 30 * 60 * 1000,
  warnDuration = 2 * 60 * 1000,
}) => {
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.floor(warnDuration / 1000));

  const timeoutTimerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearAllTimers = useCallback(() => {
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();
    const warnTime = Math.max(0, timeoutDuration - warnDuration);

    // Hẹn giờ kích hoạt cảnh báo trước 2 phút
    warnTimerRef.current = setTimeout(() => {
      setIsWarning(true);
      const startTime = Date.now();
      const endTime = startTime + warnDuration;

      countdownIntervalRef.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setRemainingSeconds(left);
        if (left <= 0) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);
    }, warnTime);

    // Hẹn giờ tự động hết hạn 30 phút
    timeoutTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setIsWarning(false);
      if (onTimeoutRef.current) {
        onTimeoutRef.current();
      }
    }, timeoutDuration);
  }, [clearAllTimers, timeoutDuration, warnDuration]);

  const resetTimer = useCallback(() => {
    setIsWarning(false);
    setRemainingSeconds(Math.floor(warnDuration / 1000));
    startTimers();
  }, [startTimers, warnDuration]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Khởi động các timer
    startTimers();

    const handleActivity = () => {
      // Khi không ở trạng thái cảnh báo modal, tự động gia hạn timer
      if (!isWarning) {
        startTimers();
      }
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      clearAllTimers();
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [clearAllTimers, isWarning, startTimers]);

  return {
    isWarning,
    remainingSeconds,
    resetTimer,
  };
};
