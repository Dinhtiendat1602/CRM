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
  CheckCircle2
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
        const smList = Array.isArray(salesmenRes)
          ? salesmenRes
          : (Array.isArray(salesmenRes?.salesmen)
              ? salesmenRes.salesmen
              : (Array.isArray(salesmenRes?.data) ? salesmenRes.data : []));
        setSalesmen(smList);

        const rawProds = productsRes?.products || productsRes?.data?.products || (Array.isArray(productsRes?.data) ? productsRes.data : productsRes);
        setAllProducts(Array.isArray(rawProds) ? rawProds : []);

        const rawCats = categoriesRes?.categories || categoriesRes?.data?.categories || (Array.isArray(categoriesRes?.data) ? categoriesRes.data : categoriesRes);
        setCategories(Array.isArray(rawCats) ? rawCats : []);

        // Mặc định chọn salesman đầu tiên nếu chưa chọn
        if (smList.length > 0) {
          setSelectedSalesmanId((prev) => prev || String(smList[0].id));
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
      const rawAssigned = res?.assigned_product_ids || res?.data?.assigned_product_ids || (Array.isArray(res?.data) ? res.data : []);
      const assigned = Array.isArray(rawAssigned) ? rawAssigned : [];
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

  const safeSalesmen = Array.isArray(salesmen) ? salesmen : [];
  const selectedSalesman = safeSalesmen.find((sm) => String(sm.id) === String(selectedSalesmanId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EAF5EC] border border-[#DDF0E2] flex items-center justify-center text-[#3CB371]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block font-bold text-slate-900 text-base sm:text-lg">
              Phân Quyền Bán Hàng Cho Nhân Viên
            </span>
          </div>
        </div>
      }
      subtitle="Chỉ định các sản phẩm mà nhân viên được phép bán khi tạo cơ hội bán hàng."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Thông báo lỗi & thành công */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-700 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Chọn nhân viên bán hàng */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Chọn Nhân viên Bán hàng:
          </label>
          <div className="flex flex-col sm:row sm:items-center gap-3">
            <div className="relative flex-1">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedSalesmanId}
                onChange={(e) => setSelectedSalesmanId(e.target.value)}
                disabled={loadingInitial || saving}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium shadow-2xs focus:outline-none focus:border-[#3CB371] focus:ring-1 focus:ring-[#3CB371]/20 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed cursor-pointer"
              >
                {safeSalesmen.length === 0 ? (
                  <option value="">Không có nhân viên bán hàng nào</option>
                ) : (
                  safeSalesmen.map((sm) => (
                    <option key={sm.id} value={sm.id}>
                      {sm.full_name} ({sm.username}) — Đang bán: {sm.assigned_products_count || 0} sản phẩm
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedSalesman && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#EAF5EC] text-[#2E7D32] rounded-lg text-xs font-semibold border border-[#DDF0E2] shadow-2xs self-start sm:self-auto flex-shrink-0">
                <span>Hiện được gán:</span>
                <span className="font-bold text-sm px-1.5 py-0.5 bg-white rounded-md text-[#2E7D32] border border-[#DDF0E2] shadow-2xs">
                  {selectedProductIds.size}
                </span>
                <span className="text-[#3CB371] font-normal">/ {allProducts.length} sản phẩm</span>
              </div>
            )}
          </div>
        </div>

        {/* Bộ lọc sản phẩm & thao tác nhanh */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:border-[#3CB371] focus:ring-1 focus:ring-[#3CB371]/20 transition-colors"
              />
            </div>

            <div className="relative w-44 flex-shrink-0">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 shadow-2xs focus:outline-none focus:border-[#3CB371] focus:ring-1 focus:ring-[#3CB371]/20 transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2E7D32] bg-[#EAF5EC] hover:bg-[#DDF0E2] border border-[#DDF0E2] rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#3CB371]" />
              <span>Chọn danh sách lọc</span>
            </button>
            <button
              type="button"
              onClick={handleDeselectAllFiltered}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Square className="w-3.5 h-3.5 text-slate-500" />
              <span>Bỏ chọn</span>
            </button>
          </div>
        </div>

        {/* Danh sách sản phẩm dạng bảng */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="max-h-80 overflow-y-auto">
            {loadingInitial || loadingAssignments ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#3CB371] mb-2" />
                <span className="text-sm font-medium">Đang tải danh sách sản phẩm...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm">
                <Package className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
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
                        className="rounded border-slate-300 text-[#3CB371] focus:ring-[#3CB371] w-4 h-4 cursor-pointer accent-[#3CB371]"
                      />
                    </th>
                    <th className="py-2.5 px-3">Mã sản phẩm</th>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-3">Danh mục</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center">Tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProducts.map((prod) => {
                    const isChecked = selectedProductIds.has(Number(prod.id));
                    return (
                      <tr
                        key={prod.id}
                        onClick={() => toggleProduct(prod.id)}
                        className={`cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-[#EAF5EC]/60 hover:bg-[#EAF5EC]'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProduct(prod.id)}
                            className="rounded border-slate-300 text-[#3CB371] focus:ring-[#3CB371] w-4 h-4 cursor-pointer accent-[#3CB371]"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                            {prod.product_code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{prod.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500">
                          {prod.category_name || (
                            <span className="text-slate-400 italic">Chưa phân loại</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs font-semibold text-slate-800">
                          {Number(prod.unit_price || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs text-slate-600 font-medium">
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
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Đã chọn <strong className="text-[#3CB371] font-semibold">{selectedProductIds.size}</strong> trên tổng số {allProducts.length} sản phẩm
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingInitial || loadingAssignments || !selectedSalesmanId}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
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
