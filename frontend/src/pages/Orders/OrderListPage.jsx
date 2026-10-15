import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import orderApi from '../../api/orderApi';
import Pagination from '../../components/Common/Pagination';
import SearchInput from '../../components/Common/SearchInput';
import {
  ShoppingCart,
  Eye,
  Calendar,
  DollarSign,
  Package,
  User,
  ArrowUpDown,
  CreditCard,
  FileText,
  AlertCircle,
  ExternalLink,
  Printer,
  RotateCcw,
} from 'lucide-react';

const STATUS_BADGES = {
  COMPLETED: { label: 'Đã hoàn tất', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  PENDING: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

/**
 * OrderListPage - Quản lý Danh sách Đơn hàng & Hóa đơn xuất kho
 * Tuân thủ SRS v1.1 Mục 3.12, BR-03 (Phân trang 20 dòng), BR-05 (Khoảng ngày)
 */
export default function OrderListPage() {
  const navigate = useNavigate();

  // Danh sách và trạng thái tải
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Bộ lọc, tìm kiếm và sắp xếp
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Thống kê tổng hợp (KPI)
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalItems: 0,
  });

  // Phân trang chuẩn 20 dòng theo BR-03
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalRecords: 0,
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        page: pagination.page,
        limit: 20, // Chuẩn BR-03
        search: search.trim() || undefined,
        status: status || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        sortBy,
        sortOrder,
      };

      const res = await orderApi.getOrders(params);

      // axiosClient đã bóc response.data -> res chứa { success, data, pagination, summary }
      const orderList = res.data || [];
      setOrders(orderList);

      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: res.pagination.totalPages || 1,
          totalRecords: res.pagination.total || orderList.length,
        }));
      }

      if (res.summary) {
        setSummary({
          totalOrders: res.summary.totalOrders || 0,
          totalRevenue: res.summary.totalRevenue || 0,
          totalItems: res.summary.totalItems || 0,
        });
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng:', err);
      setErrorMsg(
        err.response?.data?.message || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, status, fromDate, toDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setFromDate('');
    setToDate('');
    setSortBy('order_date');
    setSortOrder('DESC');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleToggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header & Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            <span>Quản Lý Đơn Hàng (Orders)</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi hóa đơn đã chốt, bảo toàn giá bán niêm yết tại thời điểm xuất kho (SRS 3.12)
          </p>
        </div>

        <button
          onClick={() => navigate('/opportunities')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto hover:shadow-md"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>+ Chốt Đơn Từ Cơ Hội</span>
        </button>
      </div>

      {/* Thẻ Thống kê KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Tổng số đơn hàng */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Tổng Đơn Hàng</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
              {summary.totalOrders} <span className="text-xs font-normal text-gray-500">đơn</span>
            </p>
          </div>
        </div>

        {/* Card 2: Tổng doanh thu đã chốt */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Tổng Doanh Thu</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              {Number(summary.totalRevenue || 0).toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        {/* Card 3: Tổng sản phẩm xuất kho */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Sản Phẩm Xuất Kho</p>
            <p className="text-2xl font-extrabold text-purple-700 mt-0.5">
              {summary.totalItems} <span className="text-xs font-normal text-gray-500">sản phẩm</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Tìm kiếm đa năng */}
          <div className="md:col-span-4">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Tìm mã đơn, tên khách, sản phẩm..."
            />
          </div>

          {/* Lọc trạng thái đơn */}
          <div className="md:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="COMPLETED">Đã hoàn tất (COMPLETED)</option>
              <option value="PROCESSING">Đang xử lý (PROCESSING)</option>
              <option value="PENDING">Chờ thanh toán (PENDING)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>

          {/* Lọc từ ngày (BR-05) */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                title="Lọc từ ngày chốt đơn"
              />
            </div>
          </div>

          {/* Lọc đến ngày (BR-05) */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                title="Lọc đến ngày chốt đơn"
              />
            </div>
          </div>

          {/* Nút Đặt lại bộ lọc */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt Lại</span>
            </button>
          </div>
        </div>

        {/* Thông tin quy chuẩn & Sắp xếp */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div>
            Quy chuẩn: <strong>20 đơn hàng/trang (BR-03)</strong> • Bộ lọc ngày (BR-05)
          </div>
          <div className="flex items-center gap-2">
            <span>Sắp xếp theo:</span>
            <button
              onClick={() => handleToggleSort('order_date')}
              className={`px-2 py-1 rounded-lg border font-medium flex items-center gap-1 ${
                sortBy === 'order_date'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>Ngày chốt</span>
              {sortBy === 'order_date' && (
                <ArrowUpDown className="w-3 h-3 text-blue-600" />
              )}
            </button>
            <button
              onClick={() => handleToggleSort('total_amount')}
              className={`px-2 py-1 rounded-lg border font-medium flex items-center gap-1 ${
                sortBy === 'total_amount'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>Tổng tiền</span>
              {sortBy === 'total_amount' && (
                <ArrowUpDown className="w-3 h-3 text-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo Lỗi nếu có */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bảng Dữ Liệu Đơn Hàng */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-600 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã Đơn Hàng</th>
                <th className="py-3.5 px-4">Khách Hàng (Lead)</th>
                <th className="py-3.5 px-4">Sản Phẩm Xuất Kho</th>
                <th className="py-3.5 px-4 text-center">Số Lượng</th>
                <th className="py-3.5 px-4 text-right">Đơn Giá Chốt</th>
                <th className="py-3.5 px-4 text-right">Tổng Tiền</th>
                <th className="py-3.5 px-4">Thanh Toán</th>
                <th className="py-3.5 px-4">Ngày Chốt Đơn</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Đang tải danh sách đơn hàng...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700 text-base">Không tìm thấy đơn hàng nào</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                      Chưa có đơn hàng nào khớp với điều kiện tìm kiếm. Bạn có thể chốt đơn mới trực tiếp từ màn hình Cơ hội bán hàng.
                    </p>
                    <button
                      onClick={() => navigate('/opportunities')}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <span>Xem Danh Sách Cơ Hội</span>
                    </button>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  return (
                    <tr key={ord.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Mã Đơn Hàng */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => navigate(`/orders/${ord.id}`)}
                          className="font-mono font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-colors inline-flex items-center gap-1"
                        >
                          <span>{ord.order_code}</span>
                          <ExternalLink className="w-3 h-3 text-blue-500" />
                        </button>
                      </td>

                      {/* Khách Hàng (Lead) */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {ord.lead_name || `Khách hàng #${ord.lead_id}`}
                          </p>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{ord.lead_phone}</span>
                            {ord.lead_email && (
                              <>
                                <span>•</span>
                                <span className="line-clamp-1">{ord.lead_email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sản Phẩm */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">{ord.product_name}</p>
                          <code className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                            {ord.product_code}
                          </code>
                        </div>
                      </td>

                      {/* Số Lượng */}
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                        {ord.quantity}
                      </td>

                      {/* Đơn Giá Chốt */}
                      <td className="py-3.5 px-4 text-right text-gray-600 text-xs">
                        {Number(ord.unit_price || 0).toLocaleString('vi-VN')} ₫
                      </td>

                      {/* Tổng Tiền */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-emerald-700 text-sm">
                          {Number(ord.total_amount || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      </td>

                      {/* Phương Thức Thanh Toán */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs">
                        <div className="flex items-center gap-1.5" title={ord.payment_info}>
                          <CreditCard className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{ord.payment_info || 'Chưa cập nhật'}</span>
                        </div>
                      </td>

                      {/* Ngày Chốt Đơn */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{new Date(ord.order_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>

                      {/* Thao Tác */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/orders/${ord.id}`)}
                            title="Xem chi tiết hóa đơn & xuất hàng"
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/orders/${ord.id}?print=true`)}
                            title="In hóa đơn đơn hàng"
                            className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân Trang (BR-03) */}
        {!loading && orders.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs text-gray-500">
              Hiển thị tối đa <strong>20 đơn/trang (BR-03)</strong> • Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.totalRecords} đơn hàng)
            </span>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
