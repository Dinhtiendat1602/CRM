import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import leadApi from '../../api/leadApi';
import Pagination from '../../components/Common/Pagination';
import SearchInput from '../../components/Common/SearchInput';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import LeadModal from './LeadModal';
import { 
  Users, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar, 
  ArrowUpDown, 
  Building, 
  Mail, 
  Phone, 
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LeadListPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // State quản lý danh sách & phân trang (BR-03: limit=20)
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1,
  });

  // State bộ lọc & sắp xếp (BR-04, BR-05, SRS 3.3)
  const [search, setSearch] = useState('');
  const [sortBy] = useState('entered_date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    lead: null,
    loading: false,
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await leadApi.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
        from_date: startDate || undefined,
        to_date: endDate || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const leadList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res.leads || res.data?.leads || [];
      setLeads(leadList);

      const meta = res.pagination || res.data?.pagination;
      if (meta) {
        setPagination((prev) => ({
          ...prev,
          page: meta.page || meta.currentPage || prev.page,
          limit: meta.limit || prev.limit,
          totalRecords: meta.total ?? meta.totalRecords ?? leadList.length,
          totalPages: meta.totalPages || 1,
        }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách khách hàng tiềm năng.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, sortBy, sortOrder, startDate, endDate]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Đổi trang
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Đổi thứ tự sắp xếp theo ngày nhập (BR-04)
  const handleToggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Reset bộ lọc khoảng ngày
  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Xử lý sau khi lưu Lead thành công (bao gồm cả trường hợp tự động tạo cơ hội qua Flick)
  const handleLeadSuccess = (meta) => {
    fetchLeads();
    if (meta?.autoCreatedOpp) {
      setSuccessMsg({
        text: 'Đã tạo khách hàng tiềm năng và tự động thêm vào Cơ hội bán hàng thành công!',
        hasOpp: true,
      });
    } else {
      setSuccessMsg({
        text: meta?.isEdit
          ? 'Cập nhật thông tin khách hàng tiềm năng thành công!'
          : 'Thêm mới khách hàng tiềm năng thành công!',
        hasOpp: false,
      });
    }
    setTimeout(() => {
      setSuccessMsg(null);
    }, 6000);
  };

  // Mở modal tạo mới
  const handleCreate = () => {
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Mở xác nhận xóa
  const handleDeleteClick = (lead) => {
    setDeleteConfirm({
      isOpen: true,
      lead,
      loading: false,
    });
  };

  // Thực hiện xóa (SRS 3.5)
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.lead) return;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await leadApi.deleteLead(deleteConfirm.lead.id);
      setDeleteConfirm({ isOpen: false, lead: null, loading: false });
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa khách hàng.');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  // Format ngày hiển thị
  const formatDate = (isoString) => {
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

  // Source badge colors
  const getSourceBadge = (source) => {
    const s = (source || 'Website').toLowerCase();
    if (s.includes('web')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s.includes('ads') || s.includes('facebook') || s.includes('google'))
      return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s.includes('referral') || s.includes('giới thiệu'))
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('call')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {!startDate && !endDate && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#EAF5EC] text-[#2E7D32] border border-[#DDF0E2] shadow-2xs"
              title={t('oneYearDataTooltip', 'Hệ thống mặc định tối ưu tải khách hàng tiềm năng trong 1 năm gần nhất.')}
            >
              <Calendar className="w-3.5 h-3.5 text-[#3CB371]" />
              <span>{t('oneYearData', 'Dữ liệu 1 năm')}</span>
            </span>
          )}
          <span className="text-xs text-[#6B7280]">
            {t('leadsTotalPrefix', 'Tổng cộng:')} <strong className="text-[#1F2937]">{pagination.totalRecords}</strong> {t('leadsTotalSuffix', 'khách hàng')}
          </span>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3CB371] hover:bg-[#38A169] text-white rounded-xl text-xs font-semibold shadow-xs transition-all shadow-[#3CB371]/20 hover:shadow-md cursor-pointer ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('leadsAddNew', 'Thêm Khách Tiềm Năng')}</span>
        </button>
      </div>

      {/* Thông báo thành công (Hỗ trợ hiển thị khi tạo tự động cơ hội) */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMsg.text}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {successMsg.hasOpp && (
              <button
                type="button"
                onClick={() => navigate('/opportunities')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                {t('leadsViewOpportunities', 'Xem Danh Sách Cơ Hội')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Control Bar: Tìm kiếm, Bộ lọc khoảng ngày, Sort (SRS 3.2, 3.3, BR-04, BR-05) */}
      <div className="bg-white p-4 rounded-2xl border border-[#DDF0E2] shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input (SRS 3.3) */}
          <div className="md:col-span-5">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Tìm kiếm theo tên khách hàng (Nguyễn Văn An, Bích...)"
            />
          </div>

          {/* Date Filter: Start Date -> End Date (BR-05) */}
          <div className="md:col-span-5 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-[#DDF0E2] rounded-xl text-xs text-[#1F2937] focus:outline-hidden focus:border-[#3CB371] focus:ring-1 focus:ring-[#3CB371]"
                title={t('fromDate', 'Từ ngày')}
              />
            </div>
            <span className="text-xs text-[#6B7280] font-medium">{language === 'en' ? 'to' : 'đến'}</span>
            <div className="relative flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 bg-[#F3F4F6] border border-[#DDF0E2] rounded-xl text-xs text-[#1F2937] focus:outline-hidden focus:border-[#3CB371] focus:ring-1 focus:ring-[#3CB371]"
                title={t('toDate', 'Đến ngày')}
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={handleClearDateFilter}
                className="p-2 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title={t('clearFilter', 'Xóa lọc ngày')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sắp xếp theo Ngày Nhập (BR-04) */}
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={handleToggleSortOrder}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F3F4F6] hover:bg-[#EAF5EC] border border-[#DDF0E2] rounded-xl text-xs font-semibold text-[#1F2937] transition-colors cursor-pointer"
              title="Nhấn để đổi chiều sắp xếp"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Ngày: {sortOrder === 'DESC' ? 'Mới nhất' : 'Cũ nhất'}</span>
            </button>
          </div>
        </div>


      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Data Table (BR-03: 20 bản ghi/trang) */}
      <div className="bg-white rounded-2xl border border-[#DDF0E2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#EAF5EC]/60 text-[#6B7280] uppercase text-xs font-semibold border-b border-[#DDF0E2]">
              <tr>
                <th className="py-3.5 px-4">{t('leadsColName', 'Họ và Tên Lead')}</th>
                <th className="py-3.5 px-4">{t('leadsColContact', 'Liên Hệ')}</th>
                <th className="py-3.5 px-4">{language === 'en' ? 'Company / Title' : 'Công Ty / Nghề Nghiệp'}</th>
                <th className="py-3.5 px-4">{t('leadsColSource', 'Nguồn')}</th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t('leadsColDate', 'Ngày Nhập')}</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">{t('leadsColActions', 'Thao Tác')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#3CB371] border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'en' ? 'Loading leads data...' : 'Đang tải dữ liệu khách hàng tiềm năng...'}</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Users className="w-12 h-12 text-slate-300 stroke-[1.5] mb-2" />
                      <p className="font-medium text-slate-600">{t('leadsEmpty', 'Không tìm thấy khách hàng tiềm năng nào')}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {search || startDate || endDate
                          ? (language === 'en' ? 'Try changing search keywords or date filter.' : 'Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc ngày.')
                          : (language === 'en' ? 'Get started by adding a new lead.' : 'Bắt đầu bằng cách thêm mới một khách hàng tiềm năng.')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const fullName = `${lead.last_name || ''} ${lead.first_name || ''}`.trim();
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-[#EAF5EC]/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      {/* Tên khách hàng & Link chi tiết */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3CB371] to-[#2E7D32] text-white font-semibold flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                            {(lead.first_name || 'L')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-[#1F2937] group-hover:text-[#2E7D32] transition-colors block">
                              {fullName}
                            </span>
                            <span className="text-xs text-[#6B7280]">
                              Mã ID: #{lead.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Số điện thoại */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Công ty & Chức danh */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.company || 'Cá nhân'}</span>
                          </div>
                          <div className="text-slate-400 pl-5">
                            {lead.title || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </td>

                      {/* Nguồn thu thập */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSourceBadge(
                            lead.source
                          )}`}
                        >
                          {lead.source || 'Website'}
                        </span>
                      </td>

                      {/* Ngày nhập */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(lead.entered_date)}
                      </td>

                      {/* Hành động: Xem, Sửa, Xóa */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(lead)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(lead)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa khách hàng tiềm năng"
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

        {/* Thanh phân trang (BR-03: 20 bản ghi/trang) */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modal Thêm / Sửa Lead */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLead}
        onSuccess={handleLeadSuccess}
      />

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={language === 'en' ? 'Confirm Lead Deletion' : 'Xác nhận xóa Khách hàng tiềm năng'}
        message={
          language === 'en'
            ? `Are you sure you want to delete lead "${deleteConfirm.lead ? `${deleteConfirm.lead.last_name || ''} ${deleteConfirm.lead.first_name || ''}`.trim() : ''}"? All related information and opportunities will be permanently removed.`
            : `Bạn có chắc chắn muốn xóa khách hàng "${deleteConfirm.lead ? `${deleteConfirm.lead.last_name || ''} ${deleteConfirm.lead.first_name || ''}`.trim() : ''}"? Toàn bộ thông tin và cơ hội liên quan sẽ bị xóa vĩnh viễn khỏi CSDL.`
        }
        confirmText={language === 'en' ? 'Confirm Delete' : 'Xác nhận xóa'}
        confirmType="danger"
        loading={deleteConfirm.loading}
        onClose={() => setDeleteConfirm({ isOpen: false, lead: null, loading: false })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
