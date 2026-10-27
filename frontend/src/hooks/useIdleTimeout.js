import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook useIdleTimeout - Quản lý Session Timeout 30 phút theo SRS 5.3
 * Tự động đếm ngược thời gian phiên làm việc còn lại và tự động đăng xuất khi hết 30 phút bất hoạt.
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
  const [currentDuration, setCurrentDuration] = useState(timeoutDuration);
  const [totalRemainingSeconds, setTotalRemainingSeconds] = useState(() => Math.floor(timeoutDuration / 1000));
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.floor(warnDuration / 1000));

  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);
  const onTimeoutRef = useRef(onTimeout);
  const isWarningRef = useRef(false);
  const hasTimedOutRef = useRef(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    isWarningRef.current = isWarning;
  }, [isWarning]);

  // Format MM:SS
  const formatTime = (secs) => {
    const s = Math.max(0, secs);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const formattedSessionTime = formatTime(totalRemainingSeconds);

  const resetTimer = useCallback((newDuration = timeoutDuration) => {
    hasTimedOutRef.current = false;
    setCurrentDuration(newDuration);
    lastActivityRef.current = Date.now();
    setIsWarning(false);
    isWarningRef.current = false;
    const initialSecs = Math.floor(newDuration / 1000);
    setTotalRemainingSeconds(initialSecs);
    setRemainingSeconds(Math.min(initialSecs, Math.floor(warnDuration / 1000)));
  }, [timeoutDuration, warnDuration]);

  // Hỗ trợ chế độ thử nghiệm nhanh (vd: 10 giây cho demo bảo vệ đồ án theo SRS 5.3)
  const setDemoTimeout = useCallback((demoDurationMs = 10000) => {
    resetTimer(demoDurationMs);
  }, [resetTimer]);

  // Main interval chạy mỗi 1 giây để cập nhật đồng hồ đếm ngược và kích hoạt auto logout
  useEffect(() => {
    const timer = setInterval(() => {
      if (hasTimedOutRef.current) return;

      const elapsed = Date.now() - lastActivityRef.current;
      const leftSec = Math.max(0, Math.ceil((currentDuration - elapsed) / 1000));

      setTotalRemainingSeconds(leftSec);

      // Ngưỡng cảnh báo: khi còn ít hơn hoặc bằng warnDuration
      const warnThresholdSec = Math.min(Math.floor(warnDuration / 1000), Math.floor(currentDuration / 1000));

      if (leftSec <= 0) {
        hasTimedOutRef.current = true;
        setIsWarning(false);
        isWarningRef.current = false;
        clearInterval(timer);
        if (onTimeoutRef.current) {
          onTimeoutRef.current();
        }
      } else if (leftSec <= warnThresholdSec) {
        if (!isWarningRef.current) {
          setIsWarning(true);
          isWarningRef.current = true;
        }
        setRemainingSeconds(leftSec);
      } else {
        if (isWarningRef.current) {
          setIsWarning(false);
          isWarningRef.current = false;
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentDuration, warnDuration]);

  // Lắng nghe hoạt động chuột / bàn phím của người dùng
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      // Nếu đang mở modal cảnh báo thì không tự động reset bằng di chuột (người dùng phải bấm nút trên modal)
      if (isWarningRef.current || hasTimedOutRef.current) return;

      const now = Date.now();
      // Throttle 1 giây để tránh gọi setState liên tục hàng chục lần mỗi giây
      if (now - lastThrottleRef.current > 1000) {
        lastThrottleRef.current = now;
        lastActivityRef.current = now;
        setTotalRemainingSeconds(Math.floor(currentDuration / 1000));
      }
    };

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [currentDuration]);

  return {
    isWarning,
    remainingSeconds,
    totalRemainingSeconds,
    formattedSessionTime,
    resetTimer,
    setDemoTimeout,
  };
};
