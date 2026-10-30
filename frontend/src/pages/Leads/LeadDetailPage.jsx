import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import leadApi from '../../api/leadApi';
import LeadModal from './LeadModal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Edit3, 
  Trash2, 
  Plus, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Sửa & Dialog Xóa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    loading: false,
  });

  const fetchLeadDetail = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await leadApi.getLeadById(id);
      const data = res.data?.data || res.data || res;
      const leadObj = data.lead || (data.id ? data : null);
      setLead(leadObj);
      setOpportunities(data.opportunities || leadObj?.opportunities || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không tìm thấy thông tin khách hàng tiềm năng.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetail();
  }, [fetchLeadDetail]);

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await leadApi.deleteLead(id);
      navigate('/leads', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa khách hàng.');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
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
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  const getOppStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
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
        <p className="text-sm">Đang tải hồ sơ khách hàng tiềm năng...</p>
      </div>
    );
  }

  if (errorMsg || !lead) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy khách hàng</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">{errorMsg || 'Khách hàng không tồn tại hoặc đã bị xóa.'}</p>
        <button
          onClick={() => navigate('/leads')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3CB371] text-white rounded-xl text-sm font-semibold hover:bg-[#38A169] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  const fullName = `${lead.last_name || ''} ${lead.first_name || ''}`.trim();

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
              <span className="text-xs px-2.5 py-0.5 bg-[#EAF5EC] text-[#2E7D32] font-semibold rounded-full border border-[#DDF0E2]">
                Lead #{lead.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ngày nhập hệ thống: {formatDateTime(lead.entered_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Edit3 className="w-4 h-4 text-amber-600" />
            <span>Sửa Thông Tin</span>
          </button>

          <button
            onClick={() => setDeleteConfirm({ isOpen: true, loading: false })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa Lead</span>
          </button>

          <Link
            to={`/opportunities?createForLead=${lead.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3CB371] hover:bg-[#38A169] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Cơ Hội Mới</span>
          </Link>
        </div>
      </div>

      {/* Grid: Thông tin cá nhân & Thẻ tóm tắt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái 2/3: Chi tiết thông tin khách hàng */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#3CB371]" />
              <span>Thông Tin Chi Tiết Khách Hàng (SRS 3.2.3 REQ-4)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Họ và Tên
                </span>
                <span className="font-semibold text-slate-800 text-base">{fullName}</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Chức Danh / Nghề Nghiệp
                </span>
                <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  {lead.career || lead.title || 'Chưa cập nhật'}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Địa Chỉ Email
                </span>
                <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${lead.email}`} className="text-[#3CB371] hover:underline">
                    {lead.email}
                  </a>
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Số Điện Thoại
                </span>
                <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${lead.phone}`} className="text-[#3CB371] hover:underline">
                    {lead.phone}
                  </a>
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Công Ty / Doanh Nghiệp
                </span>
                <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  {lead.company || 'Khách hàng cá nhân'}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Chiến Dịch Nguồn (Campaign)
                </span>
                <span className="inline-block mt-0.5 text-xs font-medium">
                  {lead.campaign_id ? (
                    <Link
                      to={`/campaigns/${lead.campaign_id}/report`}
                      className="px-2.5 py-1 bg-[#EAF5EC] text-[#2E7D32] hover:bg-[#DDF0E2] rounded-md font-semibold inline-flex items-center gap-1 border border-[#DDF0E2]"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>{lead.campaign_name || `Chiến dịch #${lead.campaign_id}`}</span>
                    </Link>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {lead.source || 'Website / Trực tiếp'}
                    </span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Ngày Sinh (DOB)
                </span>
                <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatDate(lead.date_of_birth)}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Khu Vực Địa Lý
                </span>
                <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'Chưa cập nhật'}
                </span>
              </div>
            </div>

            {/* Địa chỉ chi tiết */}
            {lead.address && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Địa Chỉ Cụ Thể
                </span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {lead.address}
                </p>
              </div>
            )}

            {/* Ghi chú nhu cầu */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Ghi Chú Nhu Cầu & Quan Tâm (Notes)
              </span>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 whitespace-pre-line">
                {lead.notes || 'Chưa có ghi chú đặc biệt nào cho khách hàng này.'}
              </p>
            </div>
          </div>

          {/* Danh sách Cơ hội Bán hàng (Opportunities - SRS 3.2.3 REQ-4) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#3CB371]" />
                <h2 className="text-base font-bold text-slate-900">
                  Cơ Hội Bán Hàng Liên Quan (Opportunities)
                </h2>
                <span className="px-2 py-0.5 bg-[#EAF5EC] text-[#2E7D32] rounded-full text-xs font-semibold">
                  {opportunities.length}
                </span>
              </div>

              <Link
                to={`/opportunities?createForLead=${lead.id}`}
                className="text-xs font-semibold text-[#3CB371] hover:text-[#2E7D32] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm cơ hội</span>
              </Link>
            </div>

            {opportunities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Target className="w-10 h-10 text-slate-300 stroke-[1.5] mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">Chưa có cơ hội bán hàng nào cho khách này</p>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">
                  Tạo cơ hội để bắt đầu theo dõi tiến độ chăm sóc và chốt đơn hàng.
                </p>
                <Link
                  to={`/opportunities?createForLead=${lead.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3CB371] hover:bg-[#38A169] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Cơ Hội Đầu Tiên</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/60">
                    <tr>
                      <th className="py-2.5 px-3">Sản Phẩm Quan Tâm</th>
                      <th className="py-2.5 px-3">Số Lượng</th>
                      <th className="py-2.5 px-3">Giá Trị Dự Kiến</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      <th className="py-2.5 px-3">Ngày Tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opportunities.map((opp) => (
                      <tr
                        key={opp.id}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => navigate(`/opportunities/${opp.id}`)}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          <Link
                            to={`/opportunities/${opp.id}`}
                            className="hover:underline text-[#3CB371] block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {opp.product_name || `Sản phẩm #${opp.product_id}`}
                          </Link>
                          {opp.product_id && (
                            <Link
                              to={`/products/${opp.product_id}`}
                              className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline mt-0.5 inline-block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Mã SP: {opp.product_code || `#${opp.product_id}`}
                            </Link>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {opp.quantity || 1}
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-600">
                          {formatCurrency(opp.estimated_amount || opp.estimated_value || (opp.unit_price * (opp.quantity || 1)))}
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
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {formatDateTime(opp.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải 1/3: Thẻ tóm tắt nhanh & Hoạt động */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#7CA5F5] to-[#5D3EBC] text-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              Tóm Tắt Trạng Thái Lead
            </h3>
            <div className="text-2xl font-bold tracking-tight mb-4">
              {opportunities.length > 0 ? `${opportunities.length} Cơ Hội Mở` : 'Lead Mới Tiếp Nhận'}
            </div>
            <div className="space-y-3 text-xs text-white/90">
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <span>Nguồn tiếp nhận:</span>
                <span className="font-semibold text-white">{lead.source || 'Website'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <span>Ngày tạo Lead:</span>
                <span className="font-semibold text-white">{formatDate(lead.entered_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Trạng thái kiểm tra:</span>
                <span className="inline-flex items-center gap-1 text-white font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  Hợp lệ & Không trùng
                </span>
              </div>
            </div>
          </div>

          {/* Box Hướng dẫn nghiệp vụ */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Quy trình chăm sóc (SRS 3.6 - 3.12)</span>
            </div>
            <p className="leading-relaxed text-amber-800/90">
              Từ Lead này, Nhân viên bán hàng tạo các <strong>Cơ hội (Opportunity)</strong> gắn với từng sản phẩm. Mỗi lần gọi điện hoặc gửi mail, hãy bấm vào Cơ hội để ghi nhận <strong>Follow-up</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Sửa Lead */}
      <LeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
        onSuccess={fetchLeadDetail}
      />

      {/* Dialog Xác nhận Xóa */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Xác nhận xóa Khách hàng tiềm năng"
        message={`Bạn có chắc chắn muốn xóa khách hàng "${fullName}"? Mọi dữ liệu liên quan sẽ bị xóa khỏi hệ thống.`}
        confirmText="Xác nhận xóa"
        confirmType="danger"
        loading={deleteConfirm.loading}
        onClose={() => setDeleteConfirm({ isOpen: false, loading: false })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
