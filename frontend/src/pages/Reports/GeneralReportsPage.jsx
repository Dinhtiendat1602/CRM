import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import reportApi from '../../api/reportApi';
import {
  BarChart3,
  ShoppingCart,
  Users,
  Target,
  Package,
  Calendar,
  Layers,
  Printer,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Award,
  Filter,
  Loader2,
} from 'lucide-react';

/**
 * GeneralReportsPage - Báo cáo Bán hàng & Thống kê Doanh số Toàn diện
 * Tuân thủ SRS v1.1 Mục 2.1 (Dành riêng cho Sale Manager & Admin)
 */
export default function GeneralReportsPage() {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'leads' | 'orders' | 'revenue'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Bộ lọc thời gian toàn cục
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [period, setPeriod] = useState('month'); // 'day' | 'month'

  // Dữ liệu các báo cáo
  const [summaryData, setSummaryData] = useState(null);
  const [leadsData, setLeadsData] = useState(null);
  const [ordersData, setOrdersData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);

  // Tải dữ liệu tùy theo activeTab
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const filterParams = {
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        period,
      };

      if (activeTab === 'summary') {
        const res = await reportApi.getSummaryReport();
        setSummaryData(res.data);
      } else if (activeTab === 'leads') {
        const res = await reportApi.getLeadReport(filterParams);
        setLeadsData(res.data);
      } else if (activeTab === 'orders') {
        const res = await reportApi.getOrderReport(filterParams);
        setOrdersData(res.data);
      } else if (activeTab === 'revenue') {
        const res = await reportApi.getRevenueReport(filterParams);
        setRevenueData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể tải dữ liệu báo cáo thống kê.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fromDate, toDate, period]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setPeriod('month');
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">
              Báo cáo Kinh doanh & Thống kê Doanh số
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF5EC] text-[#2E7D32] border border-[#DDF0E2] font-semibold">
              SRS 2.1
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Hệ thống phân tích chuyên sâu hiệu quả bán hàng, đo lường Leads, Đơn hàng và Doanh thu theo chu kỳ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReportData}
            title="Làm mới số liệu"
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Header ẩn chỉ hiện khi Print */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
        <h1 className="text-xl font-bold text-slate-900">BÁO CÁO KINH DOANH & THỐNG KÊ DOANH SỐ TỔNG HỢP</h1>
        <p className="text-xs text-slate-500 mt-1">
          Ngày xuất báo cáo: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}
        </p>
      </div>

      {/* Thanh Lọc Thời Gian Toàn Cục */}
      <div className="p-4 rounded-xl bg-white border border-[#DDF0E2] shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
            <Filter className="w-4 h-4 text-[#3CB371]" />
            <span>Bộ lọc:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title="Từ ngày"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all"
            />
            <span className="text-xs text-[#6B7280]">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title="Đến ngày"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#F3F4F6] p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                period === 'month' ? 'bg-white text-[#2E7D32] shadow-xs' : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Theo Tháng
            </button>
            <button
              type="button"
              onClick={() => setPeriod('day')}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                period === 'day' ? 'bg-white text-[#2E7D32] shadow-xs' : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              Theo Ngày
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="text-xs text-[#6B7280] hover:text-[#1F2937] font-medium underline cursor-pointer"
        >
          Đặt lại thời gian
        </button>
      </div>

      {/* Tabs Chuyển Đổi Phân Hệ Báo Cáo */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-2 rounded-t-xl print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'summary'
              ? 'border-[#3CB371] text-[#2E7D32]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tổng Quan Điều Hành (Executive Summary)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'leads'
              ? 'border-[#3CB371] text-[#2E7D32]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Khách Hàng Tiềm Năng (Leads)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-[#3CB371] text-[#2E7D32]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Đơn Hàng & Giá Trị Đơn (Orders)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('revenue')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'revenue'
              ? 'border-[#3CB371] text-[#2E7D32]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Doanh Thu Theo Sản Phẩm & Danh Mục</span>
        </button>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-[#DDF0E2]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3CB371] mb-2" />
          <span className="text-sm font-medium">Đang tính toán và tải dữ liệu báo cáo...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && summaryData && (
            <div className="space-y-6">
              {/* So sánh 3 kỳ: Hôm nay - Tháng này - Năm nay */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Hôm nay */}
                <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                      Hôm Nay (Today)
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3CB371] animate-pulse" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-xs text-[#6B7280]">Doanh thu chốt hôm nay</span>
                      <div className="text-2xl font-bold text-[#2E7D32]">
                        {Number(summaryData.today.revenue || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[#6B7280]">Đơn hàng mới:</span>{' '}
                        <strong className="text-[#1F2937]">{summaryData.today.orders}</strong>
                      </div>
                      <div>
                        <span className="text-[#6B7280]">Leads nhập:</span>{' '}
                        <strong className="text-[#1F2937]">{summaryData.today.leads}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tháng này */}
                <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                      Tháng Này (This Month)
                    </span>
                    <Calendar className="w-4 h-4 text-[#3CB371]" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-xs text-[#6B7280]">Doanh thu lũy kế tháng</span>
                      <div className="text-2xl font-bold text-[#2E7D32]">
                        {Number(summaryData.month.revenue || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[#6B7280]">Tổng đơn chốt:</span>{' '}
                        <strong className="text-[#1F2937]">{summaryData.month.orders}</strong>
                      </div>
                      <div>
                        <span className="text-[#6B7280]">Tổng Leads:</span>{' '}
                        <strong className="text-[#1F2937]">{summaryData.month.leads}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Năm nay & Chỉ tiêu kế hoạch */}
                <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                      Năm Nay (This Year)
                    </span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-xs text-[#6B7280]">Doanh thu lũy kế năm</span>
                      <div className="text-2xl font-bold text-[#1F2937]">
                        {Number(summaryData.year.revenue || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    {summaryData.year.target > 0 ? (
                      <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between text-[#6B7280]">
                          <span>Chỉ tiêu: {Number(summaryData.year.target).toLocaleString('vi-VN')} đ</span>
                          <span className="font-semibold text-[#2E7D32]">
                            {summaryData.year.achievement_rate}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                          <div
                            className="h-full bg-[#3CB371] rounded-full"
                            style={{ width: `${Math.min(100, summaryData.year.achievement_rate)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 text-xs text-[#6B7280]">
                        Chưa thiết lập chỉ tiêu kế hoạch năm tài chính.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pipeline Cơ Hội & Tỷ Lệ Chuyển Đổi */}
              <div className="p-6 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                <h3 className="text-base font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#3CB371]" />
                  <span>Sức Khỏe Phễu Bán Hàng & Chuyển Đổi Toàn Hệ Thống (Sales Pipeline)</span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3.5 rounded-xl bg-[#F3F4F6] border border-slate-200">
                    <span className="text-xs text-[#6B7280] font-medium">Tổng Cơ hội</span>
                    <div className="text-xl font-bold text-[#1F2937] mt-1">
                      {summaryData.pipeline.total_opportunities}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#EAF5EC] border border-[#DDF0E2]">
                    <span className="text-xs text-[#2E7D32] font-medium">Cơ hội Đang Tư Vấn</span>
                    <div className="text-xl font-bold text-[#1F2937] mt-1">
                      {summaryData.pipeline.open_opportunities}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#EAF5EC] border border-[#DDF0E2]">
                    <span className="text-xs text-[#2E7D32] font-medium">Chốt Đơn Thành Công</span>
                    <div className="text-xl font-bold text-[#1F2937] mt-1">
                      {summaryData.pipeline.closed_won_opportunities}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F3F4F6] border border-slate-200">
                    <span className="text-xs text-[#6B7280] font-medium">Giá Trị Pipeline Mở</span>
                    <div className="text-xl font-bold text-[#1F2937] mt-1">
                      {Number(summaryData.pipeline.pipeline_value || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-xs text-amber-700 font-medium">Tỷ Lệ Chuyển Đổi Chung</span>
                    <div className="text-xl font-bold text-amber-900 mt-1">
                      {summaryData.pipeline.conversion_rate}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS REPORT */}
          {activeTab === 'leads' && leadsData && (
            <div className="space-y-6">
              {/* Chuỗi thời gian Leads */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Khách Hàng Tiềm Năng Nhập Mới Theo Chu Kỳ ({period === 'day' ? 'Ngày' : 'Tháng'})</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                      <tr>
                        <th className="px-4 py-3">Chu kỳ thời gian</th>
                        <th className="px-4 py-3 text-right">Số lượng Leads mới</th>
                        <th className="px-4 py-3">Biểu đồ tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leadsData.time_series.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400">
                            Không có dữ liệu trong khoảng thời gian này.
                          </td>
                        </tr>
                      ) : (
                        leadsData.time_series.map((item, idx) => {
                          const maxCount = Math.max(...leadsData.time_series.map((t) => parseInt(t.leads_count, 10)), 1);
                          const pct = Math.round((parseInt(item.leads_count, 10) / maxCount) * 100);

                          return (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {item.time_bucket}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-[#2E7D32]">
                                {item.leads_count}
                              </td>
                              <td className="px-4 py-3 w-1/2">
                                <div className="w-full h-3 rounded-full bg-[#F3F4F6] overflow-hidden">
                                  <div
                                    className="h-full bg-[#3CB371] rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phân bổ Leads theo Nguồn Chiến dịch & Theo Nhân viên */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phân bổ theo Chiến dịch */}
                <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                  <h3 className="text-sm font-bold text-[#1F2937] mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#3CB371]" />
                    <span>Phân Bổ Leads Theo Nguồn Chiến Dịch</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-[#F3F4F6] text-[#6B7280] uppercase border-b border-[#DDF0E2]">
                        <tr>
                          <th className="px-3 py-2">Chiến dịch tiếp thị</th>
                          <th className="px-3 py-2 text-center">Leads</th>
                          <th className="px-3 py-2 text-center">Cơ hội</th>
                          <th className="px-3 py-2 text-center">Đơn hàng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leadsData.by_campaign.map((c, idx) => (
                          <tr key={idx} className="hover:bg-[#EAF5EC]/40">
                            <td className="px-3 py-2.5 font-medium text-[#1F2937]">
                              {c.campaign_id && parseInt(c.campaign_id, 10) > 0 ? (
                                <Link
                                  to={`/campaigns/${c.campaign_id}/report`}
                                  className="text-[#2E7D32] hover:underline"
                                >
                                  {c.campaign_name}
                                </Link>
                              ) : (
                                c.campaign_name
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-[#2E7D32]">
                              {c.leads_count}
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-700">
                              {c.opportunities_count}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-emerald-600">
                              {c.orders_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Phân bổ theo Nhân viên */}
                <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                  <h3 className="text-sm font-bold text-[#1F2937] mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3CB371]" />
                    <span>Phân Bổ Leads Theo Nhân Viên Phụ Trách</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-[#F3F4F6] text-[#6B7280] uppercase border-b border-[#DDF0E2]">
                        <tr>
                          <th className="px-3 py-2">Nhân viên phụ trách</th>
                          <th className="px-3 py-2 text-right">Số Leads đang xử lý</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leadsData.by_user.map((u, idx) => (
                          <tr key={idx} className="hover:bg-[#EAF5EC]/40">
                            <td className="px-3 py-2.5 font-semibold text-[#1F2937]">
                              {u.staff_name}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-[#2E7D32]">
                              {u.leads_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS REPORT */}
          {activeTab === 'orders' && ordersData && (
            <div className="space-y-6">
              {/* Chuỗi thời gian Đơn hàng & AOV */}
              <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                <h3 className="text-base font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#3CB371]" />
                  <span>Số Lượng Đơn & Doanh Thu Theo Chu Kỳ</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#1F2937]">
                    <thead className="bg-[#F3F4F6] border-b border-[#DDF0E2] text-xs font-semibold text-[#6B7280] uppercase">
                      <tr>
                        <th className="px-4 py-3">Chu kỳ</th>
                        <th className="px-4 py-3 text-center">Số lượng đơn</th>
                        <th className="px-4 py-3 text-right">Doanh thu chốt</th>
                        <th className="px-4 py-3 text-right">Giá trị trung bình đơn (AOV)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordersData.time_series.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[#6B7280]">
                            Không có đơn hàng nào trong khoảng thời gian này.
                          </td>
                        </tr>
                      ) : (
                        ordersData.time_series.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#EAF5EC]/40">
                            <td className="px-4 py-3 font-semibold text-[#1F2937]">
                              {item.time_bucket}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-[#2E7D32]">
                              {item.orders_count}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-[#2E7D32]">
                              {Number(item.revenue || 0).toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-[#1F2937]">
                              {Number(item.average_order_value || 0).toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trạng thái đơn & Top nhân viên chốt sale */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trạng thái đơn */}
                <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                  <h3 className="text-sm font-bold text-[#1F2937] mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3CB371]" />
                    <span>Phân Bổ Theo Trạng Thái Đơn Hàng</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-[#F3F4F6] text-[#6B7280] uppercase border-b border-[#DDF0E2]">
                        <tr>
                          <th className="px-3 py-2">Trạng thái</th>
                          <th className="px-3 py-2 text-center">Số lượng</th>
                          <th className="px-3 py-2 text-right">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ordersData.by_status.map((st, idx) => (
                          <tr key={idx} className="hover:bg-[#EAF5EC]/40">
                            <td className="px-3 py-2.5 font-bold text-[#1F2937]">
                              {st.status}
                            </td>
                            <td className="px-3 py-2.5 text-center font-semibold text-[#2E7D32]">
                              {st.count}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-[#2E7D32]">
                              {Number(st.total_amount || 0).toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top nhân viên chốt sale */}
                <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                  <h3 className="text-sm font-bold text-[#1F2937] mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Hiệu Suất Chốt Đơn Của Nhân Viên Bán Hàng</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-[#F3F4F6] text-[#6B7280] uppercase border-b border-[#DDF0E2]">
                        <tr>
                          <th className="px-3 py-2">Nhân viên</th>
                          <th className="px-3 py-2 text-center">Số đơn chốt</th>
                          <th className="px-3 py-2 text-right">Doanh thu mang về</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ordersData.by_staff.map((stf, idx) => (
                          <tr key={idx} className="hover:bg-[#EAF5EC]/40">
                            <td className="px-3 py-2.5 font-semibold text-[#1F2937]">
                              {stf.staff_name}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-[#2E7D32]">
                              {stf.orders_count}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-[#2E7D32]">
                              {Number(stf.total_revenue || 0).toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVENUE BY PRODUCT & CATEGORY (SRS 2.1) */}
          {activeTab === 'revenue' && revenueData && (
            <div className="space-y-6">
              {/* Thẻ tổng doanh thu - styled with accent gradient */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#7CA5F5] to-[#5D3EBC] text-white shadow-md">
                <span className="text-xs uppercase tracking-wider text-indigo-100 font-semibold">
                  Tổng Doanh Thu Toàn Kỳ Khảo Sát
                </span>
                <div className="text-3xl font-extrabold mt-1">
                  {Number(revenueData.grand_total || 0).toLocaleString('vi-VN')}{' '}
                  <span className="text-lg font-normal text-indigo-100">VNĐ</span>
                </div>
                <p className="text-xs text-indigo-100 mt-2">
                  Dữ liệu được tổng hợp trực tiếp từ các hóa đơn chốt đơn thành công trong hệ thống.
                </p>
              </div>

              {/* Bảng Doanh thu theo từng Sản phẩm (Revenue by Product - SRS 2.1) */}
              <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#3CB371]" />
                      <span>Phân Bổ Doanh Thu Theo Từng Sản Phẩm (Revenue by Product)</span>
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">SRS 2.1 — Đo lường tỷ trọng doanh số và số lượng bán của từng sản phẩm</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#1F2937]">
                    <thead className="bg-[#F3F4F6] border-b border-[#DDF0E2] text-xs font-semibold text-[#6B7280] uppercase">
                      <tr>
                        <th className="px-4 py-3">Mã SP</th>
                        <th className="px-4 py-3">Tên sản phẩm</th>
                        <th className="px-4 py-3">Danh mục</th>
                        <th className="px-4 py-3 text-center">Số đơn</th>
                        <th className="px-4 py-3 text-center">Đã bán (units)</th>
                        <th className="px-4 py-3 text-right">Doanh thu</th>
                        <th className="px-4 py-3 text-right">% Đóng góp</th>
                        <th className="px-4 py-3 w-40">Tỷ trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenueData.by_product.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-[#6B7280]">
                            Chưa có dữ liệu doanh số sản phẩm trong khoảng thời gian này.
                          </td>
                        </tr>
                      ) : (
                        revenueData.by_product.map((item) => (
                          <tr key={item.product_id} className="hover:bg-[#EAF5EC]/40">
                            <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">
                              {item.product_code}
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#1F2937]">
                              {item.product_id ? (
                                <Link
                                  to={`/products/${item.product_id}`}
                                  className="text-[#2E7D32] hover:underline"
                                >
                                  {item.product_name}
                                </Link>
                              ) : (
                                item.product_name
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#6B7280]">
                              {item.category_name || 'Mặc định'}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-[#2E7D32]">
                              {item.orders_count}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-[#1F2937]">
                              {item.units_sold}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-700">
                              {Number(item.revenue || 0).toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-[#2E7D32]">
                              {item.revenue_share}%
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                                <div
                                  className="h-full bg-[#3CB371] rounded-full"
                                  style={{ width: `${Math.min(100, item.revenue_share)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bảng Doanh thu theo Danh mục sản phẩm (Revenue by Category) */}
              <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#3CB371]" />
                      <span>Phân Bổ Doanh Thu Theo Danh Mục Sản Phẩm (Revenue by Category)</span>
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">SRS 2.1 — Đánh giá nhóm sản phẩm chiến lược</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#1F2937]">
                    <thead className="bg-[#F3F4F6] border-b border-[#DDF0E2] text-xs font-semibold text-[#6B7280] uppercase">
                      <tr>
                        <th className="px-4 py-3">Danh mục sản phẩm</th>
                        <th className="px-4 py-3 text-center">Số đơn</th>
                        <th className="px-4 py-3 text-center">Số lượng bán</th>
                        <th className="px-4 py-3 text-right">Doanh thu</th>
                        <th className="px-4 py-3 text-right">% Tỷ trọng</th>
                        <th className="px-4 py-3 w-40">Tỷ trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenueData.by_category.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-[#6B7280]">
                            Chưa có dữ liệu doanh số danh mục.
                          </td>
                        </tr>
                      ) : (
                        revenueData.by_category.map((cat, idx) => (
                          <tr key={idx} className="hover:bg-[#EAF5EC]/40">
                            <td className="px-4 py-3 font-semibold text-[#1F2937]">
                              {cat.category_name}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-[#2E7D32]">
                              {cat.orders_count}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-[#1F2937]">
                              {cat.units_sold}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-700">
                              {Number(cat.revenue || 0).toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-[#2E7D32]">
                              {cat.revenue_share}%
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                                <div
                                  className="h-full bg-[#3CB371] rounded-full"
                                  style={{ width: `${Math.min(100, cat.revenue_share)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Chữ ký khi In ấn */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-xs">
        <div>
          <p className="font-semibold text-slate-800">NGƯỜI LẬP BÁO CÁO</p>
          <p className="text-slate-400 italic mt-1">(Ký và ghi rõ họ tên)</p>
          <div className="h-16"></div>
          <p className="font-medium text-slate-700">Phòng Kế Hoạch & Phân Tích</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">GIÁM ĐỐC ĐIỀU HÀNH</p>
          <p className="text-slate-400 italic mt-1">(Ký, đóng dấu)</p>
          <div className="h-16"></div>
          <p className="font-medium text-slate-700">Ban Lãnh Đạo Công Ty</p>
        </div>
      </div>
    </div>
  );
}
