import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import campaignApi from '../../api/campaignApi';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  ShoppingCart,
  Percent,
  Calendar,
  Package,
  AlertCircle,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';

const STATUS_BADGES = {
  ACTIVE: { vi: 'Đang hoạt động', en: 'Active', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  UPCOMING: { vi: 'Sắp diễn ra', en: 'Upcoming', color: 'bg-[#EAF5EC] text-[#2E7D32] border-[#DDF0E2]' },
  ENDED: { vi: 'Đã kết thúc', en: 'Ended', color: 'bg-slate-100 text-slate-700 border-slate-300' },
};

/**
 * CampaignReportPage - Báo cáo Hiệu quả Chiến dịch Tiếp thị (Campaign Performance Report)
 * Tuân thủ SRS v1.1 Mục 3.19 (Đo lường ROI, Tỷ lệ chuyển đổi, Sản phẩm & Leads phát sinh)
 */
export default function CampaignReportPage() {
  const { isEn } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'leads'

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

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await campaignApi.getCampaignReport(id);
      setData(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || (isEn ? 'Cannot load campaign performance report.' : 'Không thể tải báo cáo hiệu quả chiến dịch.'));
    } finally {
      setLoading(false);
    }
  }, [id, isEn]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleRemoveProduct = async (productId, productName) => {
    if (!window.confirm(isEn ? `Are you sure you want to remove "${productName}" from this campaign?` : `Bạn có chắc chắn muốn gỡ sản phẩm "${productName}" khỏi chiến dịch này?`)) {
      return;
    }

    try {
      await campaignApi.removeProduct(id, productId);
      fetchReport();
    } catch (err) {
      alert(err.response?.data?.message || (isEn ? 'An error occurred while removing the product.' : 'Có lỗi xảy ra khi gỡ sản phẩm.'));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#3CB371] mb-3" />
        <span className="text-sm font-medium">{isEn ? 'Calculating campaign performance metrics...' : 'Đang tính toán chỉ số hiệu quả chiến dịch...'}</span>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-white border border-rose-200 shadow-xs text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">{isEn ? 'Campaign Report Not Found' : 'Không tìm thấy báo cáo chiến dịch'}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">{errorMsg || (isEn ? 'Campaign does not exist or has been deleted.' : 'Chiến dịch không tồn tại hoặc đã bị xóa.')}</p>
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEn ? 'Back to list' : 'Quay lại danh sách'}</span>
        </button>
      </div>
    );
  }

  const { campaign, metrics, leads = [], products = [] } = data;
  const statusBadge = STATUS_BADGES[campaign.campaign_status] || STATUS_BADGES.ENDED;
  const statusLabel = isEn ? statusBadge.en : statusBadge.vi;
  const isRoiPositive = (metrics.roi || 0) >= 0;

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Header & Thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shrink-0"
            title={isEn ? 'Back to campaigns list' : 'Quay lại danh sách chiến dịch'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {campaign.name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEn ? 'Marketing Performance & Return on Investment Report' : 'Báo cáo Đo lường Hiệu quả Tiếp thị & Lợi tức Đầu tư'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{isEn ? 'Print Report' : 'In Báo Cáo'}</span>
          </button>
        </div>
      </div>

      {/* Thông tin in ấn (Header chỉ hiển thị khi print) */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEn ? 'MARKETING CAMPAIGN PERFORMANCE REPORT' : 'BÁO CÁO HIỆU QUẢ CHIẾN DỊCH TIẾP THỊ'}
            </h1>
            <p className="text-sm font-semibold text-[#2E7D32] mt-1">{campaign.name}</p>
            <p className="text-xs text-slate-500">{isEn ? 'Campaign Code' : 'Mã chiến dịch'}: #{campaign.id}</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>{isEn ? 'Printed at' : 'Ngày in'}: {new Date().toLocaleDateString(isEn ? 'en-US' : 'vi-VN')} {new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN')}</p>
            <p>{isEn ? 'Status' : 'Trạng thái'}: {statusLabel}</p>
          </div>
        </div>
      </div>

      {/* Thông tin tổng quan Chiến dịch */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:p-3 print:border-slate-300">
        <div>
          <span className="text-xs text-slate-400 font-medium">{isEn ? 'Implementation Timeline' : 'Thời gian triển khai'}</span>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mt-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formatDate(campaign.start_date)}</span>
            <span className="text-slate-400">→</span>
            <span>{formatDate(campaign.end_date)}</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">{isEn ? 'Campaign Creator' : 'Người tạo chiến dịch'}</span>
          <div className="text-sm font-semibold text-slate-800 mt-1">
            {campaign.created_by_name || (isEn ? 'System' : 'Hệ thống')}
          </div>
        </div>

        <div className="md:col-span-2">
          <span className="text-xs text-slate-400 font-medium">{isEn ? 'Objectives & Plan' : 'Mục tiêu & Kế hoạch'}</span>
          <div className="text-sm text-slate-600 mt-1 italic">
            {campaign.description || (isEn ? 'No detailed description.' : 'Không có mô tả chi tiết.')}
          </div>
        </div>
      </div>

      {/* 6 Thẻ Chỉ số Hiệu quả Đo lường ROI & Chuyển đổi (SRS 3.19) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6 print:gap-2">
        {/* 1. Ngân sách */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{isEn ? 'Budget' : 'Ngân sách (Budget)'}</span>
            <DollarSign className="w-4 h-4 text-[#3CB371]" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {Number(metrics.budget || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
            <span className="text-xs font-normal text-slate-500 ml-1">{isEn ? '$' : 'đ'}</span>
          </div>
          <span className="text-[11px] text-slate-400">{isEn ? 'Investment Cost' : 'Chi phí đầu tư'}</span>
        </div>

        {/* 2. Doanh thu thực tế */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{isEn ? 'Revenue Generated' : 'Doanh thu thu về'}</span>
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {Number(metrics.total_revenue || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
            <span className="text-xs font-normal text-slate-500 ml-1">{isEn ? '$' : 'đ'}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {isEn ? `From ${metrics.total_orders || 0} orders` : `Từ ${metrics.total_orders || 0} đơn hàng`}
          </span>
        </div>

        {/* 3. Chỉ số ROI */}
        <div className={`p-4 rounded-xl bg-white border shadow-xs print:border-slate-300 ${isRoiPositive ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
          }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold text-slate-700">{isEn ? 'ROI Index' : 'Chỉ số ROI'}</span>
            {isRoiPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className={`text-xl font-extrabold ${isRoiPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
            {metrics.roi > 0 ? `+${metrics.roi}%` : `${metrics.roi}%`}
          </div>
          <span className="text-[11px] text-slate-500">{isEn ? 'Return on Investment' : 'Tỷ suất lợi nhuận'}</span>
        </div>

        {/* 4. Tổng Leads */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{isEn ? 'Acquired Leads' : 'Leads thu được'}</span>
            <Users className="w-4 h-4 text-[#3CB371]" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.total_leads || 0}
          </div>
          <span className="text-[11px] text-slate-400">{isEn ? 'New Potential Leads' : 'Khách tiềm năng mới'}</span>
        </div>

        {/* 5. Tổng Cơ hội */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{isEn ? 'Sales Opportunities' : 'Cơ hội bán hàng'}</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.total_opportunities || 0}
          </div>
          <span className="text-[11px] text-slate-400">
            {isEn ? `From ${metrics.total_leads || 0} Campaign Leads` : `Từ ${metrics.total_leads || 0} Leads chiến dịch`}
          </span>
        </div>

        {/* 6. Tỷ lệ chuyển đổi */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">{isEn ? 'Conversion Rate' : 'Tỷ lệ chuyển đổi'}</span>
            <Percent className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl font-bold text-cyan-700">
            {metrics.conversion_rate || 0}%
          </div>
          <span className="text-[11px] text-cyan-700 font-medium">
            {isEn ? `${metrics.converted_leads ?? leads.filter((l) => (parseInt(l.orders_count, 10) || 0) > 0).length}/${metrics.total_leads || 0} Closed Leads` : `${metrics.converted_leads ?? leads.filter((l) => (parseInt(l.orders_count, 10) || 0) > 0).length}/${metrics.total_leads || 0} Leads chốt đơn`}
          </span>
        </div>
      </div>

      {/* Tabs Chuyển Đổi Chi Tiết */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-slate-200 px-4 pt-2 bg-slate-50/50 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'products'
              ? 'border-[#3CB371] text-[#2E7D32] bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
          >
            <Package className="w-4 h-4" />
            <span>{isEn ? `Promoted Products (${products.length})` : `Sản phẩm Quảng bá (${products.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'leads'
              ? 'border-[#3CB371] text-[#2E7D32] bg-white rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>{isEn ? `Potential Leads (${leads.length})` : `Khách hàng Tiềm năng (${leads.length})`}</span>
          </button>
        </div>

        {/* Nội dung Tab 1: Sản phẩm quảng bá */}
        {(activeTab === 'products' || window.matchMedia?.('print')?.matches) && (
          <div className="overflow-x-auto">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
              <span>{isEn ? 'Target Products List for Campaign' : 'Danh sách Sản phẩm mục tiêu thuộc Chiến dịch'}</span>
            </div>

            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3">{isEn ? 'Code' : 'Mã SP'}</th>
                  <th className="px-4 py-3">{isEn ? 'Product Name' : 'Tên sản phẩm'}</th>
                  <th className="px-4 py-3">{isEn ? 'Category' : 'Danh mục'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Listed Price' : 'Đơn giá niêm yết'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Stock' : 'Tồn kho'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Closed Orders' : 'Số đơn chốt'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Qty Sold' : 'SL đã bán'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Revenue Generated' : 'Doanh thu mang lại'}</th>
                  <th className="px-4 py-3 text-right print:hidden">{isEn ? 'Actions' : 'Thao tác'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1 mb-2" />
                      <p>{isEn ? 'No products have been assigned to this campaign yet.' : 'Chưa có sản phẩm nào được gán vào chiến dịch này.'}</p>
                      <button
                        type="button"
                        onClick={() => navigate('/campaigns')}
                        className="text-xs text-[#3CB371] hover:underline mt-1 font-medium cursor-pointer"
                      >
                        {isEn ? 'Go back to list to assign products' : 'Quay lại danh sách để gán sản phẩm'}
                      </button>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {p.product_code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <Link
                          to={`/products/${p.id}`}
                          className="text-[#3CB371] hover:underline inline-flex items-center gap-1"
                        >
                          <span>{p.name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 print:hidden" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {p.category_name || (isEn ? 'Default' : 'Mặc định')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {Number(p.unit_price || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? '$' : 'đ'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-slate-700">{p.stock_qty || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-[#3CB371]">
                        {p.orders_count || 0}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-600">
                        {p.units_sold || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {Number(p.product_revenue || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? '$' : 'đ'}
                      </td>
                      <td className="px-4 py-3 text-right print:hidden">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id, p.name)}
                          title={isEn ? 'Remove product from campaign' : 'Gỡ sản phẩm khỏi chiến dịch'}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {products.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-slate-700 uppercase">
                      {isEn ? `Total (${products.length} products)` : `Tổng cộng (${products.length} sản phẩm)`}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-800">
                      {products.reduce((acc, p) => acc + (parseInt(p.stock_qty, 10) || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-center text-[#2E7D32]">
                      {products.reduce((acc, p) => acc + (parseInt(p.orders_count, 10) || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-600">
                      {products.reduce((acc, p) => acc + (parseInt(p.units_sold, 10) || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700">
                      {Number(products.reduce((acc, p) => acc + (parseFloat(p.product_revenue) || 0), 0)).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? '$' : 'đ'}
                    </td>
                    <td className="px-4 py-3 print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Nội dung Tab 2: Khách hàng tiềm năng (Leads) */}
        {(activeTab === 'leads' || window.matchMedia?.('print')?.matches) && (
          <div className="overflow-x-auto print:mt-6">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
              <span>{isEn ? 'Leads Generated from Campaign' : 'Danh sách Khách hàng tiềm năng thu được từ Chiến dịch'}</span>
            </div>

            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3">{isEn ? 'Lead Name' : 'Họ và tên Lead'}</th>
                  <th className="px-4 py-3">{isEn ? 'Phone Number' : 'Số điện thoại'}</th>
                  <th className="px-4 py-3">{isEn ? 'Email' : 'Email'}</th>
                  <th className="px-4 py-3">{isEn ? 'Career' : 'Nghề nghiệp'}</th>
                  <th className="px-4 py-3">{isEn ? 'Entered Date' : 'Ngày nhập'}</th>
                  <th className="px-4 py-3">{isEn ? 'Assigned Salesman' : 'Nhân viên phụ trách'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Opportunities' : 'Cơ hội'}</th>
                  <th className="px-4 py-3 text-center">{isEn ? 'Orders' : 'Đơn hàng'}</th>
                  <th className="px-4 py-3 text-right">{isEn ? 'Total Spent' : 'Tổng chi tiêu'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto text-slate-300 stroke-1 mb-2" />
                      <p>{isEn ? 'No potential leads recorded from this campaign yet.' : 'Chưa có khách hàng tiềm năng nào được ghi nhận từ chiến dịch này.'}</p>
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#3CB371]">
                        <Link
                          to={`/leads/${l.id}`}
                          className="hover:underline inline-flex items-center gap-1"
                        >
                          <span>{l.lead_name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 print:hidden" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-mono">
                        {l.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {l.email || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {l.career || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDate(l.entered_date)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {l.assigned_to_name || (isEn ? 'Unassigned' : 'Chưa phân công')}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-[#3CB371]">
                        {l.opportunities_count || 0}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-600">
                        {l.orders_count || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {Number(l.total_spent || 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? '$' : 'đ'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {leads.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-slate-700 uppercase">
                      {isEn ? `Total (${leads.length} leads)` : `Tổng cộng (${leads.length} khách hàng tiềm năng)`}
                    </td>
                    <td className="px-4 py-3 text-center text-[#3CB371]">
                      {leads.reduce((acc, l) => acc + (parseInt(l.opportunities_count, 10) || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-600">
                      {leads.reduce((acc, l) => acc + (parseInt(l.orders_count, 10) || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {Number(leads.reduce((acc, l) => acc + (parseFloat(l.total_spent) || 0), 0)).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? '$' : 'đ'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Chữ ký khi in ấn */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-xs">
        <div>
          <p className="font-semibold text-slate-800">{isEn ? 'PREPARED BY' : 'NGƯỜI LẬP BÁO CÁO'}</p>
          <p className="text-slate-400 italic mt-1">{isEn ? '(Signature & full name)' : '(Ký và ghi rõ họ tên)'}</p>
          <div className="h-16"></div>
          <p className="font-medium text-slate-700">{campaign.created_by_name || (isEn ? 'Sales Manager' : 'Quản lý Bán hàng')}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{isEn ? 'DIRECTOR / SALES HEAD' : 'GIÁM ĐỐC / QUẢN LÝ KINH DOANH'}</p>
          <p className="text-slate-400 italic mt-1">{isEn ? '(Signature & seal)' : '(Ký, đóng dấu)'}</p>
          <div className="h-16"></div>
          <p className="font-medium text-slate-700">{isEn ? 'Board of Directors' : 'Ban Giám Đốc'}</p>
        </div>
      </div>
    </div>
  );
}
