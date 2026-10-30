import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Reusable ConfirmDialog Component
 * Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDangerous = false,
  loading = false,
}) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const finalTitle = title || t('confirmActionTitle', 'Xác nhận thao tác');
  const finalConfirmText = confirmText || t('confirmActionBtn', 'Xác nhận');
  const finalCancelText = cancelText || t('cancelActionBtn', 'Hủy bỏ');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={finalTitle} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDangerous ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-sm text-[#1F2937] leading-relaxed pt-1">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DDF0E2]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[#DDF0E2] text-[#6B7280] text-xs font-semibold hover:bg-[#EAF5EC] hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            {finalCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                : 'bg-[#3CB371] hover:bg-[#38A169] shadow-[#3CB371]/20'
            }`}
          >
            {loading ? t('processing', 'Đang xử lý...') : finalConfirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
