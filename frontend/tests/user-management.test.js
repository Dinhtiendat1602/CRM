import { describe, it } from 'node:test';
import assert from 'node:assert';

// Hàm tính toán hiển thị bản ghi Pagination theo BR-03
function calculatePaginationRange(currentPage, pageSize, totalItems) {
  if (totalItems === 0) return { startItem: 0, endItem: 0, totalPages: 0 };
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);
  return { startItem, endItem, totalPages };
}

// Logic kiểm tra xem admin có thể tự khóa tài khoản của chính mình không
function canDeactivateUser(targetUserId, currentUserId) {
  if (targetUserId === currentUserId) {
    return { allowed: false, reason: 'Admin không thể tự khóa tài khoản của chính mình' };
  }
  return { allowed: true };
}

// Logic validation đổi mật khẩu cá nhân (SRS 3.13)
function validatePasswordChange(oldPassword, newPassword, confirmPassword) {
  if (!oldPassword) {
    return { valid: false, error: 'Vui lòng nhập mật khẩu cũ' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { valid: false, error: 'Mật khẩu mới phải có tối thiểu 8 ký tự' };
  }
  if (newPassword !== confirmPassword) {
    return { valid: false, error: 'Mật khẩu xác nhận không khớp' };
  }
  return { valid: true };
}

// Logic validation tạo tài khoản nhân viên mới (SRS 2.1)
function validateCreateUser(form) {
  if (!form.username?.trim()) return { valid: false, error: 'Thiếu username' };
  if (!form.full_name?.trim()) return { valid: false, error: 'Thiếu full_name' };
  if (!form.email?.trim() || !form.email.includes('@')) return { valid: false, error: 'Email không hợp lệ' };
  if (!form.role_id) return { valid: false, error: 'Chưa chọn vai trò' };
  return { valid: true };
}

describe('Frontend User Management & Profile UI Tests (feat-007)', () => {
  describe('Pagination Logic (BR-03: 20 bản ghi/trang)', () => {
    it('tính toán chính xác khoảng bản ghi cho trang 1 với 45 bản ghi', () => {
      const result = calculatePaginationRange(1, 20, 45);
      assert.strictEqual(result.startItem, 1);
      assert.strictEqual(result.endItem, 20);
      assert.strictEqual(result.totalPages, 3);
    });

    it('tính toán chính xác khoảng bản ghi cho trang cuối (trang 3/3)', () => {
      const result = calculatePaginationRange(3, 20, 45);
      assert.strictEqual(result.startItem, 41);
      assert.strictEqual(result.endItem, 45);
    });

    it('xử lý an toàn khi danh sách rỗng (0 bản ghi)', () => {
      const result = calculatePaginationRange(1, 20, 0);
      assert.strictEqual(result.startItem, 0);
      assert.strictEqual(result.endItem, 0);
      assert.strictEqual(result.totalPages, 0);
    });
  });

  describe('Admin Self-Deactivation Guard (SRS 2.1)', () => {
    it('chặn Admin tự vô hiệu hóa tài khoản của chính mình', () => {
      const check = canDeactivateUser(1, 1);
      assert.strictEqual(check.allowed, false);
      assert.ok(check.reason.includes('không thể tự khóa'));
    });

    it('cho phép Admin khóa tài khoản của nhân viên khác', () => {
      const check = canDeactivateUser(2, 1);
      assert.strictEqual(check.allowed, true);
    });
  });

  describe('Profile & Password Validation (SRS 3.13)', () => {
    it('chấp nhận mật khẩu hợp lệ có độ dài >= 8 và khớp xác nhận', () => {
      const result = validatePasswordChange('oldpass123', 'newpass1234', 'newpass1234');
      assert.strictEqual(result.valid, true);
    });

    it('từ chối mật khẩu mới quá ngắn (< 8 ký tự)', () => {
      const result = validatePasswordChange('oldpass123', 'short', 'short');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('8 ký tự'));
    });

    it('từ chối khi mật khẩu xác nhận không trùng khớp', () => {
      const result = validatePasswordChange('oldpass123', 'newpass1234', 'mismatched1234');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('không khớp'));
    });
  });

  describe('Create User Form Validation (SRS 2.1)', () => {
    it('xác thực thành công với thông tin nhân viên hợp lệ', () => {
      const form = {
        username: 'sales_hn',
        full_name: 'Nguyễn Văn B',
        email: 'sales_hn@company.com',
        role_id: 3,
      };
      const result = validateCreateUser(form);
      assert.strictEqual(result.valid, true);
    });

    it('từ chối khi thiếu email hoặc email không có ký tự @', () => {
      const form = {
        username: 'sales_hn',
        full_name: 'Nguyễn Văn B',
        email: 'invalid-email',
        role_id: 3,
      };
      const result = validateCreateUser(form);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('Email không hợp lệ'));
    });
  });
});
