import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Component Phân trang chuẩn 20 bản ghi/trang theo SRS 3.2.3 REQ-1 & BR-03
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Trang hiện tại (1-indexed)
 * @param {number} props.totalPages - Tổng số trang
 * @param {number} props.totalItems - Tổng số bản ghi
 * @param {number} [props.pageSize=20] - Số bản ghi mỗi trang
 * @param {Function} props.onPageChange - Callback khi chuyển trang (newPage)
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
}) {
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600 rounded-b-2xl">
      <div>
        Hiển thị <span className="font-semibold text-slate-900">{startItem}</span> -{' '}
        <span className="font-semibold text-slate-900">{endItem}</span> trong tổng số{' '}
        <span className="font-semibold text-slate-900">{totalItems}</span> bản ghi (20 bản ghi/trang)
      </div>

      <div className="flex items-center gap-1.5">
        {/* Nút Trang trước */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Trang trước"
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
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
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
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
