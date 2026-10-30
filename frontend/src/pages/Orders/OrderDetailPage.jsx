import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import orderApi from '../../api/orderApi';
import {
  ShoppingCart,
  ArrowLeft,
  User,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
} from 'lucide-react';

const STATUS_BADGES = {
  COMPLETED: { label: 'Đã hoàn tất', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-[#EAF5EC] text-[#2E7D32] border-[#DDF0E2]' },
  PENDING: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

/**
 * OrderDetailPage - Xem Chi tiết Hóa đơn & Đơn hàng đã chốt
 * Tuân thủ SRS v1.1 Mục 3.12 (Make an Order), bảo tồn đơn giá tại thời điểm chốt
 */
export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const fetchOrderDetail = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await orderApi.getOrderById(id);
      // axiosClient unbox response.data -> res có thể là { success: true, data } hoặc order object trực tiếp
      const orderData = res.data?.data || res.data || (res?.id ? res : null);
      if (!orderData || !orderData.id) {
        throw new Error('Không tìm thấy thông tin đơn hàng.');
      }
      setOrder(orderData);

      // Nếu có query param ?print=true, tự động mở dialog in
      if (searchParams.get('print') === 'true') {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết đơn hàng:', err);
      setErrorMsg(
        err.response?.data?.message || err.message || 'Không tìm thấy hóa đơn hoặc đơn hàng này.'
      );
    } finally {
      setLoading(false);
    }
  }, [id, searchParams]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <div className="w-10 h-10 border-4 border-[#3CB371] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Đang tải hóa đơn đơn hàng #{id}...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Không tìm thấy đơn hàng</h2>
        <p className="text-sm text-gray-500 mb-6">
          {errorMsg || 'Đơn hàng không tồn tại trong hệ thống hoặc đã bị hủy.'}
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3CB371] text-white rounded-xl text-sm font-semibold hover:bg-[#38A169] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay Lại Danh Sách Đơn Hàng</span>
        </button>
      </div>
    );
  }

  const badge = STATUS_BADGES[order.status] || STATUS_BADGES.COMPLETED;
  const unitPrice = Number(order.unit_price || 0);
  const totalAmount = Number(order.total_amount || 0);
  const quantity = Number(order.quantity || 1);

  return (
    <div className="space-y-6">
      {/* Top Header & Thanh Điều Hướng (Ẩn khi In ấn) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 border border-gray-300 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            title="Quay lại danh sách đơn hàng"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                {order.order_code}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Hóa đơn xuất hàng bảo tồn giá bán tại thời điểm chốt • Mã ID #{order.id}
            </p>
          </div>
        </div>

        {/* Nút Hành Động */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            <span>In Phiếu Xuất Kho / Hóa Đơn</span>
          </button>

          {order.opportunity_id && (
            <Link
              to={`/opportunities/${order.opportunity_id}`}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#EAF5EC] border border-[#DDF0E2] text-[#2E7D32] hover:bg-[#DDF0E2] text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Xem Cơ Hội Bán Hàng #{order.opportunity_id}</span>
            </Link>
          )}
        </div>
      </div>

      {/* KHUNG HÓA ĐƠN CHÍNH (Được tối ưu để hiển thị và in ấn) */}
      <div className="bg-white border border-[#DDF0E2] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Banner Hóa Đơn Thương Mại */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-[#3CB371] font-extrabold text-xl">
              <ShoppingCart className="w-6 h-6" />
              <span>ZEN CRM • HÓA ĐƠN BÁN HÀNG</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Hệ thống Quản lý Quan hệ Khách hàng & Bán hàng Chuyên nghiệp
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-gray-400 font-mono">MÃ HÓA ĐƠN:</div>
            <div className="text-xl font-mono font-black text-[#2E7D32]">{order.order_code}</div>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center sm:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Ngày chốt: {formatDateTime(order.order_date)}</span>
            </div>
          </div>
        </div>

        {/* Lưới 3 Cột: Thông tin Khách hàng, Giao hàng, Nhân viên */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột 1: Khách hàng mua hàng (Lead) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#3CB371]" />
                <span>Khách Hàng Mua Hàng</span>
              </span>
              {order.lead_id && (
                <Link
                  to={`/leads/${order.lead_id}`}
                  className="text-xs font-semibold text-[#3CB371] hover:text-[#2E7D32] print:hidden flex items-center gap-1"
                >
                  <span>Hồ sơ</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
            <p className="font-bold text-gray-900 text-base">{order.lead_name}</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>SĐT: <strong>{order.lead_phone}</strong></p>
              {order.lead_email && <p>Email: {order.lead_email}</p>}
              {order.lead_address && <p className="text-gray-500">Đ/c thường trú: {order.lead_address}</p>}
            </div>
          </div>

          {/* Cột 2: Thông tin giao hàng & Thanh toán (SRS 3.12.3 REQ-1) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Địa Chỉ Nhận Hàng</span>
              </span>
            </div>
            <p className="font-medium text-gray-900 text-sm whitespace-pre-line">
              {order.shipping_address || 'Theo địa chỉ khách hàng'}
            </p>
            <div className="pt-1 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 text-[#2E7D32] font-semibold mt-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>{order.payment_info}</span>
              </div>
            </div>
          </div>

          {/* Cột 3: Nhân viên phụ trách & Nguồn gốc */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Thông Tin Quản Trị</span>
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1.5">
              <p>
                Nhân viên lập đơn: <strong>{order.created_by_name || 'Hệ thống'}</strong>
              </p>
              <p>
                Cơ hội liên kết:{' '}
                {order.opportunity_id ? (
                  <Link
                    to={`/opportunities/${order.opportunity_id}`}
                    className="font-semibold text-[#2E7D32] hover:underline print:text-gray-700 inline-flex items-center gap-1"
                  >
                    <span>Cơ hội #{order.opportunity_id}</span>
                    <ExternalLink className="w-3 h-3 print:hidden" />
                  </Link>
                ) : (
                  <strong>Không có</strong>
                )}
              </p>
              <p>
                Trạng thái thanh toán: <strong className="text-emerald-700">Đã xác nhận chốt</strong>
              </p>
              <p className="text-gray-400 text-xxs">
                Ghi nhận vào CSDL: {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Bảng Chi Tiết Sản Phẩm Xuất Kho */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#3CB371]" />
            <span>Chi Tiết Sản Phẩm & Giá Bán Bảo Tồn</span>
          </h2>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase font-bold text-gray-600">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Mã & Tên Sản Phẩm</th>
                  <th className="py-3 px-4 text-center">ĐVT</th>
                  <th className="py-3 px-4 text-right">Đơn Giá Chốt</th>
                  <th className="py-3 px-4 text-center">Số Lượng</th>
                  <th className="py-3 px-4 text-right">Thành Tiền (VND)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-4 px-4 text-gray-400 font-mono text-xs">01</td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-gray-900 text-base">{order.product_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700">
                        {order.product_code}
                      </code>
                      {order.product_id && (
                        <Link
                          to={`/products/${order.product_id}`}
                          className="text-xs text-[#3CB371] hover:underline print:hidden flex items-center gap-1"
                        >
                          <span>Xem sản phẩm</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600 text-xs">Cái</td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-800">
                    {unitPrice.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-gray-900 text-base">
                    {quantity}
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-[#2E7D32] text-base">
                    {totalAmount.toLocaleString('vi-VN')} ₫
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Khối Tổng Kết Tiền */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pt-4">
          <div className="text-xs text-gray-500 max-w-md space-y-1">
            <p className="font-semibold text-gray-700">Điều khoản thanh toán & Giao nhận:</p>
            <p>• Giá trên là giá bán chính thức đã được chốt và bảo tồn tại thời điểm lập đơn.</p>
            <p>• Hàng hóa được kiểm tra và xuất kho theo đúng quy chuẩn kiểm kê tồn kho Zen CRM.</p>
          </div>

          <div className="bg-[#EAF5EC] border border-[#DDF0E2] rounded-xl p-5 min-w-[280px] space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Cộng tiền hàng:</span>
              <span className="font-semibold">{totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Thuế GTGT (VAT 0%):</span>
              <span className="font-semibold">0 ₫</span>
            </div>
            <div className="pt-2 border-t border-[#DDF0E2] flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">TỔNG CỘNG THANH TOÁN:</span>
              <span className="text-xl font-black text-[#2E7D32]">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
        </div>

        {/* Khối Chữ Ký (Chỉ hiển thị khi In ấn) */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-xs">
          <div>
            <p className="font-bold uppercase text-gray-800">Người Mua Hàng / Nhận Hàng</p>
            <p className="text-gray-400 mt-1 italic">(Ký và ghi rõ họ tên)</p>
            <div className="h-20"></div>
            <p className="font-semibold text-gray-700">{order.lead_name}</p>
          </div>
          <div>
            <p className="font-bold uppercase text-gray-800">Người Lập Phiếu / Nhân Viên Bán Hàng</p>
            <p className="text-gray-400 mt-1 italic">(Ký và ghi rõ họ tên)</p>
            <div className="h-20"></div>
            <p className="font-semibold text-gray-700">{order.created_by_name || 'Zen CRM System'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
