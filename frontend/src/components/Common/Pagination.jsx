import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Component Phân trang chuẩn 20 bản ghi/trang theo SRS 3.2.3 REQ-1 & BR-03
 * Hỗ trợ giao diện song ngữ Tiếng Việt & Tiếng Anh
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
}) {
  const { t, language } = useLanguage();

  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Tạo danh sách các số trang hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = maxVisible;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1;
        end = totalPages;
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[#DDF0E2] text-xs text-[#6B7280] rounded-b-2xl">
      <div>
        {language === 'en' ? (
          <>
            Showing <span className="font-semibold text-[#1F2937]">{startItem}</span> -{' '}
            <span className="font-semibold text-[#1F2937]">{endItem}</span> of{' '}
            <span className="font-semibold text-[#1F2937]">{totalItems}</span> records (20 records/page)
          </>
        ) : (
          <>
            Hiển thị <span className="font-semibold text-[#1F2937]">{startItem}</span> -{' '}
            <span className="font-semibold text-[#1F2937]">{endItem}</span> trong tổng số{' '}
            <span className="font-semibold text-[#1F2937]">{totalItems}</span> bản ghi (20 bản ghi/trang)
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Nút Trang trước */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-[#DDF0E2] text-[#6B7280] hover:bg-[#EAF5EC] hover:text-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label={t('previousPage', 'Trang trước')}
          title={t('previousPage', 'Trang trước')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Các số trang */}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              p === currentPage
                ? 'bg-[#3CB371] text-white shadow-xs font-bold'
                : 'border border-[#DDF0E2] text-[#6B7280] hover:bg-[#EAF5EC] hover:text-[#1F2937]'
            }`}
          >
            {p}
          </button>
        ))}

        {/* Nút Trang sau */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-[#DDF0E2] text-[#6B7280] hover:bg-[#EAF5EC] hover:text-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label={t('nextPage', 'Trang sau')}
          title={t('nextPage', 'Trang sau')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
