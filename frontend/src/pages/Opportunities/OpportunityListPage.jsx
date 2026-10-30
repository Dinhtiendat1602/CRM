import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import oppApi from '../../api/oppApi';
import Pagination from '../../components/Common/Pagination';
import SearchInput from '../../components/Common/SearchInput';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import OpportunityModal from './OpportunityModal';
import FollowUpModal from './FollowUpModal';
import MakeOrderModal from './MakeOrderModal';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Briefcase, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  MessageSquarePlus, 
  Calendar, 
  Coins, 
  AlertCircle, 
  ArrowUpDown, 
  CheckCircle2, 
  Package,
  ShoppingBag
} from 'lucide-react';

const STATUS_BADGES = {
  NEW: { label: 'Mới tạo', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  CONTACTED: { label: 'Đã liên hệ', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  QUALIFIED: { label: 'Đủ điều kiện', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  PROPOSAL: { label: 'Gửi báo giá', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  ORDERED: { label: 'Đã chốt đơn', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  LOST: { label: 'Thất bại/Hủy', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export default function OpportunityListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, isEn } = useLanguage();

  const getStatusBadge = (statusCode) => {
    const badges = {
      NEW: { label: isEn ? 'New' : 'Mới tạo', color: 'bg-slate-100 text-slate-800 border-slate-300' },
      CONTACTED: { label: isEn ? 'Contacted' : 'Đã liên hệ', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      QUALIFIED: { label: isEn ? 'Qualified' : 'Đủ điều kiện', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      PROPOSAL: { label: isEn ? 'Proposal' : 'Gửi báo giá', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      ORDERED: { label: isEn ? 'Ordered' : 'Đã chốt đơn', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      LOST: { label: isEn ? 'Lost' : 'Thất bại/Hủy', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    };
    return badges[statusCode] || badges.NEW;
  };

  // State dữ liệu & phân trang (BR-03: limit=20)
  const [opportunities, setOpportunities] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1,
  });

  // State bộ lọc (SRS 3.7, 3.8, BR-04, BR-05)
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const [y, m, d] = dateStr.slice(0, 10).split('-');
        return `${d}/${m}/${y}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };
  const [initialLeadId, setInitialLeadId] = useState(null);
  const [initialProductId, setInitialProductId] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetOpp, setFollowUpTargetOpp] = useState(null);
  const [makeOrderState, setMakeOrderState] = useState({ isOpen: false, opportunity: null });

  // Tự động mở modal khi có query param từ trang Lead hoặc Product
  useEffect(() => {
    const leadIdParam = searchParams.get('createForLead');
    const prodIdParam = searchParams.get('createForProduct');
    if (leadIdParam || prodIdParam) {
      setInitialLeadId(leadIdParam || null);
      setInitialProductId(prodIdParam || null);
      setSelectedOpp(null);
      setIsOppModalOpen(true);
    }
  }, [searchParams]);

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    opportunity: null,
    loading: false,
  });

  // Fetch danh sách cơ hội
  const fetchOpportunities = useCallback(async () => {
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

      const res = await oppApi.getOpportunities(params);
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res.data?.data || [];
      const meta = res.pagination || res.data?.pagination || {};

      setOpportunities(data);
      setPagination((prev) => ({
        ...prev,
        totalRecords: meta.total ?? meta.totalRecords ?? data.length,
        totalPages: meta.totalPages ?? 1,
      }));
    } catch (err) {
      console.error('Lỗi nạp danh sách cơ hội bán hàng:', err);
      setErrorMsg(isEn ? 'Unable to load opportunities list. Please try again.' : 'Không thể tải danh sách cơ hội bán hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, status, fromDate, toDate, sortBy, sortOrder, isEn]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Xử lý mở modal thêm mới
  const handleOpenCreateModal = () => {
    setSelectedOpp(null);
    setIsOppModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa
  const handleOpenEditModal = (opp) => {
    setSelectedOpp(opp);
    setIsOppModalOpen(true);
  };

  // Xử lý mở modal ghi nhận follow-up nhanh
  const handleOpenFollowUpModal = (opp) => {
    setFollowUpTargetOpp(opp);
    setIsFollowUpModalOpen(true);
  };

  // Đổi chiều sắp xếp
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
  };

  // Xóa cơ hội
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.opportunity) return;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await oppApi.deleteOpportunity(deleteConfirm.opportunity.id);
      setDeleteConfirm({ isOpen: false, opportunity: null, loading: false });
      fetchOpportunities();
    } catch (err) {
      console.error('Lỗi xóa cơ hội bán hàng:', err);
      alert(err.response?.data?.message || (isEn ? 'Unable to delete this sales opportunity.' : 'Không thể xóa cơ hội bán hàng này.'));
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  // Tính tổng giá trị ước tính của các cơ hội hiển thị trên trang hiện tại
  const currentTotalValue = opportunities.reduce(
    (sum, o) => sum + (parseFloat(o.estimated_value) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {!fromDate && !toDate && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EAF5EC] text-[#2E7D32] border border-[#DDF0E2] shadow-2xs"
              title={isEn ? 'System optimizes data loading for the last 1 year by default.' : 'Hệ thống mặc định tối ưu tải cơ hội bán hàng trong 1 năm gần nhất.'}
            >
              <Calendar className="w-3.5 h-3.5 text-[#3CB371]" />
              <span>{t('oneYearData')}</span>
            </span>
          )}
          <span className="text-xs text-[#6B7280]">
            {isEn ? 'Total:' : 'Tổng cộng:'} <strong className="text-[#1F2937]">{pagination.totalRecords}</strong> {isEn ? 'opportunities' : 'cơ hội'}
          </span>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3CB371] hover:bg-[#38A169] text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('oppAddNew')}</span>
        </button>
      </div>

      {/* Cards thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DDF0E2] rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EAF5EC] text-[#3CB371] flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-[#6B7280]">{isEn ? 'TOTAL OPPORTUNITIES' : 'Tổng Số Cơ Hội'}</p>
            <p className="text-2xl font-bold text-[#1F2937]">{pagination.totalRecords}</p>
          </div>
        </div>

        <div className="bg-white border border-[#DDF0E2] rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-[#6B7280]">{isEn ? 'ESTIMATED VALUE (THIS PAGE)' : 'Doanh Thu Dự Kiến (Trang này)'}</p>
            <p className="text-2xl font-bold text-emerald-700">
              {Number(currentTotalValue).toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#DDF0E2] rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EAF5EC] text-[#2E7D32] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-[#6B7280]">{isEn ? 'DISPLAY SPEC' : 'Quy Chuẩn Hiển Thị'}</p>
            <p className="text-sm font-semibold text-[#1F2937] mt-1">{isEn ? '20 rows/page (BR-03)' : '20 dòng/trang (BR-03)'}</p>
          </div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="bg-white border border-[#DDF0E2] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Ô tìm kiếm đa năng: Tên Lead hoặc Sản phẩm (SRS 3.8) */}
          <div className="md:col-span-3">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder={t('oppSearchPlaceholder')}
            />
          </div>

          {/* Lọc theo Trạng thái (Status) */}
          <div className="md:col-span-3">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] bg-white"
            >
              <option value="">{isEn ? '-- All stages --' : '-- Tất cả trạng thái --'}</option>
              <option value="NEW">{isEn ? 'New (NEW)' : 'Mới tạo (NEW)'}</option>
              <option value="CONTACTED">{isEn ? 'Contacted (CONTACTED)' : 'Đã liên hệ (CONTACTED)'}</option>
              <option value="QUALIFIED">{isEn ? 'Qualified (QUALIFIED)' : 'Đủ điều kiện (QUALIFIED)'}</option>
              <option value="PROPOSAL">{isEn ? 'Proposal (PROPOSAL)' : 'Gửi báo giá (PROPOSAL)'}</option>
              <option value="ORDERED">{isEn ? 'Ordered (ORDERED)' : 'Đã chốt đơn (ORDERED)'}</option>
              <option value="LOST">{isEn ? 'Lost (LOST)' : 'Thất bại/Hủy (LOST)'}</option>
            </select>
          </div>

          {/* Lọc theo ngày: Từ ngày (BR-05) */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
              title={isEn ? 'Filter from date' : 'Lọc từ ngày tạo'}
            />
          </div>

          {/* Lọc theo ngày: Đến ngày (BR-05) */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
              title={isEn ? 'Filter to date' : 'Lọc đến ngày tạo'}
            />
          </div>

          {/* Sắp xếp cột & Đảo chiều (BR-04) */}
          <div className="md:col-span-2 flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] bg-white"
              title={isEn ? 'Sort by' : 'Tiêu chí sắp xếp'}
            >
              <option value="created_at">{isEn ? 'Created Date' : 'Ngày tạo'}</option>
              <option value="expected_close_date">{isEn ? 'Expected Close' : 'Ngày chốt'}</option>
              <option value="quantity">{isEn ? 'Quantity' : 'Số lượng'}</option>
            </select>
            <button
              onClick={toggleSortOrder}
              className="p-2 text-sm border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors flex-shrink-0"
              title={isEn ? `Sort: ${sortOrder === 'ASC' ? 'Ascending' : 'Descending'}` : `Sắp xếp: ${sortOrder === 'ASC' ? 'Tăng dần' : 'Giảm dần'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Bảng Danh sách Cơ hội bán hàng (20 bản ghi theo BR-03) */}
      <div className="bg-white border border-[#DDF0E2] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EAF5EC]/60 border-b border-[#DDF0E2] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <th className="py-3.5 px-4">{isEn ? 'ID / Customer' : 'Mã / Khách Hàng'}</th>
                <th className="py-3.5 px-4">{t('oppColProduct')}</th>
                <th className="py-3.5 px-4 text-center">{isEn ? 'Quantity' : 'Số Lượng'}</th>
                <th className="py-3.5 px-4 text-right">{t('oppColValue')}</th>
                <th className="py-3.5 px-4 text-center">{t('oppColStage')}</th>
                <th className="py-3.5 px-4 text-center">{isEn ? 'Follow-up' : 'Chăm Sóc'}</th>
                <th className="py-3.5 px-4">{t('oppColCloseDate')}</th>
                <th className="py-3.5 px-4 text-center">{t('oppColActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDF0E2]/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-[#3CB371] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">{isEn ? 'Loading opportunities...' : 'Đang tải danh sách cơ hội...'}</span>
                    </div>
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-600">{isEn ? 'No matching sales opportunities found' : 'Không tìm thấy cơ hội bán hàng nào phù hợp'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isEn ? 'Try adjusting filters or click "Create Opportunity" to add one' : 'Thử điều chỉnh bộ lọc hoặc bấm "Thêm Cơ Hội Mới" để tạo cơ hội đầu tiên'}
                    </p>
                  </td>
                </tr>
              ) : (
                opportunities.map((opp) => {
                  const badge = getStatusBadge(opp.status);
                  return (
                    <tr key={opp.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Khách hàng */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <Link
                            to={`/opportunities/${opp.id}`}
                            className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5 transition-colors"
                            title={isEn ? 'View opportunity details' : 'Xem chi tiết cơ hội'}
                          >
                            #{opp.id}
                          </Link>
                          <div>
                            {opp.lead_id ? (
                              <Link
                                to={`/leads/${opp.lead_id}`}
                                className="font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors hover:underline block"
                              >
                                {opp.lead_name || `${isEn ? 'Customer' : 'Khách hàng'} #${opp.lead_id}`}
                              </Link>
                            ) : (
                              <button
                                onClick={() => navigate(`/opportunities/${opp.id}`)}
                                className="font-semibold text-gray-900 hover:text-blue-600 text-left transition-colors"
                              >
                                {opp.lead_name || `${isEn ? 'Opportunity' : 'Cơ hội'} #${opp.id}`}
                              </button>
                            )}
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              <span>{opp.lead_phone}</span>
                              {opp.lead_email && (
                                <>
                                  <span>•</span>
                                  <span>{opp.lead_email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sản phẩm */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            {opp.product_id ? (
                              <Link
                                to={`/products/${opp.product_id}`}
                                className="font-medium text-gray-800 hover:text-blue-600 hover:underline block"
                              >
                                {opp.product_name}
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-800">{opp.product_name}</span>
                            )}
                            <div className="text-xs text-gray-500">
                              {isEn ? 'Code:' : 'Mã:'} <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">{opp.product_code}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Số lượng */}
                      <td className="py-3.5 px-4 text-center font-semibold text-gray-800">
                        {opp.quantity}
                      </td>

                      {/* Giá trị ước tính */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-blue-700">
                          {Number(opp.estimated_value || 0).toLocaleString('vi-VN')} ₫
                        </span>
                        <div className="text-xs text-gray-400">
                          {isEn ? 'Unit price:' : 'Đơn giá:'} {Number(opp.unit_price || 0).toLocaleString('vi-VN')} ₫
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Nhật ký chăm sóc (Follow-ups) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            {opp.follow_ups_count || 0}
                          </span>
                          <button
                            onClick={() => handleOpenFollowUpModal(opp)}
                            title={isEn ? 'Quick log follow-up' : 'Ghi nhanh nhật ký chăm sóc'}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <MessageSquarePlus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Ngày dự kiến chốt */}
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {opp.expected_close_date ? (
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatDate(opp.expected_close_date)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">{isEn ? 'Undetermined' : 'Chưa xác định'}</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/opportunities/${opp.id}`)}
                            title={isEn ? 'View opportunity details & timeline' : 'Xem chi tiết cơ hội & timeline chăm sóc'}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {opp.status !== 'ORDERED' && (
                            <button
                              onClick={() => setMakeOrderState({ isOpen: true, opportunity: opp })}
                              title={isEn ? 'Make an order (Fulfill invoice)' : 'Chốt đơn hàng (Xuất hóa đơn)'}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(opp)}
                            title={isEn ? 'Edit opportunity' : 'Chỉnh sửa cơ hội'}
                            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, opportunity: opp, loading: false })}
                            title={isEn ? 'Delete opportunity' : 'Xóa cơ hội'}
                            disabled={opp.status === 'ORDERED'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              opp.status === 'ORDERED'
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Phân trang (Pagination) */}
        <div className="p-4 border-t border-gray-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={20}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          />
        </div>
      </div>

      {/* Modal Thêm / Sửa Cơ Hội */}
      {isOppModalOpen && (
        <OpportunityModal
          isOpen={isOppModalOpen}
          onClose={() => {
            setIsOppModalOpen(false);
            setInitialLeadId(null);
            setInitialProductId(null);
          }}
          opportunity={selectedOpp}
          initialLeadId={initialLeadId}
          initialProductId={initialProductId}
          onSuccess={fetchOpportunities}
        />
      )}

      {/* Modal Ghi Nhận Follow-up Nhanh */}
      {isFollowUpModalOpen && (
        <FollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          opportunity={followUpTargetOpp}
          onSuccess={fetchOpportunities}
        />
      )}

      {/* Modal Chốt Đơn Hàng (Make an Order - SRS 3.12) */}
      {makeOrderState.isOpen && (
        <MakeOrderModal
          isOpen={makeOrderState.isOpen}
          onClose={() => setMakeOrderState({ isOpen: false, opportunity: null })}
          opportunity={makeOrderState.opportunity}
          onSuccess={fetchOpportunities}
        />
      )}

      {/* Dialog Xác Nhận Xóa */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, opportunity: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title={isEn ? 'Confirm Delete Opportunity' : 'Xác Nhận Xóa Cơ Hội Bán Hàng'}
        message={
          isEn
            ? `Are you sure you want to delete sales opportunity #${deleteConfirm.opportunity?.id} for customer '${deleteConfirm.opportunity?.lead_name}'? This action will also delete all related follow-up logs and cannot be undone.`
            : `Bạn có chắc chắn muốn xóa cơ hội bán hàng #${deleteConfirm.opportunity?.id} của khách hàng '${deleteConfirm.opportunity?.lead_name}'? Hành động này sẽ đồng thời xóa toàn bộ nhật ký chăm sóc liên quan và không thể khôi phục.`
        }
        confirmText={isEn ? 'Confirm Delete' : 'Xác Nhận Xóa'}
        cancelText={t('cancel')}
        loading={deleteConfirm.loading}
      />
    </div>
  );
}
