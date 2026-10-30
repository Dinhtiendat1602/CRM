import { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/Common/Modal';
import productApi from '../../api/productApi';
import { 
  FolderTree, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  X 
} from 'lucide-react';

export default function CategoryModal({ isOpen, onClose, onCategoriesUpdated }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State thêm / sửa danh mục
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await productApi.getCategories();
      setCategories(res.data?.categories || res.categories || []);
    } catch {
      setErrorMsg('Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setName('');
      setDescription('');
      setEditingId(null);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, fetchCategories]);

  const handleEditClick = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Tên danh mục là bắt buộc.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (editingId) {
        await productApi.updateCategory(editingId, { name, description });
        setSuccessMsg('Cập nhật danh mục thành công!');
      } else {
        await productApi.createCategory({ name, description });
        setSuccessMsg('Thêm danh mục mới thành công!');
      }
      setName('');
      setDescription('');
      setEditingId(null);
      await fetchCategories();
      onCategoriesUpdated?.();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (cat.products_count > 0) {
      setErrorMsg(`Không thể xóa danh mục "${cat.name}" vì đang có ${cat.products_count} sản phẩm.`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${cat.name}"?`)) return;

    try {
      await productApi.deleteCategory(cat.id);
      setSuccessMsg('Đã xóa danh mục thành công.');
      await fetchCategories();
      onCategoriesUpdated?.();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể xóa danh mục.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản Lý Danh Mục Sản Phẩm (Product Categories)"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Alerts */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form thêm / sửa danh mục */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-[#3CB371]" />
              <span>{editingId ? 'Chỉnh Sửa Danh Mục' : 'Thêm Mới Danh Mục'}</span>
            </span>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy sửa</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên danh mục <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Phần mềm Quản trị"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#3CB371] focus:ring-1 focus:ring-[#3CB371]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mô tả (tùy chọn)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Nhóm giải pháp phần mềm doanh nghiệp"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#3CB371] focus:ring-1 focus:ring-[#3CB371]/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3CB371] hover:bg-[#38A169] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : editingId ? (
                <Edit2 className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{editingId ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục'}</span>
            </button>
          </div>
        </form>

        {/* Danh sách danh mục hiện có */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Danh Sách Hiện Có ({categories.length})
          </span>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-[#3CB371]" />
                <span>Đang tải danh mục...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có danh mục nào. Hãy tạo danh mục đầu tiên ở trên.
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EAF5EC] text-[#2E7D32] rounded-full text-[11px] font-medium border border-[#DDF0E2]">
                        <Package className="w-3 h-3" />
                        <span>{cat.products_count || 0} sản phẩm</span>
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-slate-500 text-[11px]">{cat.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditClick(cat)}
                      className="p-1.5 text-slate-400 hover:text-[#3CB371] hover:bg-[#EAF5EC] rounded-lg transition-colors"
                      title="Sửa danh mục"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
