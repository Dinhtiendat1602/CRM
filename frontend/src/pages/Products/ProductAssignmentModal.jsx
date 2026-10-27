import { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../../components/Common/Modal';
import productApi from '../../api/productApi';
import {
  ShieldCheck,
  User,
  Package,
  Search,
  Filter,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag
} from 'lucide-react';

export default function ProductAssignmentModal({ isOpen, onClose, onSuccess }) {
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  
  // Loading & Error states
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bộ lọc trong modal
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // 1. Tải danh sách salesman, sản phẩm và danh mục khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    setSuccessMsg('');
    setLoadingInitial(true);

    Promise.all([
      productApi.getSalesmenList(),
      productApi.getProducts({ limit: 200, sortBy: 'name', sortOrder: 'ASC' }),
      productApi.getCategories()
    ])
      .then(([salesmenRes, productsRes, categoriesRes]) => {
        const smList = salesmenRes.data || salesmenRes || [];
        setSalesmen(smList);

        const prodList = productsRes.data?.products || productsRes.products || [];
        setAllProducts(prodList);

        const catList = categoriesRes.data?.categories || categoriesRes.categories || [];
        setCategories(catList);

        // Mặc định chọn salesman đầu tiên nếu chưa chọn
        if (smList.length > 0 && !selectedSalesmanId) {
          setSelectedSalesmanId(String(smList[0].id));
        }
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || 'Không thể tải dữ liệu phân quyền.');
      })
      .finally(() => {
        setLoadingInitial(false);
      });
  }, [isOpen]);

  // 2. Tải danh sách sản phẩm được gán khi thay đổi salesman
  const loadSalesmanAssignments = useCallback(async (userId) => {
    if (!userId) {
      setSelectedProductIds(new Set());
      return;
    }
    setLoadingAssignments(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await productApi.getSalesmanAssignments(userId);
      const assigned = res.data?.assigned_product_ids || res.assigned_product_ids || [];
      setSelectedProductIds(new Set(assigned.map((id) => Number(id))));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể tải sản phẩm phân quyền của nhân viên.');
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSalesmanId && isOpen) {
      loadSalesmanAssignments(selectedSalesmanId);
    }
  }, [selectedSalesmanId, isOpen, loadSalesmanAssignments]);

  // Toggle chọn 1 sản phẩm
  const toggleProduct = (productId) => {
    const pId = Number(productId);
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(pId)) {
        next.delete(pId);
      } else {
        next.add(pId);
      }
      return next;
    });
  };

  // Lọc sản phẩm theo tìm kiếm và danh mục
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchSearch =
        !searchTerm.trim() ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        !filterCategory || String(p.category_id) === String(filterCategory);
      return matchSearch && matchCat;
    });
  }, [allProducts, searchTerm, filterCategory]);

  // Chọn tất cả sản phẩm đang hiển thị trong bộ lọc
  const handleSelectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.add(Number(p.id)));
      return next;
    });
  };

  // Bỏ chọn tất cả sản phẩm đang hiển thị trong bộ lọc
  const handleDeselectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.delete(Number(p.id)));
      return next;
    });
  };

  // 3. Lưu phân quyền
  const handleSave = async () => {
    if (!selectedSalesmanId) {
      setErrorMsg('Vui lòng chọn nhân viên bán hàng.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const productIds = Array.from(selectedProductIds);
      const res = await productApi.updateSalesmanAssignments(selectedSalesmanId, productIds);
      setSuccessMsg(res.data?.message || res.message || 'Cập nhật phân quyền sản phẩm thành công!');

      // Cập nhật lại số lượng sản phẩm của salesman trong state
      setSalesmen((prev) =>
        prev.map((sm) =>
          sm.id === Number(selectedSalesmanId)
            ? { ...sm, assigned_products_count: productIds.length }
            : sm
        )
      );

      if (onSuccess) {
        onSuccess({ salesmanId: selectedSalesmanId, assignedCount: productIds.length });
      }

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu phân quyền.');
    } finally {
      setSaving(false);
    }
  };

  const selectedSalesman = salesmen.find((sm) => String(sm.id) === String(selectedSalesmanId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400">
          <ShieldCheck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <span>Phân Quyền Bán Hàng Cho Nhân Viên</span>
        </div>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Hướng dẫn */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chỉ định các sản phẩm mà nhân viên được phép bán. Khi tạo cơ hội bán hàng, nhân viên chỉ xem và lựa chọn được những sản phẩm đã được phân quyền này.
        </p>

        {/* Thông báo lỗi & thành công */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Chọn nhân viên bán hàng */}
        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Chọn Nhân viên Bán hàng:
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedSalesmanId}
                onChange={(e) => setSelectedSalesmanId(e.target.value)}
                disabled={loadingInitial || saving}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-gray-100"
              >
                {salesmen.length === 0 ? (
                  <option value="">Không có nhân viên bán hàng nào</option>
                ) : (
                  salesmen.map((sm) => (
                    <option key={sm.id} value={sm.id}>
                      {sm.full_name} ({sm.username}) — Đang bán: {sm.assigned_products_count || 0} sản phẩm
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedSalesman && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-medium border border-primary-200 dark:border-primary-800 self-start sm:self-auto">
                <span>Hiện được gán:</span>
                <span className="font-bold text-sm">{selectedProductIds.size}</span>
                <span>/ {allProducts.length} sản phẩm</span>
              </div>
            )}
          </div>
        </div>

        {/* Bộ lọc sản phẩm & thao tác nhanh */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-gray-100"
              />
            </div>

            <div className="relative w-44">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-gray-100"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Chọn danh sách lọc</span>
            </button>
            <button
              type="button"
              onClick={handleDeselectAllFiltered}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Bỏ chọn</span>
            </button>
          </div>
        </div>

        {/* Danh sách sản phẩm dạng bảng có checkbox */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {loadingInitial || loadingAssignments ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
                <span className="text-sm">Đang tải danh sách sản phẩm...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredProducts.length > 0 &&
                          filteredProducts.every((p) => selectedProductIds.has(Number(p.id)))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAllFiltered();
                          } else {
                            handleDeselectAllFiltered();
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Mã sản phẩm</th>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-3">Danh mục</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center">Tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {filteredProducts.map((prod) => {
                    const isChecked = selectedProductIds.has(Number(prod.id));
                    return (
                      <tr
                        key={prod.id}
                        onClick={() => toggleProduct(prod.id)}
                        className={`cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-primary-50/50 dark:bg-primary-950/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProduct(prod.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {prod.product_code}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{prod.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 dark:text-gray-400">
                          {prod.category_name || (
                            <span className="text-gray-400 italic">Chưa phân loại</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {Number(prod.unit_price || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs text-gray-600 dark:text-gray-400">
                          {prod.stock_qty || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Đã chọn <strong className="text-primary-600 dark:text-primary-400">{selectedProductIds.size}</strong> trên tổng số {allProducts.length} sản phẩm
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingInitial || loadingAssignments || !selectedSalesmanId}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lưu Phân Quyền</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
