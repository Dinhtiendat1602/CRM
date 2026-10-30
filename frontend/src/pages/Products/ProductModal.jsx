import { useState, useEffect } from 'react';
import Modal from '../../components/Common/Modal';
import productApi from '../../api/productApi';
import axiosClient from '../../api/axiosClient';
import { 
  Package, 
  Tag, 
  DollarSign, 
  Layers, 
  FolderTree, 
  Flag, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

const INITIAL_FORM = {
  product_code: '',
  name: '',
  description: '',
  category_id: '',
  unit_price: '',
  stock_qty: 0,
  campaign_id: '',
};

export default function ProductModal({ isOpen, onClose, product, onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isEdit = Boolean(product?.id);

  // Load danh sách danh mục & chiến dịch khi mở modal
  useEffect(() => {
    if (isOpen) {
      // Load categories
      productApi.getCategories()
        .then((res) => setCategories(res.data?.categories || res.categories || []))
        .catch(() => {});

      // Load campaigns (nếu có API hoặc fallback rỗng)
      axiosClient.get('/campaigns')
        .then((res) => setCampaigns(res.data?.campaigns || res.campaigns || []))
        .catch(() => setCampaigns([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setFormData({
        product_code: product.product_code || '',
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id || '',
        unit_price: product.unit_price !== undefined ? product.unit_price : '',
        stock_qty: product.stock_qty !== undefined ? product.stock_qty : 0,
        campaign_id: product.campaign_id || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setErrorMsg('');
    setFieldErrors({});
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'product_code' ? value.toUpperCase() : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.product_code.trim()) errors.product_code = 'Mã sản phẩm là bắt buộc';
    if (!formData.name.trim()) errors.name = 'Tên sản phẩm là bắt buộc';
    if (formData.unit_price === '' || isNaN(formData.unit_price) || Number(formData.unit_price) < 0) {
      errors.unit_price = 'Đơn giá phải là số không âm';
    }
    if (formData.stock_qty === '' || isNaN(formData.stock_qty) || Number(formData.stock_qty) < 0) {
      errors.stock_qty = 'Số lượng tồn kho phải là số nguyên không âm';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        product_code: formData.product_code.trim(),
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        unit_price: Number(formData.unit_price),
        stock_qty: parseInt(formData.stock_qty, 10) || 0,
        campaign_id: formData.campaign_id ? Number(formData.campaign_id) : null,
      };

      if (isEdit) {
        await productApi.updateProduct(product.id, payload);
      } else {
        await productApi.createProduct(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 409) {
        setErrorMsg(data?.message || 'Mã sản phẩm đã tồn tại trên hệ thống.');
      } else {
        setErrorMsg(data?.message || 'Có lỗi xảy ra khi lưu sản phẩm. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh Sửa Sản Phẩm Kho' : 'Thêm Mới Sản Phẩm Kho'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner báo lỗi */}
        {errorMsg && (
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block">Thông báo lỗi:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Mã sản phẩm & Tên sản phẩm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã Sản Phẩm <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="product_code"
                value={formData.product_code}
                onChange={handleChange}
                placeholder="VD: PROD_CRM_01"
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.product_code
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#3CB371] focus:ring-[#3CB371]/20'
                }`}
              />
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
            {fieldErrors.product_code && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.product_code}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên Sản Phẩm <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Zen CRM Enterprise"
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#3CB371] focus:ring-[#3CB371]/20'
                }`}
              />
              <Package className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.name}</p>
            )}
          </div>
        </div>

        {/* Danh mục & Chiến dịch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Danh Mục Sản Phẩm
            </label>
            <div className="relative">
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all"
              >
                <option value="">-- Chưa chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FolderTree className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Chiến Dịch Quảng Bá (SRS 3.18)
            </label>
            <div className="relative">
              <select
                name="campaign_id"
                value={formData.campaign_id}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all"
              >
                <option value="">-- Không gắn chiến dịch --</option>
                {campaigns.map((cmp) => (
                  <option key={cmp.id} value={cmp.id}>
                    {cmp.name}
                  </option>
                ))}
              </select>
              <Flag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Đơn giá & Tồn kho */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Đơn Giá Bán ($) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                placeholder="1500.00"
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.unit_price
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#3CB371] focus:ring-[#3CB371]/20'
                }`}
              />
              <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
            {fieldErrors.unit_price && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.unit_price}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Số Lượng Tồn Kho (Stock Qty)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                name="stock_qty"
                value={formData.stock_qty}
                onChange={handleChange}
                placeholder="100"
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.stock_qty
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#3CB371] focus:ring-[#3CB371]/20'
                }`}
              />
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
            {fieldErrors.stock_qty && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.stock_qty}</p>
            )}
          </div>
        </div>

        {/* Mô tả sản phẩm */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Mô Tả Sản Phẩm / Tính Năng Nổi Bật
          </label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả thông số kỹ thuật, phiên bản, bảo hành..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all resize-none"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEdit ? 'Cập Nhật Sản Phẩm' : 'Lưu Sản Phẩm'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
