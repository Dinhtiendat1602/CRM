import { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../../components/Common/Modal';
import oppApi from '../../api/oppApi';
import leadApi from '../../api/leadApi';
import productApi from '../../api/productApi';
import { 
  User, 
  Package, 
  Calendar, 
  AlertCircle, 
  Loader2, 
  Coins, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';

const INITIAL_FORM = {
  lead_id: '',
  product_id: '',
  quantity: 1,
  expected_close_date: '',
  status: 'NEW',
  notes: '',
  confirm_duplicate: false,
};

export default function OpportunityModal({ 
  isOpen, 
  onClose, 
  opportunity, 
  initialLeadId, 
  initialProductId, 
  onSuccess 
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const isEdit = Boolean(opportunity?.id);

  // Load danh sách Leads, Products và Statuses khi modal mở
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      setErrorMsg('');
      try {
        const [leadRes, prodRes, statusRes] = await Promise.all([
          leadApi.getLeads({ limit: 100 }),
          productApi.getProducts({ limit: 100 }),
          oppApi.getStatuses(),
        ]);

        if (isMounted) {
          setLeads(leadRes.data?.data || leadRes.data || leadRes.leads || []);
          setProducts(prodRes.products || prodRes.data?.products || prodRes.data || []);
          setStatuses(statusRes.data?.data || statusRes.data || statusRes.statuses || []);
        }
      } catch (err) {
        console.error('Lỗi nạp dữ liệu ban đầu cho Opportunity Modal:', err);
        if (isMounted) {
          setErrorMsg('Không thể nạp danh sách khách hàng hoặc sản phẩm.');
        }
      } finally {
        if (isMounted) {
          setLoadingInitial(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Khởi tạo form khi modal mở hoặc thay đổi opportunity
  useEffect(() => {
    if (opportunity) {
      setFormData({
        lead_id: opportunity.lead_id || '',
        product_id: opportunity.product_id || '',
        quantity: opportunity.quantity || 1,
        expected_close_date: opportunity.expected_close_date 
          ? opportunity.expected_close_date.split('T')[0] 
          : '',
        status: opportunity.status || 'NEW',
        notes: opportunity.notes || '',
        confirm_duplicate: false,
      });
      setDuplicateWarning(null);
    } else {
      setFormData({
        ...INITIAL_FORM,
        lead_id: initialLeadId || '',
        product_id: initialProductId || '',
      });
      setDuplicateWarning(null);
    }
    setFieldErrors({});
    setErrorMsg('');
  }, [opportunity, initialLeadId, initialProductId, isOpen]);

  // Kiểm tra trùng lặp realtime khi người dùng chọn xong Khách hàng và Sản phẩm (SRS 3.6.2 REQ-4, BR-02)
  const checkDuplicate = useCallback(async (leadId, prodId) => {
    if (!leadId || !prodId || isEdit) {
      setDuplicateWarning(null);
      return;
    }

    try {
      const res = await oppApi.checkDuplicate({
        lead_id: leadId,
        product_id: prodId,
      });

      if (res.data?.isDuplicate) {
        setDuplicateWarning(res.data.message);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error('Lỗi kiểm tra trùng lặp cơ hội:', err);
    }
  }, [isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newVal };

      if (name === 'lead_id' || name === 'product_id') {
        const targetLead = name === 'lead_id' ? value : updated.lead_id;
        const targetProd = name === 'product_id' ? value : updated.product_id;
        checkDuplicate(targetLead, targetProd);
      }

      return updated;
    });

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMsg) setErrorMsg('');
  };

  // Tìm sản phẩm đang được chọn để hiển thị thông số và tính toán giá trị
  const selectedProduct = useMemo(() => {
    if (!formData.product_id) return null;
    return products.find((p) => String(p.id) === String(formData.product_id));
  }, [products, formData.product_id]);

  // Tìm khách hàng đang được chọn
  const selectedLead = useMemo(() => {
    if (!formData.lead_id) return null;
    return leads.find((l) => String(l.id) === String(formData.lead_id));
  }, [leads, formData.lead_id]);

  // Tính nhẩm giá trị ước tính
  const estimatedTotal = useMemo(() => {
    const qty = parseInt(formData.quantity, 10) || 0;
    const price = selectedProduct ? parseFloat(selectedProduct.unit_price) || 0 : 0;
    return qty * price;
  }, [formData.quantity, selectedProduct]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.lead_id) {
      errors.lead_id = 'Vui lòng chọn khách hàng tiềm năng.';
    }
    if (!formData.product_id) {
      errors.product_id = 'Vui lòng chọn sản phẩm khách quan tâm.';
    }
    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = 'Số lượng phải là số nguyên dương lớn hơn 0.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        lead_id: parseInt(formData.lead_id, 10),
        product_id: parseInt(formData.product_id, 10),
        quantity: parseInt(formData.quantity, 10),
        expected_close_date: formData.expected_close_date || null,
        status: formData.status,
        notes: formData.notes ? formData.notes.trim() : null,
        confirm_duplicate: formData.confirm_duplicate,
      };

      if (isEdit) {
        await oppApi.updateOpportunity(opportunity.id, payload);
      } else {
        await oppApi.createOpportunity(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi lưu cơ hội bán hàng:', err);
      // Xử lý mã lỗi 409 Conflict (Trùng lặp cơ hội)
      if (err.response?.status === 409) {
        setDuplicateWarning(err.response?.data?.message || 'Phát hiện cơ hội trùng lặp.');
        setErrorMsg('Khách hàng này đã có cơ hội chưa đóng cho sản phẩm này. Nếu vẫn muốn tạo, vui lòng tích chọn xác nhận bên dưới.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu cơ hội bán hàng.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh Sửa Cơ Hội: #${opportunity.id}` : 'Thêm Cơ Hội Bán Hàng Mới'}
      maxWidth="max-w-3xl"
    >
      {loadingInitial ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#3CB371] mb-2" />
          <p className="text-sm">Đang tải danh sách khách hàng và sản phẩm...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{errorMsg}</div>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 rounded-r-lg flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{duplicateWarning}</div>
              </div>
              {!isEdit && (
                <label className="flex items-center gap-2 mt-1 cursor-pointer select-none text-xs font-semibold text-amber-900 bg-amber-100/60 p-2 rounded">
                  <input
                    type="checkbox"
                    name="confirm_duplicate"
                    checked={formData.confirm_duplicate}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-[#3CB371] accent-[#3CB371] focus:ring-[#3CB371] border-gray-300"
                  />
                  <span>Tôi xác nhận vẫn muốn tạo thêm cơ hội này cho khách hàng</span>
                </label>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Khách hàng tiềm năng (Lead) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Khách Hàng Tiềm Năng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <select
                  name="lead_id"
                  value={formData.lead_id}
                  onChange={handleChange}
                  disabled={isEdit && opportunity.status === 'ORDERED'}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    fieldErrors.lead_id 
                      ? 'border-red-400 focus:ring-red-300' 
                      : 'border-gray-300 focus:ring-[#3CB371]/20 focus:border-[#3CB371]'
                  }`}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.full_name || `${l.last_name || ''} ${l.first_name || ''}`} - {l.phone || l.email}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.lead_id && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.lead_id}</p>
              )}
              {selectedLead && (
                <p className="text-xs text-gray-500 mt-1">
                  Email: <span className="font-medium text-gray-700">{selectedLead.email}</span> | SĐT: <span className="font-medium text-gray-700">{selectedLead.phone}</span>
                </p>
              )}
            </div>

            {/* 2. Sản phẩm quan tâm (Product) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Sản Phẩm Quan Tâm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Package className="w-4 h-4" />
                </div>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  disabled={isEdit && opportunity.status === 'ORDERED'}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    fieldErrors.product_id 
                      ? 'border-red-400 focus:ring-red-300' 
                      : 'border-gray-300 focus:ring-[#3CB371]/20 focus:border-[#3CB371]'
                  }`}
                >
                  <option value="">-- Chọn sản phẩm quan tâm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.product_code}] {p.name} - {Number(p.unit_price).toLocaleString('vi-VN')} ₫ (Kho: {p.stock_qty})
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.product_id && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.product_id}</p>
              )}
              {selectedProduct && (
                <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                  <span>Đơn giá: <strong className="text-[#2E7D32]">{Number(selectedProduct.unit_price).toLocaleString('vi-VN')} ₫</strong></span>
                  <span>•</span>
                  <span>Tồn kho: <strong className={selectedProduct.stock_qty <= 5 ? 'text-amber-600' : 'text-emerald-600'}>{selectedProduct.stock_qty}</strong></span>
                </div>
              )}
            </div>

            {/* 3. Số lượng (Quantity) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Số Lượng Nhu Cầu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Layers className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.quantity 
                      ? 'border-red-400 focus:ring-red-300' 
                      : 'border-gray-300 focus:ring-[#3CB371]/20 focus:border-[#3CB371]'
                  }`}
                  placeholder="1"
                />
              </div>
              {fieldErrors.quantity && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.quantity}</p>
              )}
            </div>

            {/* 4. Trạng thái cơ hội (Status) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Trạng Thái Tiến Trình <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isEdit && opportunity.status === 'ORDERED'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] bg-white"
              >
                {statuses.length > 0 ? (
                  statuses.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label} ({s.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="NEW">Mới tạo (NEW)</option>
                    <option value="CONTACTED">Đã liên hệ (CONTACTED)</option>
                    <option value="QUALIFIED">Đủ điều kiện (QUALIFIED)</option>
                    <option value="PROPOSAL">Gửi báo giá (PROPOSAL)</option>
                    <option value="ORDERED">Đã chốt đơn (ORDERED)</option>
                    <option value="LOST">Thất bại/Hủy (LOST)</option>
                  </>
                )}
              </select>
            </div>

            {/* 5. Ngày dự kiến chốt (Expected Close Date) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ngày Dự Kiến Chốt Đơn (Expected Close Date)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  name="expected_close_date"
                  value={formData.expected_close_date}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
                />
              </div>
            </div>

            {/* 6. Ghi chú nhu cầu (Notes) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ghi Chú Nhu Cầu & Đặc Điểm Khách Hàng
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
                placeholder="Ví dụ: Khách quan tâm cấu hình Core i7, yêu cầu xuất hóa đơn VAT, giao hàng tại chi nhánh Quận 1..."
              />
            </div>
          </div>

          {/* Thẻ tóm tắt giá trị dự kiến (Estimated Opportunity Value) */}
          <div className="bg-[#EAF5EC] border border-[#DDF0E2] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#3CB371] text-white flex items-center justify-center shadow-xs">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#1F2937]">
                  Giá Trị Dự Kiến Ước Tính (Estimated Value)
                </p>
                <p className="text-xs text-[#6B7280]">
                  {formData.quantity || 0} sản phẩm × {selectedProduct ? Number(selectedProduct.unit_price).toLocaleString('vi-VN') : '0'} ₫
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-[#2E7D32]">
                {Number(estimatedTotal).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDF0E2]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#1F2937] bg-[#F3F4F6] hover:bg-[#EAF5EC] rounded-xl transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#3CB371] rounded-xl hover:bg-[#38A169] transition-colors shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Cập Nhật Cơ Hội' : 'Tạo Cơ Hội'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
