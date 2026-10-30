import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import forecastApi from '../../api/forecastApi';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Printer,
  AlertCircle,
  Edit,
  ShoppingCart,
  Percent,
  Award,
  Loader2,
} from 'lucide-react';

// Import Chart.js và react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Đăng ký các modules Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend
);

/**
 * PerformanceReportPage - Báo cáo Đối soát Doanh số Kế hoạch vs Thực tế 12 Tháng
 * Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh
 */
export default function PerformanceReportPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const currentYear = new Date().getFullYear();
  const initialYear = parseInt(searchParams.get('fiscal_year'), 10) || currentYear;

  const [fiscalYear, setFiscalYear] = useState(initialYear);
  const [availableYears, setAvailableYears] = useState([currentYear, currentYear + 1]);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const locale = language === 'en' ? 'en-US' : 'vi-VN';
  const currencySuffix = t('currencyUnit', 'VNĐ');

  // Tải danh sách năm tài chính
  useEffect(() => {
    forecastApi.getAvailableYears()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAvailableYears(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Tải báo cáo đối soát performance
  const fetchPerformance = useCallback(async (year) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await forecastApi.getPerformanceReport({ fiscal_year: year });
      setReportData(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || (language === 'en' ? 'Unable to load sales audit report.' : 'Không thể tải báo cáo đối soát doanh số.'));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchPerformance(fiscalYear);
    setSearchParams({ fiscal_year: fiscalYear });
  }, [fiscalYear, fetchPerformance, setSearchParams]);

  const handlePrint = () => {
    window.print();
  };

  // Cấu hình dữ liệu biểu đồ kết hợp (Mixed Bar & Line Chart)
  const chartData = useMemo(() => {
    if (!reportData || !reportData.months) {
      return { labels: [], datasets: [] };
    }

    const labels = reportData.months.map((m) =>
      language === 'en' ? `Month ${m.month}` : m.month_label
    );
    const planValues = reportData.months.map((m) => m.plan);
    const actualValues = reportData.months.map((m) => m.actually_value);
    const percentages = reportData.months.map((m) => m.percentage);

    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: language === 'en' ? 'Plan Target (VND)' : 'Kế hoạch Plan (VNĐ)',
          data: planValues,
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderColor: 'rgb(37, 99, 235)',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          type: 'bar',
          label: language === 'en' ? 'Actual Value (VND)' : 'Thực tế Actually Value (VNĐ)',
          data: actualValues,
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: 'rgb(5, 150, 105)',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: language === 'en' ? 'Completion (%)' : 'Tỷ lệ Đạt (%)',
          data: percentages,
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          pointBackgroundColor: 'rgb(217, 119, 6)',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
          pointRadius: 4,
          borderWidth: 3,
          tension: 0.3,
          yAxisID: 'y1',
        },
      ],
    };
  }, [reportData, language]);

  // Cấu hình options cho Chart.js
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            font: { family: 'inherit', size: 12, weight: 'bold' },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              const val = context.raw || 0;
              if (context.dataset.yAxisID === 'y1') {
                return `${label}: ${val}%`;
              }
              return `${label}: ${Number(val).toLocaleString(locale)} ${currencySuffix}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: language === 'en' ? 'Sales Revenue (VND)' : 'Doanh số (VNĐ)',
            font: { size: 11, weight: 'bold' },
          },
          ticks: {
            callback: (v) => {
              if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
              if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
              return v;
            },
            font: { size: 10 },
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: {
            display: true,
            text: language === 'en' ? 'Completion rate (%)' : 'Tỷ lệ hoàn thành (%)',
            font: { size: 11, weight: 'bold' },
          },
          ticks: {
            callback: (v) => `${v}%`,
            font: { size: 10 },
          },
          min: 0,
        },
      },
    };
  }, [locale, currencySuffix, language]);

  const summary = reportData?.summary || {
    total_plan: 0,
    total_actual: 0,
    total_orders: 0,
    overall_percentage: 0,
    variance: 0,
  };

  const isAheadOfPlan = summary.variance >= 0;

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {language === 'en'
                ? '12-Month Sales Plan vs Actual Audit Report'
                : 'Báo cáo Đối soát Kế hoạch vs Thực tế 12 Tháng'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('perfReportSubtitle', 'Đối soát chỉ tiêu kế hoạch (Plan) với doanh thu thực tế (Actually) lũy kế từ đơn hàng')}
          </p>
        </div>

        {/* Nút Chọn Năm & Thao tác */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#3CB371]" />
            <span className="text-xs font-semibold text-slate-700">
              {t('fiscalYearLabel', 'Năm tài chính:')}
            </span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold text-[#2E7D32] focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {language === 'en' ? `Year ${yr}` : `Năm ${yr}`}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/forecast/setup?fiscal_year=${fiscalYear}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2E7D32] bg-[#EAF5EC] hover:bg-[#DDF0E2] border border-[#DDF0E2] rounded-xl transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{t('btnBackToSetup', 'Thiết Lập Kế Hoạch')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-gray-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('btnPrintReport', 'In Báo Cáo')}</span>
          </button>
        </div>
      </div>

      {/* Header in ấn */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {language === 'en' ? 'SALES PLAN VS ACTUAL AUDIT REPORT' : 'BÁO CÁO ĐỐI SOÁT DOANH SỐ KẾ HOẠCH VS THỰC TẾ'}
            </h1>
            <p className="text-sm font-semibold text-emerald-700 mt-0.5">
              {language === 'en' ? 'Fiscal Year:' : 'Năm tài chính:'} {fiscalYear}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>{new Date().toLocaleString(locale)}</p>
            <p>Zen CRM Enterprise — Executive Report</p>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* 5 Thẻ KPIs Tổng Kết Cả Năm */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:grid-cols-5 print:gap-2">
        {/* 1. Tổng Kế Hoạch */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {language === 'en' ? 'Target Plan (VND)' : 'Chỉ tiêu Plan (VNĐ)'}
            </span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {Number(summary.total_plan || 0).toLocaleString(locale)}
            <span className="text-xs font-normal text-slate-500 ml-1">{currencySuffix}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {language === 'en' ? `Full Year ${fiscalYear} Plan` : `Kế hoạch cả năm ${fiscalYear}`}
          </span>
        </div>

        {/* 2. Thực Tế Đạt Được */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {language === 'en' ? 'Actual Revenue (VND)' : 'Thực tế Actually (VNĐ)'}
            </span>
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {Number(summary.total_actual || 0).toLocaleString(locale)}
            <span className="text-xs font-normal text-slate-500 ml-1">{currencySuffix}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {language === 'en' ? `From ${summary.total_orders || 0} orders` : `Từ ${summary.total_orders || 0} đơn hàng`}
          </span>
        </div>

        {/* 3. Tỷ Lệ Hoàn Thành */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {language === 'en' ? 'Completion Rate (%)' : 'Tỷ lệ Hoàn thành (%)'}
            </span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-600">
            {summary.overall_percentage}%
          </div>
          <span className="text-[11px] text-slate-400">
            {language === 'en' ? 'Actually / Plan' : 'Thực tế / Kế hoạch'}
          </span>
        </div>

        {/* 4. Chênh Lệch Doanh Số */}
        <div className={`p-4 rounded-xl bg-white border shadow-xs print:border-slate-300 ${
          isAheadOfPlan ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold text-slate-700">
              {language === 'en' ? 'Variance' : 'Chênh lệch'}
            </span>
            {isAheadOfPlan ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className={`text-lg font-bold ${isAheadOfPlan ? 'text-emerald-700' : 'text-rose-600'}`}>
            {summary.variance > 0 ? `+${Number(summary.variance).toLocaleString(locale)}` : Number(summary.variance).toLocaleString(locale)} {currencySuffix}
          </div>
          <span className="text-[11px] text-slate-500">
            {isAheadOfPlan
              ? (language === 'en' ? 'Ahead of plan' : 'Vượt kế hoạch')
              : (language === 'en' ? 'Behind target' : 'Chưa đạt mục tiêu')}
          </span>
        </div>

        {/* 5. Đánh Giá Tiến Độ */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs print:border-slate-300">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {language === 'en' ? 'Overall Status' : 'Đánh giá chung'}
            </span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-sm font-bold text-slate-800 mt-1">
            {summary.overall_percentage >= 100
              ? (language === 'en' ? 'Excellent' : 'Xuất sắc')
              : summary.overall_percentage >= 80
              ? (language === 'en' ? 'Good Growth' : 'Tăng trưởng tốt')
              : summary.overall_percentage >= 50
              ? (language === 'en' ? 'On Track' : 'Tiến độ bình thường')
              : (language === 'en' ? 'Needs Acceleration' : 'Cần đẩy mạnh bán hàng')}
          </div>
          <span className="text-[11px] text-slate-400">
            {language === 'en' ? `Fiscal Year ${fiscalYear}` : `Năm tài chính ${fiscalYear}`}
          </span>
        </div>
      </div>

      {/* Biểu Đồ Trực Quan Hóa Bằng Chart.js */}
      <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#3CB371]" />
              <span>
                {language === 'en'
                  ? `12-Month Sales Audit Chart for Year ${fiscalYear}`
                  : `Biểu Đồ Đối Soát Doanh Số 12 Tháng Năm ${fiscalYear}`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'en'
                ? 'Target Plan Bars vs Actual Value Bars vs Completion Rate Curve'
                : 'Cột Kế hoạch (Plan) vs Cột Thực tế (Actually Value) vs Đường Tỷ lệ hoàn thành %'}
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#3CB371] mr-2" />
              <span>{language === 'en' ? 'Rendering chart...' : 'Đang kết xuất biểu đồ...'}</span>
            </div>
          ) : (
            <Chart type="bar" data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Bảng Đối Soát 12 Tháng */}
      <div className="bg-white rounded-2xl border border-[#DDF0E2] shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-[#DDF0E2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === 'en'
                ? '12-Month Detailed Sales Audit Table'
                : 'Bảng Số Liệu Đối Soát Chi Tiết 12 Tháng'}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              ({language === 'en' ? '% Rate = Actually / Plan * 100' : 'Tỷ lệ % = Thực tế / Kế hoạch * 100'})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#F3F4F6] border-b border-[#DDF0E2] text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-5 py-3">{t('thMonth', 'Tháng (Month)')}</th>
                <th className="px-5 py-3 text-right">{t('thPlanAmount', 'Kế hoạch Plan ($)')}</th>
                <th className="px-5 py-3 text-right">{t('thActualAmount', 'Thực tế Actually Value ($)')}</th>
                <th className="px-5 py-3 text-center">{language === 'en' ? 'Orders' : 'Đơn chốt'}</th>
                <th className="px-5 py-3 text-right">{language === 'en' ? 'Variance ($)' : 'Chênh lệch ($)'}</th>
                <th className="px-5 py-3 text-right">{t('thCompletionPct', 'Tỷ lệ Hoàn thành (%)')}</th>
                <th className="px-5 py-3 text-center">{t('thProgressEval', 'Trạng thái đánh giá')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3CB371] mx-auto mb-2" />
                    <span>{language === 'en' ? 'Synthesizing audit figures...' : 'Đang tổng hợp số liệu đối soát...'}</span>
                  </td>
                </tr>
              ) : (
                reportData?.months?.map((m) => {
                  const isPositive = m.variance >= 0;
                  const monthLabel = language === 'en' ? `Month ${m.month}` : m.month_label;

                  // Xác định badge đánh giá
                  let statusBadge = {
                    label: language === 'en' ? 'Pending' : 'Chưa đạt',
                    color: 'bg-rose-100 text-rose-800 border-rose-200',
                  };
                  if (m.percentage >= 100) {
                    statusBadge = {
                      label: language === 'en' ? 'Target Met' : 'Vượt chỉ tiêu',
                      color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
                    };
                  } else if (m.percentage >= 80) {
                    statusBadge = {
                      label: language === 'en' ? 'Good' : 'Đạt tốt',
                      color: 'bg-blue-100 text-blue-800 border-blue-200',
                    };
                  } else if (m.percentage >= 50) {
                    statusBadge = {
                      label: language === 'en' ? 'Progressing' : 'Đang tiến triển',
                      color: 'bg-amber-100 text-amber-800 border-amber-200',
                    };
                  }

                  return (
                    <tr key={m.month} className="hover:bg-[#EAF5EC]/40 transition-colors">
                      {/* Tháng */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {monthLabel}
                      </td>

                      {/* Kế hoạch Plan ($) */}
                      <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                        {m.plan > 0 ? (
                          `${m.plan.toLocaleString(locale)} ${currencySuffix}`
                        ) : (
                          <span className="text-slate-400">0 {currencySuffix}</span>
                        )}
                      </td>

                      {/* Thực tế Actually Value ($) */}
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-700">
                        {m.actually_value > 0 ? (
                          `${m.actually_value.toLocaleString(locale)} ${currencySuffix}`
                        ) : (
                          <span className="text-slate-400">0 {currencySuffix}</span>
                        )}
                      </td>

                      {/* Số đơn chốt */}
                      <td className="px-5 py-3.5 text-center font-semibold text-blue-600">
                        {m.orders_count || 0}
                      </td>

                      {/* Chênh lệch Variance */}
                      <td className={`px-5 py-3.5 text-right font-semibold ${
                        isPositive ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {m.variance > 0 ? `+${m.variance.toLocaleString(locale)}` : m.variance.toLocaleString(locale)} {currencySuffix}
                      </td>

                      {/* Tỷ lệ % */}
                      <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                        <span className={m.percentage >= 100 ? 'text-emerald-700' : m.percentage >= 50 ? 'text-amber-700' : 'text-slate-700'}>
                          {m.percentage}%
                        </span>
                      </td>

                      {/* Trạng thái đánh giá */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Dòng Tổng cộng cả năm */}
            <tfoot className="bg-[#F3F4F6] border-t-2 border-[#DDF0E2] text-sm font-bold text-slate-900">
              <tr>
                <td className="px-5 py-3.5 uppercase">
                  {language === 'en' ? `ANNUAL TOTAL ${fiscalYear}:` : `TỔNG KẾT NĂM ${fiscalYear}:`}
                </td>
                <td className="px-5 py-3.5 text-right text-blue-700 font-extrabold">
                  {summary.total_plan.toLocaleString(locale)} {currencySuffix}
                </td>
                <td className="px-5 py-3.5 text-right text-emerald-700 font-extrabold">
                  {summary.total_actual.toLocaleString(locale)} {currencySuffix}
                </td>
                <td className="px-5 py-3.5 text-center text-blue-700 font-extrabold">
                  {summary.total_orders}
                </td>
                <td className={`px-5 py-3.5 text-right font-extrabold ${isAheadOfPlan ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {summary.variance > 0 ? `+${summary.variance.toLocaleString(locale)}` : summary.variance.toLocaleString(locale)} {currencySuffix}
                </td>
                <td className="px-5 py-3.5 text-right text-amber-700 font-extrabold text-base">
                  {summary.overall_percentage}%
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    isAheadOfPlan ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isAheadOfPlan
                      ? (language === 'en' ? 'AHEAD OF TARGET' : 'VƯỢT CHỈ TIÊU')
                      : (language === 'en' ? 'MONITORING' : 'ĐANG THEO DÕI')}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
