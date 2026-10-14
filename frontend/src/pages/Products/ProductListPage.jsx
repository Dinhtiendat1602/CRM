import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import productApi from '../../api/productApi';
import { useAuth } from '../../context/authContextDef';
import Pagination from '../../components/Common/Pagination';
import SearchInput from '../../components/Common/SearchInput';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import ProductModal from './ProductModal';
import CategoryModal from './CategoryModal';
import { 
  Package, 
  Plus, 
  FolderTree, 
  Eye, 
  Edit3, 
  Trash2, 
  Layers, 
  DollarSign, 
  Flag, 
  AlertCircle,
  Tag
} from 'lucide-react';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'SALE_MANAGER';

  // State dữ liệu & phân trang (BR-03: limit=20)
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1,
  });

  // State bộ lọc
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    product: null,
    loading: false,
  });

  // Load danh mục sản phẩm phục vụ bộ lọc
  const fetchCategories = useCallback(async () => {
    try {
      const res = await productApi.getCategories();
      setCategories(res.data?.categories || res.categories || []);
    } catch {
      // Bỏ qua lỗi phụ
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await productApi.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search,
        category_id: categoryId || undefined,
        sortBy,
        sortOrder,
      });

      const data = res.data || res;
      setProducts(data.products || []);
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          page: data.pagination.currentPage || data.pagination.page,
          limit: data.pagination.limit,
          totalRecords: data.pagination.totalRecords,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryId, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleDeleteClick = (prod) => {
    setDeleteConfirm({
      isOpen: true,
      product: prod,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.product) return;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await productApi.deleteProduct(deleteConfirm.product.id);
      setDeleteConfirm({ isOpen: false, product: null, loading: false });
      fetchProducts();
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa sản phẩm.');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Phân hệ Kho & Sản phẩm (SRS 3.15 - 3.17)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Lý Danh Mục & Sản Phẩm Kho
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản trị mã sản phẩm, tồn kho kho hàng, xem cơ hội liên quan và lịch sử đơn hàng.
          </p>
        </div>

        {isManagerOrAdmin && (
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <FolderTree className="w-4 h-4 text-indigo-600" />
              <span>Quản Lý Danh Mục</span>
            </button>

            <button
              onClick={handleCreateProduct}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sản Phẩm</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Bar: Tìm kiếm, Lọc danh mục, Sắp xếp */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Ô tìm kiếm theo Tên hoặc Mã SP */}
          <div className="md:col-span-6">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Tìm theo mã sản phẩm hoặc tên sản phẩm..."
            />
          </div>

          {/* Bộ lọc Danh mục */}
          <div className="md:col-span-3">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Tất cả danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.products_count || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb);
                setSortOrder(so);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="created_at_DESC">Mới nhất trước</option>
              <option value="created_at_ASC">Cũ nhất trước</option>
              <option value="unit_price_ASC">Giá tăng dần</option>
              <option value="unit_price_DESC">Giá giảm dần</option>
              <option value="stock_qty_ASC">Tồn kho ít nhất</option>
              <option value="stock_qty_DESC">Tồn kho nhiều nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Product Table (BR-03: 20 bản ghi/trang) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Mã & Tên Sản Phẩm</th>
                <th className="py-3.5 px-4">Danh Mục</th>
                <th className="py-3.5 px-4">Đơn Giá</th>
                <th className="py-3.5 px-4">Tồn Kho</th>
                <th className="py-3.5 px-4">Chiến Dịch</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh mục sản phẩm kho...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-12 h-12 text-slate-300 stroke-[1.5] mb-2" />
                      <p className="font-medium text-slate-600">Không tìm thấy sản phẩm nào</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {search || categoryId
                          ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.'
                          : 'Bắt đầu bằng cách thêm mới một sản phẩm vào kho.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/products/${prod.id}`)}
                  >
                    {/* Mã & Tên sản phẩm */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                            {prod.name}
                          </span>
                          <span className="text-xs font-mono font-medium text-slate-400 inline-flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {prod.product_code}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Danh mục */}
                    <td className="py-3.5 px-4">
                      {prod.category_name ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                          <FolderTree className="w-3 h-3 text-slate-400" />
                          <span>{prod.category_name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa gán</span>
                      )}
                    </td>

                    {/* Đơn giá */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatCurrency(prod.unit_price)}
                    </td>

                    {/* Tồn kho */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            prod.stock_qty <= 5
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          <span>{prod.stock_qty}</span>
                        </span>
                        {prod.stock_qty <= 5 && (
                          <span className="text-[11px] text-rose-500 font-medium">Sắp hết</span>
                        )}
                      </div>
                    </td>

                    {/* Chiến dịch quảng bá */}
                    <td className="py-3.5 px-4 text-xs">
                      {prod.campaign_name ? (
                        <span className="inline-flex items-center gap-1 text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          <Flag className="w-3 h-3" />
                          <span>{prod.campaign_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/products/${prod.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Xem chi tiết, Cơ hội & Đơn hàng (SRS 3.16, 3.17)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isManagerOrAdmin && (
                          <>
                            <button
                              onClick={() => handleEditProduct(prod)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(prod)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang (BR-03: 20 bản ghi/trang) */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modal Thêm / Sửa Sản phẩm */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onSuccess={() => {
          fetchProducts();
          fetchCategories();
        }}
      />

      {/* Modal Quản lý Danh mục */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesUpdated={() => {
          fetchCategories();
          fetchProducts();
        }}
      />

      {/* Dialog xác nhận xóa */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Xác nhận xóa Sản phẩm Kho"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${deleteConfirm.product?.name}" (${deleteConfirm.product?.product_code})? Thao tác này sẽ bị chặn nếu sản phẩm đã phát sinh cơ hội hoặc đơn hàng.`}
        confirmText="Xác nhận xóa"
        confirmType="danger"
        loading={deleteConfirm.loading}
        onClose={() => setDeleteConfirm({ isOpen: false, product: null, loading: false })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
