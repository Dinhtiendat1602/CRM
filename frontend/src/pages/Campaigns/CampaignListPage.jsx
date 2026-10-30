import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import campaignApi from '../../api/campaignApi';
import CampaignModal from './CampaignModal';
import CampaignAssignProductsModal from './CampaignAssignProductsModal';
import Pagination from '../../components/Common/Pagination';
import SearchInput from '../../components/Common/SearchInput';
import Modal from '../../components/Common/Modal';
import {
  Megaphone,
  Plus,
  BarChart2,
  Layers,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Package,
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const STATUS_BADGES = {
  ACTIVE: { label: 'Đang hoạt động', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  UPCOMING: { label: 'Sắp diễn ra', color: 'bg-[#EAF5EC] text-[#2E7D32] border-[#DDF0E2]' },
  ENDED: { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-700 border-slate-300' },
};

/**
 * CampaignListPage - Danh sách Quản lý Chiến dịch Tiếp thị
 * Tuân thủ SRS v1.1 Mục 3.18, BR-03 (Phân trang 20 dòng), BR-05 (Lọc ngày)
 */
export default function CampaignListPage() {
  const navigate = useNavigate();

  // Danh sách và trạng thái tải
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Bộ lọc và tìm kiếm
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

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

  // Phân trang chuẩn 20 dòng theo BR-03
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalRecords: 0,
  });

  // State quản lý Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [assigningCampaign, setAssigningCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Thống kê nhanh trên đầu trang
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    totalBudget: 0,
  });

  const fetchCampaigns = useCallback(async () => {
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

      const res = await campaignApi.getCampaigns(params);
      const list = res.data || [];
      setCampaigns(list);

      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: res.pagination.totalPages || 1,
          totalRecords: res.pagination.total || list.length,
        }));
      }

      // Tính toán nhanh stats dựa trên kết quả trả về
      const activeCount = list.filter((c) => c.campaign_status === 'ACTIVE').length;
      const upcomingCount = list.filter((c) => c.campaign_status === 'UPCOMING').length;
      const budgetSum = list.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0);

      setStats({
        total: res.pagination?.total || list.length,
        active: activeCount,
        upcoming: upcomingCount,
        totalBudget: budgetSum,
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách chiến dịch tiếp thị.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, status, fromDate, toDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setFromDate('');
    setToDate('');
    setSortBy('created_at');
    setSortOrder('DESC');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return;
    setDeleteLoading(true);
    try {
      await campaignApi.deleteCampaign(deletingCampaign.id);
      setDeletingCampaign(null);
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa chiến dịch.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Không lặp lại tiêu đề vì đã có trên Header) */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-[#6B7280]">
          Tổng số: <strong className="text-[#1F2937]">{stats.total}</strong> chiến dịch tiếp thị
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] rounded-xl shadow-xs transition-all cursor-pointer ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo Chiến Dịch Mới</span>
        </button>
      </div>

      {/* Thẻ Thống kê KPIs Nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#DDF0E2] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#EAF5EC] flex items-center justify-center text-[#3CB371]">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs text-slate-500 font-medium">Tổng số chiến dịch</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
            <div className="text-xs text-slate-500 font-medium">Đang hoạt động (ACTIVE)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DDF0E2] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#EAF5EC] flex items-center justify-center text-[#3CB371]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1F2937]">{stats.upcoming}</div>
            <div className="text-xs text-slate-500 font-medium">Sắp diễn ra (UPCOMING)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalBudget.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Tổng ngân sách dự toán</div>
          </div>
        </div>
      </div>

      {/* Thanh Lọc, Tìm Kiếm & Sắp Xếp */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Ô tìm kiếm */}
          <div className="md:col-span-4">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Tìm theo tên hoặc mô tả chiến dịch..."
            />
          </div>

          {/* Lọc Trạng thái */}
          <div className="md:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="ENDED">Đã kết thúc</option>
            </select>
          </div>

          {/* Lọc Khoảng ngày (BR-05) */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              title="Từ ngày"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              title="Đến ngày"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all"
            />
          </div>

          {/* Sắp xếp & Nút Reset */}
          <div className="md:col-span-2 flex items-center gap-2">
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                setSortBy(sb);
                setSortOrder(so);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all cursor-pointer"
            >
              <option value="created_at:DESC">Mới nhất</option>
              <option value="created_at:ASC">Cũ nhất</option>
              <option value="start_date:DESC">Ngày bắt đầu giảm dần</option>
              <option value="start_date:ASC">Ngày bắt đầu tăng dần</option>
              <option value="budget:DESC">Ngân sách cao nhất</option>
              <option value="name:ASC">Tên A-Z</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              title="Đặt lại bộ lọc"
              className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bảng Dữ liệu Phân trang 20 dòng theo BR-03 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Chiến dịch tiếp thị</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Thời hạn triển khai</th>
                <th className="px-4 py-3.5 text-right">Ngân sách</th>
                <th className="px-4 py-3.5 text-center">Sản phẩm</th>
                <th className="px-4 py-3.5 text-center">Leads</th>
                <th className="px-4 py-3.5">Người tạo</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#3CB371] border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải dữ liệu chiến dịch...</span>
                    </div>
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Megaphone className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Không tìm thấy chiến dịch nào</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử điều chỉnh bộ lọc hoặc nhấn nút "Tạo Chiến dịch Mới" để bắt đầu.
                    </p>
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const badge = STATUS_BADGES[c.campaign_status] || STATUS_BADGES.ENDED;
                  const budgetVal = parseFloat(c.budget || 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tên & Mô tả */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Link
                            to={`/campaigns/${c.id}/report`}
                            className="hover:text-[#3CB371] transition-colors hover:underline"
                          >
                            {c.name}
                          </Link>
                        </div>
                        {c.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-xs">
                            {c.description}
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Thời hạn */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {formatDate(c.start_date)}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span>
                            {formatDate(c.end_date)}
                          </span>
                        </div>
                      </td>

                      {/* Ngân sách */}
                      <td className="px-4 py-3.5 text-right font-medium text-slate-900">
                        {budgetVal > 0 ? (
                          <span>{budgetVal.toLocaleString('vi-VN')} đ</span>
                        ) : (
                          <span className="text-slate-400">0 đ</span>
                        )}
                      </td>

                      {/* Số sản phẩm */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-xs">
                          <Package className="w-3 h-3 text-slate-500" />
                          {c.products_count || 0}
                        </span>
                      </td>

                      {/* Số Leads */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EAF5EC] text-[#2E7D32] font-semibold text-xs border border-[#DDF0E2]">
                          <Users className="w-3 h-3 text-[#3CB371]" />
                          {c.leads_count || 0}
                        </span>
                      </td>

                      {/* Người tạo */}
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {c.created_by_name || 'Hệ thống'}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Xem Báo cáo hiệu quả ROI (SRS 3.19) */}
                          <button
                            type="button"
                            title="Xem Báo cáo Hiệu quả ROI"
                            onClick={() => navigate(`/campaigns/${c.id}/report`)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>

                          {/* Gán sản phẩm mục tiêu (SRS 3.18.1) */}
                          <button
                            type="button"
                            title="Gán sản phẩm mục tiêu"
                            onClick={() => setAssigningCampaign(c)}
                            className="p-1.5 text-[#3CB371] hover:text-[#2E7D32] hover:bg-[#EAF5EC] rounded-lg transition-colors cursor-pointer"
                          >
                            <Layers className="w-4 h-4" />
                          </button>

                          {/* Sửa chiến dịch */}
                          <button
                            type="button"
                            title="Chỉnh sửa thông tin"
                            onClick={() => setEditingCampaign(c)}
                            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Xóa chiến dịch */}
                          <button
                            type="button"
                            title="Xóa chiến dịch"
                            onClick={() => setDeletingCampaign(c)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

        {/* Phân trang chuẩn 20 dòng BR-03 */}
        <div className="p-4 border-t border-slate-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={20}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          />
        </div>
      </div>

      {/* Modal Thêm Mới */}
      <CampaignModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchCampaigns}
      />

      {/* Modal Chỉnh Sửa */}
      <CampaignModal
        isOpen={Boolean(editingCampaign)}
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(null)}
        onSuccess={fetchCampaigns}
      />

      {/* Modal Gán Sản Phẩm */}
      <CampaignAssignProductsModal
        isOpen={Boolean(assigningCampaign)}
        campaign={assigningCampaign}
        onClose={() => setAssigningCampaign(null)}
        onSuccess={fetchCampaigns}
      />

      {/* Modal Xác Nhận Xóa */}
      <Modal
        isOpen={Boolean(deletingCampaign)}
        onClose={() => setDeletingCampaign(null)}
        title="Xác nhận xóa chiến dịch tiếp thị"
        subtitle="Hành động này không thể hoàn tác"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              Bạn có chắc chắn muốn xóa chiến dịch{' '}
              <strong className="font-semibold text-rose-950">"{deletingCampaign?.name}"</strong>?
              Hệ thống sẽ an toàn ngắt liên kết giữa các sản phẩm và khách hàng tiềm năng khỏi chiến dịch này.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => setDeletingCampaign(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
            >
              {deleteLoading ? 'Đang xóa...' : 'Đồng ý xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
