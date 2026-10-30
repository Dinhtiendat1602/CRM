import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal Dialog Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Trạng thái hiển thị modal
 * @param {Function} props.onClose - Callback khi đóng modal
 * @param {string} props.title - Tiêu đề hộp thoại
 * @param {string} [props.subtitle] - Phụ đề giải thích
 * @param {React.ReactNode} props.children - Nội dung bên trong form
 * @param {string} [props.maxWidth='max-w-lg'] - Kích thước chiều rộng
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-[#DDF0E2] w-full ${maxWidth} overflow-hidden transform transition-all my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DDF0E2] flex items-center justify-between bg-[#EAF5EC]/70">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">{title}</h3>
            {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#DDF0E2]/60 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
