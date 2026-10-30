import { useState, useEffect } from 'react';
import Modal from '../../components/Common/Modal';
import campaignApi from '../../api/campaignApi';
import { Megaphone, Calendar, DollarSign, FileText, AlertCircle, Loader2 } from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  budget: '',
};

/**
 * Modal Thêm mới / Cập nhật Chiến dịch Tiếp thị
 * Tuân thủ SRS v1.1 Mục 3.18.1 (Validate tên, ngày bắt đầu/kết thúc, ngân sách)
 */
export default function CampaignModal({ isOpen, onClose, campaign, onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isEdit = Boolean(campaign?.id);

  // Load dữ liệu khi mở modal hoặc khi campaign prop thay đổi
  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        start_date: campaign.start_date ? campaign.start_date.substring(0, 10) : '',
        end_date: campaign.end_date ? campaign.end_date.substring(0, 10) : '',
        budget: campaign.budget !== undefined && campaign.budget !== null ? campaign.budget : '',
      });
    } else if (isOpen) {
      // Đặt mặc định ngày bắt đầu hôm nay, ngày kết thúc 30 ngày sau
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);

      setFormData({
        ...INITIAL_FORM,
        start_date: today.toISOString().substring(0, 10),
        end_date: in30Days.toISOString().substring(0, 10),
      });
    }
    setErrorMsg('');
    setFieldErrors({});
  }, [campaign, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setErrorMsg('');
  };

  const validate = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Vui lòng nhập tên chiến dịch tiếp thị.';
    }

    if (!formData.start_date) {
      errors.start_date = 'Vui lòng chọn ngày bắt đầu chiến dịch.';
    }

    if (!formData.end_date) {
      errors.end_date = 'Vui lòng chọn ngày kết thúc chiến dịch.';
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        errors.end_date = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.';
      }
    }

    if (formData.budget !== '' && (isNaN(Number(formData.budget)) || Number(formData.budget) < 0)) {
      errors.budget = 'Ngân sách phải là số lớn hơn hoặc bằng 0.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: formData.budget !== '' ? Number(formData.budget) : 0,
      };

      if (isEdit) {
        await campaignApi.updateCampaign(campaign.id, payload);
      } else {
        await campaignApi.createCampaign(payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu chiến dịch.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa Chiến dịch Tiếp thị' : 'Tạo Chiến dịch Tiếp thị Mới'}
      subtitle="Quản lý kế hoạch chiến dịch, thời hạn triển khai và ngân sách"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Thông báo lỗi tổng quát */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Tên chiến dịch */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Tên chiến dịch <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Megaphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Khuyến mãi Mùa Thu 2026, Ra mắt Dòng Sản Phẩm Mới..."
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.name
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-[#3CB371]/20 focus:border-[#3CB371]'
              }`}
            />
          </div>
          {fieldErrors.name && (
            <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
          )}
        </div>

        {/* Khoảng thời gian triển khai (Start Date & End Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Ngày bắt đầu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.start_date
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-[#3CB371]/20 focus:border-[#3CB371]'
                }`}
              />
            </div>
            {fieldErrors.start_date && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Ngày kết thúc <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.end_date
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-[#3CB371]/20 focus:border-[#3CB371]'
                }`}
              />
            </div>
            {fieldErrors.end_date && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.end_date}</p>
            )}
          </div>
        </div>

        {/* Ngân sách chiến dịch (Budget) */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Ngân sách dự kiến (VNĐ)
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              name="budget"
              min="0"
              step="1000"
              value={formData.budget}
              onChange={handleChange}
              placeholder="VD: 50000000 (Để trống sẽ mặc định là 0)"
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.budget
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-[#3CB371]/20 focus:border-[#3CB371]'
              }`}
            />
          </div>
          {fieldErrors.budget ? (
            <p className="text-xs text-rose-600 mt-1">{fieldErrors.budget}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Ngân sách này được dùng làm mẫu số để tự động tính tỷ suất lợi nhuận ROI.
            </p>
          )}
        </div>

        {/* Mô tả chiến dịch */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Mô tả & Kế hoạch triển khai
          </label>
          <div className="relative">
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Chi tiết đối tượng khách hàng mục tiêu, kênh truyền thông, chương trình chiết khấu..."
              className="w-full p-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all resize-none"
            />
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{isEdit ? 'Lưu thay đổi' : 'Tạo chiến dịch'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
