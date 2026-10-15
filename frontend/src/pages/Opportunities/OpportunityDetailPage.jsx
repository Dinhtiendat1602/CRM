import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import oppApi from '../../api/oppApi';
import OpportunityModal from './OpportunityModal';
import FollowUpModal from './FollowUpModal';
import MakeOrderModal from './MakeOrderModal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { 
  Briefcase, 
  ArrowLeft, 
  User, 
  Package, 
  Calendar, 
  PhoneCall, 
  Mail, 
  Users, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag, 
  ExternalLink, 
  ArrowRight 
} from 'lucide-react';

const STATUS_BADGES = {
  NEW: { label: 'Mới tạo', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  CONTACTED: { label: 'Đã liên hệ', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  QUALIFIED: { label: 'Đủ điều kiện', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  PROPOSAL: { label: 'Gửi báo giá', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  ORDERED: { label: 'Đã chốt đơn', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  LOST: { label: 'Thất bại/Hủy', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

const METHOD_ICONS = {
  PHONE: { icon: PhoneCall, label: 'Điện thoại', color: 'bg-blue-500 text-white' },
  EMAIL: { icon: Mail, label: 'Email', color: 'bg-indigo-500 text-white' },
  MEETING: { icon: Users, label: 'Gặp trực tiếp', color: 'bg-emerald-500 text-white' },
  ZALO: { icon: MessageSquare, label: 'Zalo / Chat', color: 'bg-cyan-500 text-white' },
};

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isMakeOrderModalOpen, setIsMakeOrderModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    loading: false,
  });

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await oppApi.getOpportunityById(id);
      setOpportunity(res.data?.data || null);
    } catch (err) {
      console.error('Lỗi tải chi tiết cơ hội bán hàng:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể tải thông tin cơ hội bán hàng.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await oppApi.deleteOpportunity(id);
      setDeleteConfirm({ isOpen: false, loading: false });
      navigate('/opportunities');
    } catch (err) {
      console.error('Lỗi xóa cơ hội:', err);
      alert(err.response?.data?.message || 'Không thể xóa cơ hội bán hàng này.');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Đang tải hồ sơ chi tiết cơ hội bán hàng #{id}...</p>
      </div>
    );
  }

  if (errorMsg || !opportunity) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Không tìm thấy cơ hội</h2>
        <p className="text-sm text-gray-500 mb-6">{errorMsg || 'Cơ hội bán hàng không tồn tại hoặc đã bị xóa.'}</p>
        <button
          onClick={() => navigate('/opportunities')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay Lại Danh Sách Cơ Hội</span>
        </button>
      </div>
    );
  }

  const badge = STATUS_BADGES[opportunity.status] || STATUS_BADGES.NEW;
  const followUps = opportunity.follow_ups || [];
  const order = opportunity.order;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/opportunities')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Cơ Hội Bán Hàng #{opportunity.id}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Khách hàng: <strong>{opportunity.lead_name}</strong> • Sản phẩm: <strong>{opportunity.product_name}</strong>
            </p>
          </div>
        </div>

        {/* Các nút hành động chính */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsFollowUpModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ghi Nhận Chăm Sóc</span>
          </button>

          {opportunity.status !== 'ORDERED' && (
            <button
              onClick={() => setIsMakeOrderModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Chốt Đơn Hàng (Make Order)</span>
            </button>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Sửa</span>
          </button>

          <button
            onClick={() => setDeleteConfirm({ isOpen: true, loading: false })}
            disabled={opportunity.status === 'ORDERED'}
            className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-sm font-semibold shadow-sm transition-colors ${
              opportunity.status === 'ORDERED'
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white border-red-300 text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {/* Grid 3 Cột: Thông tin tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Giá trị & Tiến độ cơ hội */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Thông Số Cơ Hội</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {opportunity.quantity} sản phẩm
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-gray-500">Giá Trị Dự Kiến Ước Tính:</span>
              <p className="text-xl font-bold text-blue-700 mt-0.5">
                {Number(opportunity.estimated_value || 0).toLocaleString('vi-VN')} ₫
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Đơn Giá:</span>
                <p className="font-semibold text-gray-800">
                  {Number(opportunity.unit_price || 0).toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div>
                <span className="text-gray-500">Số Lượng:</span>
                <p className="font-semibold text-gray-800">{opportunity.quantity} cái</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
              <div>
                <span className="text-gray-500">Ngày dự kiến chốt:</span>
                <p className="font-medium text-gray-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {opportunity.expected_close_date
                      ? new Date(opportunity.expected_close_date).toLocaleDateString('vi-VN')
                      : 'Chưa xác định'}
                  </span>
                </p>
              </div>

              <div>
                <span className="text-gray-500">Nhân viên phụ trách:</span>
                <p className="font-medium text-gray-800 mt-0.5">
                  {opportunity.created_by_name || 'Hệ thống'}
                </p>
              </div>

              <div>
                <span className="text-gray-500">Ngày tạo cơ hội:</span>
                <p className="font-medium text-gray-800 mt-0.5">
                  {new Date(opportunity.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {opportunity.notes && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Ghi chú nhu cầu:</span>
                <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg mt-1 whitespace-pre-line border border-gray-100">
                  {opportunity.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Thông tin Khách hàng (Lead) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Khách Hàng Tiềm Năng</span>
            </h2>
            <Link
              to={`/leads/${opportunity.lead_id}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Xem hồ sơ</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold text-gray-900 text-base">{opportunity.lead_name}</p>
              {opportunity.lead_career && (
                <p className="text-xs text-gray-500">{opportunity.lead_career}</p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600">SĐT:</span>
                <strong className="text-gray-800">{opportunity.lead_phone}</strong>
              </div>

              {opportunity.lead_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-800">{opportunity.lead_email}</span>
                </div>
              )}

              {opportunity.lead_address && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Địa chỉ:</span>
                  <p className="text-gray-700 mt-0.5">{opportunity.lead_address}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Thông tin Sản phẩm (Product) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              <span>Sản Phẩm Quan Tâm</span>
            </h2>
            <Link
              to={`/products/${opportunity.product_id}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Chi tiết SP</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold text-gray-900 text-base">{opportunity.product_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-semibold">
                  {opportunity.product_code}
                </code>
                {opportunity.category_name && (
                  <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {opportunity.category_name}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
              <div>
                <span className="text-gray-500">Đơn giá niêm yết:</span>
                <p className="font-semibold text-gray-900 text-sm">
                  {Number(opportunity.unit_price || 0).toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div>
                <span className="text-gray-500">Tồn kho hiện tại:</span>
                <p className={`font-semibold text-sm ${opportunity.stock_qty <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {opportunity.stock_qty} cái
                </p>
              </div>
            </div>

            {opportunity.product_description && (
              <p className="text-xs text-gray-500 italic line-clamp-3">
                {opportunity.product_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Thông tin Đơn hàng đã chốt (Order Details) - nếu có */}
      {order && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Đơn Hàng Đã Được Khởi Tạo Thành Công (Make an Order)</span>
            </div>
            <code className="px-2.5 py-1 rounded bg-emerald-200 text-emerald-900 font-bold text-xs">
              MÃ ĐƠN: {order.order_code}
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-emerald-700">Tổng Tiền Đã Chốt:</span>
              <p className="font-bold text-base text-emerald-900">
                {Number(order.total_amount).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div>
              <span className="text-emerald-700">Ngày Chốt Đơn:</span>
              <p className="font-medium text-emerald-900">
                {new Date(order.order_date).toLocaleString('vi-VN')}
              </p>
            </div>
            <div>
              <span className="text-emerald-700">Thông Tin Thanh Toán:</span>
              <p className="font-medium text-emerald-900">{order.payment_info}</p>
            </div>
            <div>
              <span className="text-emerald-700">Địa Chỉ Giao Hàng:</span>
              <p className="font-medium text-emerald-900">{order.shipping_address}</p>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE LỊCH SỬ CHĂM SÓC KHÁCH HÀNG (Follow-up Activity Timeline - SRS 3.11) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Dòng Thời Gian Chăm Sóc Khách Hàng (Follow-up Activity Timeline)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ghi nhận toàn bộ cuộc gọi, email, gặp mặt, phản hồi của khách và kế hoạch tương tác tiếp theo (SRS 3.11)
            </p>
          </div>

          <button
            onClick={() => setIsFollowUpModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhật Ký Chăm Sóc</span>
          </button>
        </div>

        {followUps.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Chưa có bản ghi nhật ký chăm sóc nào</p>
            <p className="text-xs text-gray-400 mt-1">
              Nhấn "+ Thêm Nhật Ký Chăm Sóc" để lưu lại tương tác gọi điện hoặc gửi email đầu tiên
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
            {followUps.map((fu, idx) => {
              const method = METHOD_ICONS[fu.contact_method] || METHOD_ICONS.PHONE;
              const IconComp = method.icon;
              return (
                <div key={fu.id || idx} className="relative group">
                  {/* Icon Node trên Timeline */}
                  <div
                    className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${method.color}`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </div>

                  {/* Nội dung hộp tương tác */}
                  <div className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-xl p-4 shadow-sm transition-all ml-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-slate-200/60 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {method.label}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-600 font-medium">
                          Bởi: <strong>{fu.created_by_name || 'Nhân viên kinh doanh'}</strong>
                        </span>
                      </div>
                      <time className="text-xs text-gray-500 font-mono">
                        {new Date(fu.follow_date).toLocaleString('vi-VN')}
                      </time>
                    </div>

                    {/* Nội dung trao đổi */}
                    <div className="text-sm text-gray-800 whitespace-pre-line mb-3">
                      {fu.content}
                    </div>

                    {/* Phản hồi & Kế hoạch tiếp theo */}
                    {(fu.customer_response || fu.next_plan) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                        {fu.customer_response && (
                          <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                            <span className="font-semibold text-gray-700 block mb-1">
                              💬 Phản hồi của khách:
                            </span>
                            <p className="text-gray-600 whitespace-pre-line">{fu.customer_response}</p>
                          </div>
                        )}
                        {fu.next_plan && (
                          <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                            <span className="font-semibold text-blue-700 block mb-1 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3 text-blue-600" />
                              Kế hoạch tiếp theo:
                            </span>
                            <p className="text-gray-600 whitespace-pre-line">{fu.next_plan}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Chỉnh Sửa Cơ Hội */}
      {isEditModalOpen && (
        <OpportunityModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          opportunity={opportunity}
          onSuccess={fetchDetail}
        />
      )}

      {/* Modal Thêm Nhật Ký Chăm Sóc */}
      {isFollowUpModalOpen && (
        <FollowUpModal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          opportunity={opportunity}
          onSuccess={fetchDetail}
        />
      )}

      {/* Modal Chốt Đơn Hàng (Make an Order - SRS 3.12) */}
      {isMakeOrderModalOpen && (
        <MakeOrderModal
          isOpen={isMakeOrderModalOpen}
          onClose={() => setIsMakeOrderModalOpen(false)}
          opportunity={opportunity}
          onSuccess={fetchDetail}
        />
      )}

      {/* Dialog Xác Nhận Xóa */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, loading: false })}
        onConfirm={handleDelete}
        title="Xác Nhận Xóa Cơ Hội Bán Hàng"
        message={`Bạn có chắc chắn muốn xóa cơ hội bán hàng #${opportunity.id}? Toàn bộ lịch sử ${followUps.length} lượt chăm sóc sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
        confirmText="Xác Nhận Xóa"
        cancelText="Hủy"
        loading={deleteConfirm.loading}
      />
    </div>
  );
}
