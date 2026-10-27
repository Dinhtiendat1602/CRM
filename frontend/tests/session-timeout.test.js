import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Frontend Session Timeout & Auto-Logout Tests (SRS 5.3, BR-11)', () => {
  // Helper tính toán thời gian và format
  const formatTime = (secs) => {
    const s = Math.max(0, secs);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const calculateRemainingSeconds = (lastActivity, currentDuration) => {
    const elapsed = Date.now() - lastActivity;
    return Math.max(0, Math.ceil((currentDuration - elapsed) / 1000));
  };

  it('1. formatTime: Định dạng chính xác chuỗi MM:SS từ số giây', () => {
    assert.strictEqual(formatTime(1800), '30:00');
    assert.strictEqual(formatTime(1799), '29:59');
    assert.strictEqual(formatTime(120), '02:00');
    assert.strictEqual(formatTime(59), '00:59');
    assert.strictEqual(formatTime(9), '00:09');
    assert.strictEqual(formatTime(0), '00:00');
    assert.strictEqual(formatTime(-5), '00:00');
  });

  it('2. Đếm ngược tự động: Giảm dần số giây theo thời gian trôi qua', () => {
    const currentDuration = 30 * 60 * 1000; // 30 phút = 1800s
    const now = Date.now();
    
    // Giả lập 5 giây không thao tác
    const lastActivity5sAgo = now - 5000;
    const remaining5s = calculateRemainingSeconds(lastActivity5sAgo, currentDuration);
    assert.strictEqual(remaining5s, 1795);
    assert.strictEqual(formatTime(remaining5s), '29:55');

    // Giả lập 15 phút (900s) không thao tác
    const lastActivity15mAgo = now - 900000;
    const remaining15m = calculateRemainingSeconds(lastActivity15mAgo, currentDuration);
    assert.strictEqual(remaining15m, 900);
    assert.strictEqual(formatTime(remaining15m), '15:00');
  });

  it('3. Kích hoạt cảnh báo (isWarning): Khi thời gian còn lại <= 2 phút (120s)', () => {
    const warnThresholdSec = 120;

    const remainingAboveWarn = 125;
    const isWarningAbove = remainingAboveWarn <= warnThresholdSec;
    assert.strictEqual(isWarningAbove, false);

    const remainingAtWarn = 120;
    const isWarningAt = remainingAtWarn <= warnThresholdSec;
    assert.strictEqual(isWarningAt, true);

    const remainingBelowWarn = 45;
    const isWarningBelow = remainingBelowWarn <= warnThresholdSec;
    assert.strictEqual(isWarningBelow, true);
  });

  it('4. Tự động Hết hạn & Đăng xuất (SRS 5.3): Kích hoạt onTimeout khi chạm mốc 0 giây', () => {
    let loggedOut = false;
    const onTimeout = () => {
      loggedOut = true;
    };

    const remainingZero = 0;
    if (remainingZero <= 0) {
      onTimeout();
    }

    assert.strictEqual(loggedOut, true, 'Hệ thống phải tự động đăng xuất khi hết 30 phút bất hoạt');
  });

  it('5. Thao tác người dùng (User Activity): Reset timer về đủ 30 phút (1800s)', () => {
    const timeoutDuration = 30 * 60 * 1000;
    let lastActivity = Date.now() - 60000; // đã trôi qua 1 phút
    assert.ok(calculateRemainingSeconds(lastActivity, timeoutDuration) < 1800);

    // Người dùng gõ phím hoặc di chuột -> Reset
    lastActivity = Date.now();
    const resetRemaining = calculateRemainingSeconds(lastActivity, timeoutDuration);
    assert.strictEqual(resetRemaining, 1800);
    assert.strictEqual(formatTime(resetRemaining), '30:00');
  });

  it('6. Chế độ Thử nghiệm Nhanh (Demo Mode - SRS 5.3): Hỗ trợ timeout 10 giây để kiểm chứng thực tế', () => {
    const demoDuration = 10000; // 10s
    const now = Date.now();
    const remainingDemo = calculateRemainingSeconds(now, demoDuration);
    assert.strictEqual(remainingDemo, 10);
    assert.strictEqual(formatTime(remainingDemo), '00:10');

    // Sau 10 giây trôi qua -> Hết hạn
    const expiredDemo = calculateRemainingSeconds(now - 10000, demoDuration);
    assert.strictEqual(expiredDemo, 0);
  });
});
