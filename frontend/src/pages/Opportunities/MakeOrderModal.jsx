import { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  User,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import oppApi from '../../api/oppApi';

const PAYMENT_PRESETS = [
  'Thanh toán tiền mặt khi nhận hàng (COD)',
  'Chuyển khoản ngân hàng (Đã xác nhận)',
  'Thanh toán qua Thẻ tín dụng / Thẻ ghi nợ',
  'Công nợ thanh toán trong vòng 30 ngày',
];

/**
 * MakeOrderModal - Modal Chốt đơn hàng từ Cơ hội bán hàng (Make an Order)
 * Tuân thủ nghiêm ngặt SRS v1.1 Mục 3.12 (Make an Order), BR-03 (Transaction ACID), BR-07
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - opportunity: Object (lead_name, product_name, unit_price, quantity, stock_qty, lead_address...)
 * - onSuccess: (createdOrder) => void
 */
export default function MakeOrderModal({ isOpen, onClose, opportunity, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [orderDate, setOrderDate] = useState('');
  const [paymentPreset, setPaymentPreset] = useState(PAYMENT_PRESETS[0]);
  const [paymentDetail, setPaymentDetail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (opportunity && isOpen) {
      const initQty = Number(opportunity.quantity) > 0 ? Number(opportunity.quantity) : 1;
      setQuantity(initQty);
      
      // Ngày hiện tại định dạng YYYY-MM-DD
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const localDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      setOrderDate(localDate);

      // Điền địa chỉ khách hàng nếu có
      setShippingAddress(opportunity.lead_address || '');
      setPaymentPreset(PAYMENT_PRESETS[0]);
      setPaymentDetail('');
      setNotes('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [opportunity, isOpen]);

  if (!isOpen || !opportunity) return null;

  const unitPrice = Number(opportunity.unit_price || 0);
  const stockQty = Number(opportunity.stock_qty || 0);
  const numQuantity = Number(quantity) || 0;
  const totalAmount = numQuantity * unitPrice;
  const isStockInsufficient = numQuantity > stockQty;
  const remainingStockAfter = stockQty - numQuantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Kiểm tra số lượng hợp lệ
    if (numQuantity <= 0) {
      setErrorMessage('Số lượng chốt đơn phải lớn hơn 0.');
      return;
    }

    // Cảnh báo tồn kho không đủ (SRS 3.12, AC-08)
    if (isStockInsufficient) {
      setErrorMessage(
        `Số lượng yêu cầu (${numQuantity}) vượt quá tồn kho hiện có (${stockQty} sản phẩm)! Vui lòng điều chỉnh lại.`
      );
      return;
    }

    // Ghép thông tin thanh toán (bắt buộc theo SRS 3.12.3 REQ-1)
    const finalPaymentInfo = paymentDetail.trim()
      ? `${paymentPreset} - ${paymentDetail.trim()}`
      : paymentPreset;

    if (!finalPaymentInfo.trim()) {
      setErrorMessage('Thông tin phương thức thanh toán là bắt buộc khi chốt đơn.');
      return;
    }

    // Kiểm tra địa chỉ giao hàng (bắt buộc theo SRS 3.12.3 REQ-1)
    if (!shippingAddress.trim()) {
      setErrorMessage('Địa chỉ giao hàng là bắt buộc khi chốt đơn.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        quantity: numQuantity,
        order_date: orderDate || undefined,
        payment_info: finalPaymentInfo,
        shipping_address: shippingAddress.trim(),
        notes: notes.trim() || undefined,
      };

      const res = await oppApi.makeOrder(opportunity.id, payload);
      const createdOrder = res.data || res;

      setSuccessMessage(
        `Chốt đơn thành công! Mã đơn: ${createdOrder.order_code || 'Mới'}. Đang cập nhật hệ thống...`
      );

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(createdOrder);
        }
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Lỗi khi chốt đơn hàng:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Không thể thực hiện chốt đơn hàng. Vui lòng thử lại.';
      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-[#EAF5EC] border-b border-[#DDF0E2] text-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#DDF0E2] flex items-center justify-center text-[#3CB371] shadow-2xs">
              <ShoppingBag className="w-5 h-5 text-[#3CB371]" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight text-[#1F2937]">Chốt Đơn Hàng (Make an Order)</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Chuyển Cơ Hội #{opportunity.id} thành Hóa đơn xuất kho chính thức
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Thông báo Lỗi & Thành công */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold">Không thể chốt đơn</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">
                <p className="font-semibold">Thành công</p>
                <p className="text-xs mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Tóm tắt Khách hàng & Sản phẩm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Khách hàng nhận hàng (Lead)</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">
                {opportunity.lead_name || `Khách hàng #${opportunity.lead_id}`}
              </p>
              {opportunity.lead_phone && (
                <p className="text-slate-600">SĐT: {opportunity.lead_phone}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider">
                <Package className="w-3.5 h-3.5 text-purple-600" />
                <span>Sản phẩm xuất kho</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{opportunity.product_name}</p>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                  {opportunity.product_code}
                </span>
                <span className="text-slate-600 font-semibold">
                  Tồn kho: <strong className={stockQty > 0 ? 'text-emerald-700' : 'text-red-600'}>{stockQty}</strong> cái
                </span>
              </div>
            </div>
          </div>

          {/* Hàng 1: Số lượng chốt đơn & Ngày chốt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Số Lượng Chốt Đơn <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={stockQty > 0 ? stockQty : 99999}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border ${
                    isStockInsufficient
                      ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]'
                  }`}
                  placeholder="Nhập số lượng..."
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-gray-400">cái</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">
                  Đơn vị tính: <strong>cái</strong>
                </span>
                <span
                  className={`font-medium ${
                    isStockInsufficient
                      ? 'text-red-600 font-bold'
                      : remainingStockAfter < 5
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  Kho sau chốt: {isStockInsufficient ? 'KHÔNG ĐỦ' : `${remainingStockAfter} cái`}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Ngày Chốt Đơn Hàng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
                  required
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Ngày ghi nhận doanh thu và trừ tồn kho
              </span>
            </div>
          </div>

          {/* Hàng 2: Thông tin thanh toán (SRS 3.12.3 REQ-1) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Phương Thức & Thông Tin Thanh Toán <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setPaymentPreset(preset)}
                  className={`p-2.5 text-left text-xs rounded-xl border transition-all flex items-center gap-2 ${
                    paymentPreset === preset
                      ? 'border-[#3CB371] bg-[#EAF5EC] text-[#2E7D32] font-bold shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <CreditCard className={`w-3.5 h-3.5 ${paymentPreset === preset ? 'text-[#3CB371]' : 'text-gray-400'}`} />
                  <span className="line-clamp-1">{preset}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={paymentDetail}
              onChange={(e) => setPaymentDetail(e.target.value)}
              placeholder="Chi tiết thanh toán bổ sung (ví dụ: Đã nhận cọc 50%, số còn lại thu COD...)"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
            />
          </div>

          {/* Hàng 3: Địa chỉ nhận hàng (SRS 3.12.3 REQ-1) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Địa Chỉ Giao Hàng & Nhận Hàng <span className="text-red-500">*</span></span>
            </label>
            <textarea
              rows="2"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Nhập địa chỉ nhận hàng chi tiết của khách hàng..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
              required
            />
          </div>

          {/* Hàng 4: Ghi chú chốt đơn */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>Ghi Chú Đơn Hàng (Tùy chọn)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm: Yêu cầu giao giờ hành chính, đóng gói kèm quà tặng..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
            />
          </div>

          {/* Card Tổng Tiền Realtime */}
          <div className="p-4 bg-[#EAF5EC] rounded-xl border border-[#DDF0E2] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase font-semibold text-[#2E7D32]">Giá Trị Đơn Hàng Bảo Tồn</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {numQuantity} cái × {unitPrice.toLocaleString('vi-VN')} ₫/cái
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Tổng Tiền Thanh Toán:</span>
              <span className="text-2xl font-black text-[#2E7D32]">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* Cảnh báo Tồn kho đỏ nếu vượt quá */}
          {isStockInsufficient && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Cảnh báo: Kho hiện chỉ còn <strong>{stockQty}</strong> sản phẩm. Hệ thống sẽ tự động hủy giao dịch (Rollback) nếu số lượng chốt lớn hơn tồn kho.
              </span>
            </div>
          )}

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading || isStockInsufficient || numQuantity <= 0}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all ${
                loading || isStockInsufficient || numQuantity <= 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] hover:shadow-lg active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang Chốt Đơn (ACID Tx)...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Xác Nhận Chốt Đơn Hàng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
