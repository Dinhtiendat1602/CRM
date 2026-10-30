import { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Common/Modal';
import campaignApi from '../../api/campaignApi';
import productApi from '../../api/productApi';
import {
  Package,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers,
} from 'lucide-react';

/**
 * Modal Gán Sản phẩm vào Chiến dịch Tiếp thị
 * Tuân thủ SRS v1.1 Mục 3.18.1 (Gán sản phẩm cho chiến dịch)
 */
export default function CampaignAssignProductsModal({ isOpen, onClose, campaign, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load danh sách sản phẩm và các sản phẩm đã được gán trước đó vào chiến dịch này
  useEffect(() => {
    if (isOpen && campaign?.id) {
      setFetching(true);
      setErrorMsg('');

      // Lấy toàn bộ sản phẩm
      productApi.getProducts({ limit: 100 })
        .then((res) => {
          const productList = res.data?.products || res.products || res.data || [];
          setProducts(productList);

          // Những sản phẩm hiện đang có campaign_id = campaign.id
          const currentAssigned = productList
            .filter((p) => p.campaign_id === campaign.id)
            .map((p) => p.id);

          setSelectedIds(currentAssigned);
        })
        .catch((err) => {
          setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách sản phẩm.');
        })
        .finally(() => {
          setFetching(false);
        });
    } else {
      setSelectedIds([]);
      setSearchQuery('');
      setErrorMsg('');
    }
  }, [isOpen, campaign]);

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.product_code && p.product_code.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const handleToggleProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredProducts.map((p) => p.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!campaign?.id) return;

    if (selectedIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm để gán vào chiến dịch.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await campaignApi.assignProducts(campaign.id, selectedIds);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể gán sản phẩm vào chiến dịch.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gán Sản Phẩm vào Chiến dịch Tiếp thị"
      subtitle={`Chiến dịch: ${campaign?.name || ''}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Thông báo lỗi */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Thanh tìm kiếm và Chọn tất cả */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên hoặc danh mục sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleSelectAllFiltered}
            disabled={filteredProducts.length === 0 || fetching}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#3CB371]" />
            <span>Chọn / Bỏ chọn lọc</span>
          </button>
        </div>

        {/* Thống kê đã chọn */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Đã chọn <strong className="text-[#3CB371] font-semibold">{selectedIds.length}</strong> sản phẩm mục tiêu
          </span>
          <span>Tổng số trong kho: {products.length}</span>
        </div>

        {/* Danh sách sản phẩm cuộn */}
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#3CB371]" />
              <span className="text-sm">Đang tải danh sách sản phẩm...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Package className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
              <p className="text-sm">Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const isAlreadyAssigned = p.campaign_id === campaign?.id;

              return (
                <div
                  key={p.id}
                  onClick={() => handleToggleProduct(p.id)}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#EAF5EC]/70 hover:bg-[#EAF5EC]' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-[#3CB371] focus:outline-none"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#3CB371] fill-[#EAF5EC]" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800">{p.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {p.product_code}
                        </span>
                        {isAlreadyAssigned && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã gán
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Danh mục: {p.category_name || 'Mặc định'}</span>
                        <span>•</span>
                        <span>Đơn giá: {Number(p.unit_price || 0).toLocaleString('vi-VN')} đ</span>
                        <span>•</span>
                        <span>Tồn kho: <strong className="text-slate-700">{p.stock_qty || 0}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Nút thao tác */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={loading || selectedIds.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Lưu gán ({selectedIds.length}) sản phẩm</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
