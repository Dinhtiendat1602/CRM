import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable SearchInput Component (Debounced 300ms)
 * 
 * @param {Object} props
 * @param {string} [props.defaultValue=''] - Giá trị khởi tạo
 * @param {Function} props.onChange - Callback khi giá trị sau debounce thay đổi
 * @param {string} [props.placeholder='Tìm kiếm...'] - Placeholder hiển thị
 */
export default function SearchInput({
  defaultValue = '',
  onChange,
  placeholder = 'Tìm kiếm từ khóa...',
}) {
  const [text, setText] = useState(defaultValue);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Không trigger lần đầu tiên mount nếu text rỗng
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      if (onChange) onChange(text);
    }, 300);

    return () => clearTimeout(handler);
  }, [text, onChange]);

  const handleClear = () => {
    setText('');
    if (onChange) onChange('');
  };

  return (
    <div className="relative rounded-xl shadow-2xs max-w-sm w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
      />
      {text && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Xóa tìm kiếm"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
