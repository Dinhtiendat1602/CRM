import { useState, useEffect } from 'react';
import Modal from '../../components/Common/Modal';
import oppApi from '../../api/oppApi';
import { 
  PhoneCall, 
  Mail, 
  Users, 
  MessageSquare, 
  Calendar, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowRightCircle 
} from 'lucide-react';

const CONTACT_METHODS = [
  { value: 'PHONE', label: 'Gọi điện thoại', icon: PhoneCall },
  { value: 'EMAIL', label: 'Gửi Email', icon: Mail },
  { value: 'MEETING', label: 'Gặp trực tiếp', icon: Users },
  { value: 'ZALO', label: 'Nhắn tin Zalo / Chat', icon: MessageSquare },
];

export default function FollowUpModal({ isOpen, onClose, opportunity, onSuccess }) {
  const getNowFormatted = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    follow_date: getNowFormatted(),
    contact_method: 'PHONE',
    content: '',
    customer_response: '',
    next_plan: '',
    new_status: '',
  });

  const [statuses, setStatuses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        follow_date: getNowFormatted(),
        contact_method: 'PHONE',
        content: '',
        customer_response: '',
        next_plan: '',
        new_status: opportunity?.status === 'NEW' ? 'CONTACTED' : (opportunity?.status || ''),
      });
      setErrorMsg('');
      setFieldErrors({});

      // Load statuses
      oppApi.getStatuses()
        .then((res) => setStatuses(res.data?.data || res.data || []))
        .catch((err) => console.error('Lỗi tải danh mục statuses:', err));
    }
  }, [isOpen, opportunity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMsg) setErrorMsg('');
  };

  const validate = () => {
    const errors = {};
    if (!formData.content || !formData.content.trim()) {
      errors.content = 'Vui lòng nhập nội dung chi tiết tương tác chăm sóc.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!opportunity?.id) {
      setErrorMsg('Không xác định được mã cơ hội bán hàng.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        follow_date: formData.follow_date ? new Date(formData.follow_date).toISOString() : new Date().toISOString(),
        contact_method: formData.contact_method,
        content: formData.content.trim(),
        customer_response: formData.customer_response ? formData.customer_response.trim() : null,
        next_plan: formData.next_plan ? formData.next_plan.trim() : null,
        new_status: formData.new_status || undefined,
      };

      await oppApi.addFollowUp(opportunity.id, payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi thêm nhật ký chăm sóc:', err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhật ký chăm sóc.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi Nhận Nhật Ký Chăm Sóc Khách Hàng (Follow-up)"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">{errorMsg}</div>
          </div>
        )}

        {/* Thông tin vắn tắt về Cơ hội */}
        {opportunity && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-gray-500">Khách hàng: </span>
              <strong className="text-gray-800">{opportunity.lead_name || `Lead #${opportunity.lead_id}`}</strong>
            </div>
            <div>
              <span className="text-gray-500">Sản phẩm: </span>
              <strong className="text-blue-700">{opportunity.product_name}</strong>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái hiện tại: </span>
              <span className="px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">
                {opportunity.status}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Thời gian tương tác */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Thời Gian Liên Hệ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="datetime-local"
                name="follow_date"
                value={formData.follow_date}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Phương thức liên hệ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Hình Thức Tương Tác <span className="text-red-500">*</span>
            </label>
            <select
              name="contact_method"
              value={formData.contact_method}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {CONTACT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nội dung tương tác */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nội Dung Trao Đổi Chi Tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            rows={3}
            value={formData.content}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
              fieldErrors.content 
                ? 'border-red-400 focus:ring-red-300' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Ví dụ: Gọi điện tư vấn tính năng máy ảnh Sony A7 IV, báo giá khuyến mãi ống kính combo, giải đáp thắc mắc về bảo hành chính hãng..."
          />
          {fieldErrors.content && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.content}</p>
          )}
        </div>

        {/* Phản hồi của khách hàng */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Phản Hồi & Đánh Giá Của Khách Hàng (Customer Response)
          </label>
          <textarea
            name="customer_response"
            rows={2}
            value={formData.customer_response}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ví dụ: Khách quan tâm mức chiết khấu khi mua từ 2 máy trở lên, muốn gửi hợp đồng mẫu qua email..."
          />
        </div>

        {/* Kế hoạch tiếp theo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Kế Hoạch Tiếp Theo (Next Plan)
          </label>
          <textarea
            name="next_plan"
            rows={2}
            value={formData.next_plan}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ví dụ: Chuẩn bị bảng báo giá gửi trước 17h chiều nay, hẹn gặp khách tại showroom sáng thứ Năm..."
          />
        </div>

        {/* Cập nhật trạng thái cơ hội */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <ArrowRightCircle className="w-4 h-4 text-blue-600" />
            <span>Chuyển Đổi Trạng Thái Cơ Hội (Tùy chọn)</span>
          </label>
          <select
            name="new_status"
            value={formData.new_status}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">-- Giữ nguyên trạng thái hiện tại --</option>
            {statuses.map((s) => (
              <option key={s.code} value={s.code}>
                Chuyển thành: {s.label} ({s.code})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Mẹo: Khi ghi nhận tương tác đầu tiên cho cơ hội mới, trạng thái sẽ tự động nâng cấp lên "Đã liên hệ" (CONTACTED).
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang ghi nhận...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu Nhật Ký Chăm Sóc</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
