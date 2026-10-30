import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productApi from '../../api/productApi';
import { useAuth } from '../../context/authContextDef';
import { useLanguage } from '../../context/LanguageContext';
import ProductModal from './ProductModal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Layers, 
  Edit3, 
  Trash2, 
  Target, 
  ShoppingCart, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isEn } = useLanguage();
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALE_MANAGER';

  const [product, setProduct] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('opportunities'); // 'opportunities' | 'orders'

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sửa & Xóa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    loading: false,
  });

  const fetchProductDetail = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await productApi.getProductById(id);
      setProduct(res.data?.product || res.product || null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || (isEn ? 'Product details not found.' : 'Không tìm thấy thông tin sản phẩm.'));
    } finally {
      setLoading(false);
    }
  }, [id, isEn]);

  const fetchOpportunities = useCallback(async () => {
    setTabLoading(true);
    try {
      const res = await productApi.getProductOpportunities(id);
      setOpportunities(res.data?.opportunities || res.opportunities || []);
    } catch {
      // Bỏ qua lỗi phụ
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  const fetchOrders = useCallback(async () => {
    setTabLoading(true);
    try {
      const res = await productApi.getProductOrders(id);
      setOrders(res.data?.orders || res.orders || []);
    } catch {
      // Bỏ qua lỗi phụ
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  useEffect(() => {
    if (activeTab === 'opportunities') {
      fetchOpportunities();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOpportunities, fetchOrders]);

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await productApi.deleteProduct(id);
      navigate('/products', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || (isEn ? 'Cannot delete product.' : 'Không thể xóa sản phẩm.'));
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(isoString)) {
        const [y, m, d] = isoString.slice(0, 10).split('-');
        return `${d}/${m}/${y}`;
      }
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  };

  const getOppStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-[#EAF5EC] text-[#2E7D32] border-[#DDF0E2]';
      case 'FOLLOWING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ORDERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="w-8 h-8 border-3 border-[#3CB371] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">{isEn ? 'Loading product profile...' : 'Đang tải hồ sơ sản phẩm...'}</p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">{isEn ? 'Product Not Found' : 'Không tìm thấy sản phẩm'}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">{errorMsg || (isEn ? 'Product does not exist or has been deleted.' : 'Sản phẩm không tồn tại hoặc đã bị xóa.')}</p>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3CB371] text-white rounded-xl text-sm font-semibold hover:bg-[#38A169] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEn ? 'Back to Warehouse Inventory' : 'Quay lại kho sản phẩm'}</span>
        </button>
      </div>
    );
  }

  // Tính tổng số lượng đã bán & tổng doanh thu thực tế
  const totalSoldQty = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title={isEn ? 'Back to products' : 'Quay lại danh sách'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
              <span className="text-xs px-2.5 py-0.5 bg-[#EAF5EC] text-[#2E7D32] font-mono font-semibold rounded-full border border-[#DDF0E2]">
                {product.product_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEn ? 'Category:' : 'Danh mục:'} <strong className="text-slate-700">{product.category_name || (isEn ? 'Unassigned' : 'Chưa gán')}</strong> &bull; {isEn ? 'Created date:' : 'Ngày tạo:'} {formatDate(product.created_at)}
            </p>
          </div>
        </div>

        {isManagerOrAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4 text-amber-600" />
              <span>{isEn ? 'Edit Product' : 'Sửa Sản Phẩm'}</span>
            </button>

            <button
              onClick={() => setDeleteConfirm({ isOpen: true, loading: false })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isEn ? 'Delete Product' : 'Xóa Sản Phẩm'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: 3 Thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EAF5EC] text-[#3CB371] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {isEn ? 'LISTED UNIT PRICE' : 'ĐƠN GIÁ NIÊM YẾT'}
            </span>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(product.unit_price)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {isEn ? 'CURRENT INVENTORY' : 'TỒN KHO HIỆN TẠI'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">{product.stock_qty}</span>
              {product.stock_qty <= 5 && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
                  {isEn ? 'Low stock warning' : 'Cảnh báo sắp hết'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {isEn ? 'ACTUAL REVENUE' : 'DOANH SỐ THỰC TẾ'}
            </span>
            <span className="text-2xl font-bold text-purple-700">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết sản phẩm */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#3CB371]" />
          <span>{isEn ? 'Product Specifications' : 'Thông Tin Chi Tiết Sản Phẩm'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase block">{isEn ? 'Product Code' : 'Mã Sản Phẩm'}</span>
            <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">{product.product_code}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase block">{isEn ? 'Category' : 'Danh Mục'}</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{product.category_name || (isEn ? 'Uncategorized' : 'Chưa phân loại')}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase block">{isEn ? 'Marketing Campaign' : 'Chiến Dịch Quảng Bá'}</span>
            <span className="font-semibold text-purple-700 text-sm mt-0.5 block">{product.campaign_name || (isEn ? 'None' : 'Không gắn')}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase block">{isEn ? 'Last Updated' : 'Cập Nhật Gần Nhất'}</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{formatDate(product.updated_at)}</span>
          </div>
        </div>

        {product.description && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">{isEn ? 'Product Description' : 'Mô Tả Sản Phẩm'}</span>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>

      {/* HAI TABS CON ĐẶC THÙ THEO SRS: SRS 3.16 & SRS 3.17 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'opportunities'
                ? 'border-[#3CB371] text-[#2E7D32] bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>{isEn ? 'Opportunities' : 'Cơ Hội Bán Hàng (Opportunities)'}</span>
            <span className="ml-1 px-2 py-0.5 bg-[#EAF5EC] text-[#2E7D32] rounded-full text-[11px] font-semibold border border-[#DDF0E2]">
              {opportunities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-[#3CB371] text-[#2E7D32] bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isEn ? 'Closed Orders' : 'Đơn Hàng Đã Bán (Orders)'}</span>
            <span className="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-semibold border border-emerald-200">
              {orders.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {tabLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-[#3CB371] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>{isEn ? 'Loading linked data...' : 'Đang tải dữ liệu liên kết...'}</span>
            </div>
          ) : activeTab === 'opportunities' ? (
            /* TAB 1: VIEW OPPORTUNITIES (SRS 3.16) */
            opportunities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Target className="w-12 h-12 text-slate-300 stroke-[1.5] mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-sm">
                  {isEn ? 'No sales opportunities interested in this product yet' : 'Chưa có cơ hội bán hàng nào quan tâm sản phẩm này'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEn ? 'When salespeople create opportunities linked to this product, they will appear here.' : 'Khi nhân viên bán hàng tạo Cơ hội gắn với sản phẩm này, danh sách sẽ hiển thị tại đây.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">{isEn ? 'Customer (Lead)' : 'Khách Hàng (Lead)'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Contact' : 'Liên Hệ'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Qty' : 'Số Lượng'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Stage' : 'Trạng Thái'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Expected Close' : 'Dự Kiến Đóng'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Assigned Salesperson' : 'Nhân Viên Phụ Trách'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opportunities.map((opp) => (
                      <tr
                        key={opp.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/opportunities/${opp.id}`)}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {`${opp.last_name || ''} ${opp.first_name || ''}`.trim() || `Lead #${opp.lead_id}`}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{opp.lead_email}</div>
                          <div className="text-slate-400">{opp.lead_phone}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {opp.quantity || 1}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getOppStatusBadge(
                              opp.status
                            )}`}
                          >
                            {opp.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {formatDate(opp.expected_close_date)}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {opp.salesman_name || (isEn ? 'Unassigned' : 'Chưa gán')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* TAB 2: VIEW ORDERS (SRS 3.17) */
            orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart className="w-12 h-12 text-slate-300 stroke-[1.5] mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-sm">
                  {isEn ? 'No orders recorded for this product yet' : 'Chưa có đơn hàng nào xuất bán sản phẩm này'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEn ? 'When an order is completed, order history and actual revenue will be tracked here.' : 'Khi chốt đơn hàng (Make an Order), lịch sử mua hàng và doanh thu thực tế sẽ tự động lưu vết tại đây.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Thanh tóm tắt bán hàng */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
                  <div className="flex items-center gap-4">
                    <span>{isEn ? 'Total orders closed:' : 'Tổng số đơn đã chốt:'} <strong>{orders.length}</strong></span>
                    <span>{isEn ? 'Total units sold:' : 'Tổng số lượng đã bán:'} <strong>{isEn ? `${totalSoldQty} units` : `${totalSoldQty} sản phẩm`}</strong></span>
                  </div>
                  <div>
                    <span>{isEn ? 'Total revenue generated:' : 'Tổng doanh số thu về:'} <strong className="text-emerald-700 text-sm font-bold">{formatCurrency(totalRevenue)}</strong></span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">{isEn ? 'Order Code' : 'Mã Đơn Hàng'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Order Date' : 'Ngày Đặt'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Customer' : 'Khách Hàng'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Qty' : 'Số Lượng'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Unit Price' : 'Đơn Giá'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Total Amount' : 'Tổng Tiền'}</th>
                        <th className="py-2.5 px-3">{isEn ? 'Status' : 'Trạng Thái'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((ord) => (
                        <tr
                          key={ord.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/orders/${ord.id}`)}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-[#3CB371]">
                            {ord.order_code}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {formatDate(ord.order_date)}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {`${ord.last_name || ''} ${ord.first_name || ''}`.trim() || `Customer #${ord.lead_id}`}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {ord.quantity}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {formatCurrency(ord.unit_price)}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-600">
                            {formatCurrency(ord.total_amount)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {ord.status || 'ORDERED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal Sửa Sản Phẩm */}
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
        onSuccess={fetchProductDetail}
      />

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={isEn ? 'Confirm Product Deletion' : 'Xác nhận xóa Sản phẩm Kho'}
        message={
          isEn
            ? `Are you sure you want to delete product "${product.name}"? The system will block deletion if the product is linked to opportunities or orders.`
            : `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"? Hệ thống sẽ chặn xóa nếu sản phẩm đã phát sinh cơ hội bán hàng hoặc đơn hàng.`
        }
        confirmText={isEn ? 'Delete Product' : 'Xác nhận xóa'}
        confirmType="danger"
        loading={deleteConfirm.loading}
        onClose={() => setDeleteConfirm({ isOpen: false, loading: false })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
