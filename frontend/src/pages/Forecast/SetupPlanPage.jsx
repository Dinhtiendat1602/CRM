import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import forecastApi from '../../api/forecastApi';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Save,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';

const MONTH_DATA = [
  { month: 1, quarter: 'Q1' },
  { month: 2, quarter: 'Q1' },
  { month: 3, quarter: 'Q1' },
  { month: 4, quarter: 'Q2' },
  { month: 5, quarter: 'Q2' },
  { month: 6, quarter: 'Q2' },
  { month: 7, quarter: 'Q3' },
  { month: 8, quarter: 'Q3' },
  { month: 9, quarter: 'Q3' },
  { month: 10, quarter: 'Q4' },
  { month: 11, quarter: 'Q4' },
  { month: 12, quarter: 'Q4' },
];

/**
 * SetupPlanPage - Thiết lập Kế hoạch Doanh số 12 Tháng
 * Hỗ trợ giao diện song ngữ Tiếng Việt & Tiếng Anh
 */
export default function SetupPlanPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const currentYear = new Date().getFullYear();
  const initialYear = parseInt(searchParams.get('fiscal_year'), 10) || currentYear;

  const [fiscalYear, setFiscalYear] = useState(initialYear);
  const [availableYears, setAvailableYears] = useState([currentYear, currentYear + 1]);

  // Object lưu chỉ tiêu 12 tháng: { 1: 100000000, 2: 120000000, ... }
  const [targets, setTargets] = useState(() => {
    const init = {};
    for (let m = 1; m <= 12; m++) init[m] = 0;
    return init;
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Giá trị nhập cho công cụ phân bổ nhanh
  const [quickTotal, setQuickTotal] = useState('');

  // Tải danh sách năm tài chính khả dụng
  useEffect(() => {
    forecastApi.getAvailableYears()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAvailableYears(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Tải kế hoạch 12 tháng của năm tài chính được chọn
  const fetchPlans = useCallback(async (year) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await forecastApi.getPlans({ fiscal_year: year });
      const planList = res.data?.plans || [];

      const newTargets = {};
      for (let m = 1; m <= 12; m++) {
        const found = planList.find((p) => p.month === m);
        newTargets[m] = found ? parseFloat(found.target_amount) : 0;
      }
      setTargets(newTargets);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || t('msgPlanLoadError', 'Không thể tải kế hoạch doanh số năm tài chính.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPlans(fiscalYear);
    setSearchParams({ fiscal_year: fiscalYear });
  }, [fiscalYear, fetchPlans, setSearchParams]);

  // Xử lý thay đổi giá trị một tháng
  const handleTargetChange = (month, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setTargets((prev) => ({ ...prev, [month]: num }));
    setSuccessMsg('');
  };

  // Tính toán tổng kế hoạch cả năm
  const totalYearPlan = useMemo(() => {
    return Object.values(targets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [targets]);

  // Trung bình mỗi tháng
  const monthlyAverage = useMemo(() => {
    return totalYearPlan / 12;
  }, [totalYearPlan]);

  // Tổng theo từng Quý
  const quarterlyTotals = useMemo(() => {
    return {
      Q1: (targets[1] || 0) + (targets[2] || 0) + (targets[3] || 0),
      Q2: (targets[4] || 0) + (targets[5] || 0) + (targets[6] || 0),
      Q3: (targets[7] || 0) + (targets[8] || 0) + (targets[9] || 0),
      Q4: (targets[10] || 0) + (targets[11] || 0) + (targets[12] || 0),
    };
  }, [targets]);

  // Công cụ chia đều 12 tháng
  const handleApplyEvenSplit = () => {
    const total = parseFloat(quickTotal);
    if (!total || total <= 0) {
      setErrorMsg(language === 'en' ? 'Please enter a valid positive annual total.' : 'Vui lòng nhập tổng chỉ tiêu năm hợp lệ (> 0).');
      return;
    }
    const perMonth = Math.round(total / 12);
    const newTargets = {};
    for (let m = 1; m <= 12; m++) newTargets[m] = perMonth;
    setTargets(newTargets);
    setErrorMsg('');
    setSuccessMsg(language === 'en' ? `Equally split ${total.toLocaleString('en-US')} VND across 12 months.` : `Đã chia đều ${total.toLocaleString('vi-VN')} VNĐ cho 12 tháng.`);
  };

  // Công cụ tăng trưởng %
  const handleApplyGrowth = (pct) => {
    const newTargets = {};
    for (let m = 1; m <= 12; m++) {
      newTargets[m] = Math.round((targets[m] || 0) * (1 + pct / 100));
    }
    setTargets(newTargets);
    setSuccessMsg(language === 'en' ? `Applied +${pct}% growth across all 12 months.` : `Đã áp dụng mức tăng trưởng +${pct}% cho toàn bộ 12 tháng.`);
  };

  // Đặt lại về 0
  const handleResetToZero = () => {
    const newTargets = {};
    for (let m = 1; m <= 12; m++) newTargets[m] = 0;
    setTargets(newTargets);
    setQuickTotal('');
    setSuccessMsg(language === 'en' ? 'All month targets reset to 0.' : 'Đã đặt lại toàn bộ chỉ tiêu về 0.');
  };

  // Lưu kế hoạch 12 tháng lên Backend
  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    try {
      const plans = Object.entries(targets).map(([m, amount]) => ({
        month: parseInt(m, 10),
        target_amount: parseFloat(amount) || 0,
      }));

      await forecastApi.setupPlans({
        fiscal_year: fiscalYear,
        plans,
      });

      setSuccessMsg(
        language === 'en'
          ? `Successfully saved 12-month sales plan for year ${fiscalYear}.`
          : `Đã lưu thành công kế hoạch doanh số 12 tháng năm ${fiscalYear}.`
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || t('msgPlanSaveError', 'Có lỗi xảy ra khi lưu kế hoạch doanh số.'));
    } finally {
      setSaving(false);
    }
  };

  const locale = language === 'en' ? 'en-US' : 'vi-VN';
  const currencySuffix = t('currencyUnit', 'VNĐ');

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[#6B7280]">
          {t('forecastSetupSubtitle', 'Chỉ tiêu định mức doanh thu dự báo (Plan VNĐ) cho 12 tháng')}
        </span>

        {/* Chọn năm tài chính & Chuyển sang Đối soát */}
        <div className="flex items-center gap-2.5 ml-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#3CB371]" />
            <span className="text-xs font-semibold text-[#6B7280]">
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
            onClick={() => navigate(`/forecast/performance?fiscal_year=${fiscalYear}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2E7D32] bg-[#EAF5EC] hover:bg-[#DDF0E2] border border-[#DDF0E2] rounded-xl transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{t('btnViewPerformance', 'Xem Báo Cáo Đối Soát')}</span>
          </button>
        </div>
      </div>

      {/* Thông báo Thành công / Lỗi */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#EAF5EC] border border-[#DDF0E2] text-[#2E7D32] text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#3CB371] shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* 3 Thẻ Thống kê Tổng quan Kế hoạch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tổng chỉ tiêu năm */}
        <div className="p-5 rounded-2xl bg-[#EAF5EC] border border-[#DDF0E2] text-[#1F2937] shadow-xs">
          <div className="flex items-center justify-between text-[#2E7D32] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('kpiTotalYearTarget', 'TỔNG CHỈ TIÊU NĂM')} {fiscalYear}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#3CB371] shadow-2xs border border-[#DDF0E2]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#1F2937] mt-1">
            {totalYearPlan.toLocaleString(locale)}{' '}
            <span className="text-sm font-semibold text-[#3CB371]">{currencySuffix}</span>
          </div>
          <p className="text-xs text-[#2E7D32] mt-2 font-medium">
            {t('kpiTotalYearDesc', 'Mẫu số chuẩn dùng để đối soát tỷ lệ hoàn thành % trên Bảng điều khiển và Báo cáo hiệu suất.')}
          </p>
        </div>

        {/* Trung bình mỗi tháng */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              {t('kpiMonthlyAverage', 'MỤC TIÊU TRUNG BÌNH / THÁNG')}
            </span>
            <TrendingUp className="w-5 h-5 text-[#3CB371]" />
          </div>
          <div className="text-2xl font-bold text-[#1F2937] mt-1">
            {Math.round(monthlyAverage).toLocaleString(locale)}{' '}
            <span className="text-xs font-normal text-[#6B7280]">{currencySuffix}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#6B7280] mt-3 pt-2 border-t border-[#DDF0E2]/60">
            <span>{t('kpi12Periods', '12 kỳ đánh giá doanh số')}</span>
            <span>•</span>
            <span>{t('kpiStandardizedPlan', 'Kế hoạch năm chuẩn hóa')}</span>
          </div>
        </div>

        {/* Phân bổ theo Quý */}
        <div className="p-5 rounded-2xl bg-white border border-[#DDF0E2] shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              {t('kpiQuarterlyPlan', 'KẾ HOẠCH 4 QUÝ (QUARTERLY)')}
            </span>
            <Layers className="w-5 h-5 text-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="p-2 rounded-lg bg-[#F3F4F6] border border-slate-200">
              <span className="text-[#6B7280] block text-[11px]">{t('quarter1', 'Quý 1 (T1-T3)')}</span>
              <strong className="text-[#1F2937] font-bold">
                {quarterlyTotals.Q1.toLocaleString(locale)} {currencySuffix}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-[#F3F4F6] border border-slate-200">
              <span className="text-[#6B7280] block text-[11px]">{t('quarter2', 'Quý 2 (T4-T6)')}</span>
              <strong className="text-[#1F2937] font-bold">
                {quarterlyTotals.Q2.toLocaleString(locale)} {currencySuffix}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-[#F3F4F6] border border-slate-200">
              <span className="text-[#6B7280] block text-[11px]">{t('quarter3', 'Quý 3 (T7-T9)')}</span>
              <strong className="text-[#1F2937] font-bold">
                {quarterlyTotals.Q3.toLocaleString(locale)} {currencySuffix}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-[#F3F4F6] border border-slate-200">
              <span className="text-[#6B7280] block text-[11px]">{t('quarter4', 'Quý 4 (T10-T12)')}</span>
              <strong className="text-[#1F2937] font-bold">
                {quarterlyTotals.Q4.toLocaleString(locale)} {currencySuffix}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Hộp Công Cụ Phân Bổ Nhanh (Smart Allocation Tools) */}
      <div className="p-4 rounded-xl bg-white border border-[#DDF0E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-[#1F2937] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t('quickCalcTools', 'Công cụ tính nhanh:')}</span>
          </span>

          {/* Chia đều tổng năm */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder={t('quickCalcPlaceholder', 'Nhập tổng năm...')}
              value={quickTotal}
              onChange={(e) => setQuickTotal(e.target.value)}
              className="w-40 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371]"
            />
            <button
              type="button"
              onClick={handleApplyEvenSplit}
              className="px-2.5 py-1 text-xs font-medium text-[#1F2937] bg-[#F3F4F6] hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {t('btnDivideEqually', 'Chia đều 12 tháng')}
            </button>
          </div>

          {/* Tăng trưởng % */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleApplyGrowth(10)}
              className="px-2 py-1 text-xs font-medium text-[#2E7D32] bg-[#EAF5EC] hover:bg-[#DDF0E2] rounded-lg transition-colors cursor-pointer"
            >
              +10%
            </button>
            <button
              type="button"
              onClick={() => handleApplyGrowth(20)}
              className="px-2 py-1 text-xs font-medium text-[#2E7D32] bg-[#EAF5EC] hover:bg-[#DDF0E2] rounded-lg transition-colors cursor-pointer"
            >
              +20%
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToZero}
          className="text-xs text-[#6B7280] hover:text-rose-600 transition-colors cursor-pointer font-medium"
        >
          {t('btnResetZero', 'Đặt lại về 0')}
        </button>
      </div>

      {/* Bảng Biểu Mẫu Nhập Chỉ Tiêu 12 Tháng */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#DDF0E2] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F3F4F6]/50 border-b border-[#DDF0E2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
              {t('planTableTitle', 'BẢNG NHẬP ĐỊNH MỨC DOANH THU 12 THÁNG (Đơn vị tiền tệ: VNĐ)')}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('saving', 'Đang lưu...')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('btnSavePlan', 'Lưu Kế Hoạch Năm')} {fiscalYear}</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1F2937]">
            <thead className="bg-[#F3F4F6] border-b border-[#DDF0E2] text-xs font-semibold text-[#6B7280] uppercase">
              <tr>
                <th className="px-5 py-3 w-40">{t('thMonth', 'THÁNG (MONTH)')}</th>
                <th className="px-5 py-3 w-28">{t('thQuarter', 'QUÝ')}</th>
                <th className="px-5 py-3">{t('thTargetAmount', 'CHỈ TIÊU DOANH SỐ MỤC TIÊU (PLAN VALUE VNĐ)')}</th>
                <th className="px-5 py-3 text-right w-36">{t('thYearShare', '% TỶ TRỌNG NĂM')}</th>
                <th className="px-5 py-3 w-48">{t('thVisualAllocation', 'PHÂN BỔ TRỰC QUAN')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#6B7280]">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#3CB371]" />
                      <span>
                        {language === 'en'
                          ? `Loading plan for year ${fiscalYear}...`
                          : `Đang tải kế hoạch năm ${fiscalYear}...`}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                MONTH_DATA.map(({ month, quarter }) => {
                  const val = targets[month] || 0;
                  const share = totalYearPlan > 0 ? Number(((val / totalYearPlan) * 100).toFixed(1)) : 0;
                  const monthLabel = language === 'en' ? `Month ${month}` : `Tháng ${month}`;

                  return (
                    <tr key={month} className="hover:bg-[#EAF5EC]/40 transition-colors">
                      {/* Tên Tháng */}
                      <td className="px-5 py-3.5 font-bold text-[#1F2937]">
                        {monthLabel}
                      </td>

                      {/* Quý */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F3F4F6] text-[#6B7280]">
                          {quarter}
                        </span>
                      </td>

                      {/* Ô nhập chỉ tiêu */}
                      <td className="px-5 py-3.5">
                        <div className="relative max-w-md">
                          <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            step="1000000"
                            value={targets[month] === 0 ? '' : targets[month]}
                            onChange={(e) => handleTargetChange(month, e.target.value)}
                            placeholder={`0 (${currencySuffix})`}
                            className="w-full pl-9 pr-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all"
                          />
                        </div>
                      </td>

                      {/* Tỷ trọng % */}
                      <td className="px-5 py-3.5 text-right font-semibold text-[#1F2937]">
                        {share}%
                      </td>

                      {/* Thanh phân bổ */}
                      <td className="px-5 py-3.5">
                        <div className="w-full h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                          <div
                            className="h-full bg-[#3CB371] rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, share)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Dòng Tổng cộng */}
            <tfoot className="bg-[#F3F4F6] border-t-2 border-[#DDF0E2] text-sm font-bold text-[#1F2937]">
              <tr>
                <td className="px-5 py-3.5 uppercase" colSpan={2}>
                  {language === 'en' ? `Total Plan Year ${fiscalYear}:` : `Tổng Kế Hoạch Năm ${fiscalYear}:`}
                </td>
                <td className="px-5 py-3.5 text-[#2E7D32] text-base font-extrabold">
                  {totalYearPlan.toLocaleString(locale)} {currencySuffix}
                </td>
                <td className="px-5 py-3.5 text-right font-extrabold text-[#2E7D32]">
                  {totalYearPlan > 0 ? '100%' : '0%'}
                </td>
                <td className="px-5 py-3.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Nút lưu cuối form */}
        <div className="p-4 bg-[#F3F4F6]/50 border-t border-[#DDF0E2] flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">
            {language === 'en'
              ? 'Data is secured with PostgreSQL ACID Transactions.'
              : 'Dữ liệu được lưu với giao dịch CSDL PostgreSQL an toàn (ACID Transaction).'}
          </span>

          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === 'en' ? 'Saving plan...' : 'Đang lưu kế hoạch...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('btnSavePlan', 'Lưu Kế Hoạch Năm')} {fiscalYear}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
