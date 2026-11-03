import { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Common/Modal';
import leadApi from '../../api/leadApi';
import productApi from '../../api/productApi';
import oppApi from '../../api/oppApi';
import { 
  fetchVietnamProvinces, 
  fetchDistrictsByProvince, 
  fetchWardsByDistrict 
} from '../../utils/vietnamLocationApi';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  Loader2,
  Target,
  Package
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Tách địa chỉ hoàn chỉnh thành 4 cấp: Số nhà/đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành
 */
function parseAddress(addr) {
  if (!addr) return { street_address: '', ward: '', district: '', city: '' };
  const parts = String(addr).split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 4) {
    return {
      city: parts[parts.length - 1],
      district: parts[parts.length - 2],
      ward: parts[parts.length - 3],
      street_address: parts.slice(0, parts.length - 3).join(', '),
    };
  }
  if (parts.length === 3) {
    return {
      city: parts[2],
      district: parts[1],
      ward: '',
      street_address: parts[0],
    };
  }
  if (parts.length === 2) {
    return {
      city: parts[1],
      district: '',
      ward: '',
      street_address: parts[0],
    };
  }
  return {
    city: '',
    district: '',
    ward: '',
    street_address: addr,
  };
}

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  title: '',
  company: '',
  source: 'Website',
  date_of_birth: '',
  city: '',
  district: '',
  ward: '',
  street_address: '',
  notes: '',
};

export default function LeadModal({ isOpen, onClose, lead, onSuccess }) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState({ email: null, phone: null });

  // State Nút Flick: Tự động thêm vào cơ hội bán hàng
  const [autoCreateOpp, setAutoCreateOpp] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [autoOpp, setAutoOpp] = useState({
    product_id: '',
    quantity: 1,
    expected_close_date: '',
    notes: '',
  });

  const isEdit = Boolean(lead?.id);

  // State API Quốc gia Việt Nam cho Tỉnh/Thành phố, Quận/Huyện & Phường/Xã
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);

  // Tải danh sách 63 Tỉnh/Thành phố từ API Quốc gia Việt Nam khi mở modal
  useEffect(() => {
    if (isOpen) {
      setLoadingProvinces(true);
      fetchVietnamProvinces()
        .then((list) => {
          setProvinces(list || []);
        })
        .finally(() => {
          setLoadingProvinces(false);
        });
    }
  }, [isOpen]);

  // Tải danh sách Quận/Huyện khi Tỉnh/Thành phố thay đổi
  useEffect(() => {
    if (formData.city && formData.city.trim()) {
      setLoadingDistricts(true);
      fetchDistrictsByProvince(formData.city)
        .then((list) => {
          setDistricts(list || []);
        })
        .catch(() => setDistricts([]))
        .finally(() => setLoadingDistricts(false));
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [formData.city]);

  // Tải danh sách Phường/Xã khi Quận/Huyện thay đổi
  useEffect(() => {
    if (formData.district && formData.district.trim()) {
      setLoadingWards(true);
      fetchWardsByDistrict(formData.district, districts, formData.city)
        .then((list) => {
          setWards(list || []);
        })
        .catch(() => setWards([]))
        .finally(() => setLoadingWards(false));
    } else {
      setWards([]);
    }
  }, [formData.district, districts, formData.city]);

  // Nạp danh sách sản phẩm khi mở modal thêm mới
  useEffect(() => {
    if (isOpen && !isEdit) {
      setLoadingProducts(true);
      productApi.getProducts({ limit: 100, sortBy: 'name', sortOrder: 'ASC' })
        .then((res) => {
          const raw = res?.products || res?.data?.products || (Array.isArray(res?.data) ? res.data : []);
          const list = Array.isArray(raw) ? raw : [];
          setProducts(list);
          if (list.length > 0) {
            setAutoOpp((prev) => ({
              ...prev,
              product_id: prev.product_id || String(list[0].id),
            }));
          }
        })
        .catch((err) => {
          console.error('Không thể nạp danh sách sản phẩm:', err);
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    }
  }, [isOpen, isEdit]);

  useEffect(() => {
    if (lead) {
      const parsed = parseAddress(lead.address);
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        title: lead.title || lead.career || '',
        company: lead.company || '',
        source: lead.source || 'Website',
        date_of_birth: lead.date_of_birth ? lead.date_of_birth.split('T')[0] : '',
        city: lead.city || parsed.city || '',
        district: lead.district || parsed.district || '',
        ward: lead.ward || parsed.ward || '',
        street_address: lead.street_address || parsed.street_address || '',
        notes: lead.notes || '',
      });
      setAutoCreateOpp(false);
    } else {
      setFormData(INITIAL_FORM);
      setAutoCreateOpp(false);
      setAutoOpp({
        product_id: products.length > 0 ? String(products[0].id) : '',
        quantity: 1,
        expected_close_date: '',
        notes: '',
      });
    }
    setErrorMsg('');
    setFieldErrors({});
    setDuplicateWarning({ email: null, phone: null });
  }, [lead, isOpen, products]);

  // Sản phẩm đang chọn trong cơ hội tự động
  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(autoOpp.product_id));
  }, [products, autoOpp.product_id]);

  // Kiểm tra trùng lặp realtime khi người dùng rời khỏi ô input (onBlur)
  const handleCheckDuplicate = async (field, value) => {
    if (!value || !value.trim() || isEdit) return; // Nếu edit thì backend sẽ kiểm tra khi submit
    try {
      const res = await leadApi.checkDuplicate({ [field]: value.trim() });
      const data = res.data || res;
      if (data?.isDuplicate) {
        setDuplicateWarning((prev) => ({
          ...prev,
          [field]: `${field === 'email' ? 'Địa chỉ Email' : 'Số điện thoại'} này đã tồn tại trong hệ thống!`,
        }));
      } else {
        setDuplicateWarning((prev) => ({ ...prev, [field]: null }));
      }
    } catch {
      // Bỏ qua lỗi mạng khi check realtime
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city') {
      setFormData((prev) => ({
        ...prev,
        city: value,
        district: prev.city === value ? prev.district : '',
        ward: prev.city === value ? prev.ward : '',
      }));
    } else if (name === 'district') {
      setFormData((prev) => ({
        ...prev,
        district: value,
        ward: prev.district === value ? prev.ward : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (duplicateWarning[name]) {
      setDuplicateWarning((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.first_name.trim()) errors.first_name = 'Vui lòng nhập Tên (First Name)';
    if (!formData.last_name.trim()) errors.last_name = 'Vui lòng nhập Họ & Đệm (Last Name)';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập Email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Email không đúng định dạng';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập Số điện thoại';
    } else if (!/^[0-9+().\-\s]{7,20}$/.test(formData.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (từ 7 - 20 ký tự số)';
    }

    // Validate thông tin cơ hội nếu bật Nút Flick
    if (!isEdit && autoCreateOpp) {
      if (!autoOpp.product_id) {
        errors.product_id = 'Vui lòng chọn sản phẩm quan tâm để tạo cơ hội.';
      }
      const qty = parseInt(autoOpp.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        errors.quantity = 'Số lượng sản phẩm phải lớn hơn 0.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) return;

    // Chuẩn hóa payload gửi lên API sạch sẽ
    const fullAddress = [
      formData.street_address,
      formData.ward,
      formData.district,
      formData.city,
    ]
      .filter(Boolean)
      .map((s) => s.trim())
      .join(', ') || null;

    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      career: formData.title?.trim() || null,
      company: formData.company?.trim() || null,
      source: formData.source || 'Website',
      date_of_birth: formData.date_of_birth ? formData.date_of_birth : null,
      address: fullAddress,
      notes: formData.notes?.trim() || null,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await leadApi.updateLead(lead.id, payload);
        onSuccess?.({ isEdit: true });
      } else {
        const leadRes = await leadApi.createLead(payload);
        const createdLead = leadRes.data || leadRes;
        const newLeadId = createdLead?.id;

        let oppCreated = false;
        if (autoCreateOpp && newLeadId) {
          try {
            await oppApi.createOpportunity({
              lead_id: newLeadId,
              product_id: parseInt(autoOpp.product_id, 10),
              quantity: parseInt(autoOpp.quantity, 10) || 1,
              expected_close_date: autoOpp.expected_close_date || null,
              status: 'NEW',
              notes: autoOpp.notes?.trim() || `Tự động tạo cơ hội khi thêm khách hàng ${payload.last_name} ${payload.first_name}`,
            });
            oppCreated = true;
          } catch (oppErr) {
            console.warn('Lỗi khi tự động tạo cơ hội bán hàng:', oppErr);
          }
        }
        onSuccess?.({ isEdit: false, autoCreatedOpp: oppCreated, leadId: newLeadId });
      }
      onClose();
    } catch (err) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        err?.error ||
        (typeof err === 'string' ? err : 'Có lỗi xảy ra khi lưu thông tin. Vui lòng kiểm tra lại.');
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? (language === 'en' ? 'Update Lead Information' : 'Chỉnh Sửa Khách Hàng Tiềm Năng')
          : (language === 'en' ? 'Add New Lead' : 'Thêm Mới Khách Hàng Tiềm Năng')
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner báo lỗi tổng / Lỗi trùng lặp (BR-02, SRS 3.1.2 REQ-4) */}
        {errorMsg && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block">Phát hiện lỗi / Trùng lặp dữ liệu:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Thông tin bắt buộc: Họ & Tên */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Họ & Tên Đệm (Last Name) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.last_name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#3CB371] focus:ring-[#3CB371]/20'
                }`}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            {fieldErrors.last_name && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.last_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên (First Name) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="An"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.first_name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#3CB371] focus:ring-[#3CB371]/20'
                }`}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            {fieldErrors.first_name && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.first_name}</p>
            )}
          </div>
        </div>

        {/* Thông tin liên hệ: Email & Điện thoại (Chống trùng lặp BR-02) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleCheckDuplicate('email', formData.email)}
                placeholder="khachhang@example.com"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.email || duplicateWarning.email
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#3CB371] focus:ring-[#3CB371]/20'
                }`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.email}</p>
            )}
            {duplicateWarning.email && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {duplicateWarning.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Số Điện Thoại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleCheckDuplicate('phone', formData.phone)}
                placeholder="0912345678"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.phone || duplicateWarning.phone
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-[#3CB371] focus:ring-[#3CB371]/20'
                }`}
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            {fieldErrors.phone && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.phone}</p>
            )}
            {duplicateWarning.phone && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {duplicateWarning.phone}
              </p>
            )}
          </div>
        </div>

        {/* Nghề nghiệp / Chức danh & Công ty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Chức danh / Nghề nghiệp (Title / Occupation)
            </label>
            <div className="relative">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Giám đốc kinh doanh / Bác sĩ / Kỹ sư..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all"
              />
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Công ty / Tổ chức (Company)
            </label>
            <div className="relative">
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Công ty TNHH Giải Pháp Toàn Cầu"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all"
              />
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Nguồn khách hàng & Ngày sinh */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nguồn Khách Hàng (Lead Source)
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all"
            >
              <option value="Website">Website Công ty</option>
              <option value="Facebook Ads">Quảng cáo Facebook</option>
              <option value="Google Ads">Quảng cáo Google</option>
              <option value="Referral">Người quen giới thiệu</option>
              <option value="Exhibition">Triển lãm / Hội thảo</option>
              <option value="Cold Call">Cold Calling</option>
              <option value="Email Marketing">Email Marketing</option>
              <option value="Other">Nguồn khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ngày Sinh (Date of Birth)
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Địa chỉ hành chính Việt Nam & Địa chỉ cụ thể */}
        <div className="space-y-3.5 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#3CB371]" />
              Địa chỉ liên hệ (API Quốc gia Việt Nam)
            </span>
            {loadingProvinces ? (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-[#3CB371]" />
                Đang nạp 63 Tỉnh VN...
              </span>
            ) : (
              <span className="text-[10px] font-medium text-[#2E7D32] bg-[#EAF5EC] px-2 py-0.5 rounded-md border border-[#DDF0E2]">
                ✓ API 63 Tỉnh Thành VN
              </span>
            )}
          </div>

          {/* Hàng 1: Các Tỉnh -> Các Huyện -> Các Xã (Tự có sẵn 100% không lo rớt mạng) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. TỈNH / THÀNH PHỐ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tỉnh / Thành Phố
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all text-slate-800 cursor-pointer"
              >
                <option value="">-- Chọn Tỉnh / Thành phố ({provinces.length}) --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.short_name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. QUẬN / HUYỆN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Quận / Huyện
                </label>
                {districts.length > 0 && (
                  <span className="text-[10px] font-medium text-[#2E7D32]">
                    {districts.length} quận/huyện
                  </span>
                )}
              </div>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.city || districts.length === 0}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
              >
                <option value="">
                  {!formData.city 
                    ? '-- Chọn Tỉnh/Thành trước --' 
                    : `-- Chọn Quận / Huyện (${districts.length}) --`}
                </option>
                {districts.map((d) => (
                  <option key={d.code} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. PHƯỜNG / XÃ (Ô CÁC XÃ) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Phường / Xã
                </label>
                {wards.length > 0 && (
                  <span className="text-[10px] font-medium text-[#2E7D32]">
                    {wards.length} xã/phường
                  </span>
                )}
              </div>
              <select
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                disabled={!formData.district || wards.length === 0}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
              >
                <option value="">
                  {!formData.district 
                    ? '-- Chọn Quận/Huyện trước --' 
                    : `-- Chọn Phường / Xã (${wards.length}) --`}
                </option>
                {wards.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 2: Địa chỉ cụ thể (Số nhà, tên đường...) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ cụ thể (Số nhà, ngõ ngách, tên đường, tòa nhà)
            </label>
            <div className="relative">
              <input
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleChange}
                placeholder="123 Nguyễn Trãi, Tòa nhà Bitexco / Tầng 5..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all placeholder:text-slate-400"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Xem trước địa chỉ chuẩn hóa hoàn chỉnh */}
          {(formData.street_address || formData.ward || formData.district || formData.city) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#EAF5EC] border border-[#DDF0E2] rounded-xl text-xs text-[#2E7D32]">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#3CB371]" />
              <span className="font-medium truncate">
                Địa chỉ hoàn chỉnh:{' '}
                <span className="font-semibold text-slate-800">
                  {[formData.street_address, formData.ward, formData.district, formData.city].filter(Boolean).join(', ')}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Ghi Chú Nhu Cầu / Quan Tâm (Notes)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Khách hàng quan tâm đến phần mềm ERP/CRM, cần tư vấn gói Enterprise..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all resize-none"
          />
        </div>

        {/* Nút Flick Toggle: Tự động thêm vào cơ hội bán hàng (Opportunity) */}
        {!isEdit && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 transition-all space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    autoCreateOpp
                      ? 'bg-[#3CB371] text-white shadow-xs'
                      : 'bg-slate-200/80 text-slate-500'
                  }`}
                >
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      Tự động thêm vào cơ hội bán hàng
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5EC] text-[#2E7D32] border border-[#DDF0E2]">
                      Flick chọn
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bật nút gạt này để tự động tạo ngay cơ hội kinh doanh ngay khi lưu thông tin khách hàng.
                  </p>
                </div>
              </div>

              {/* Nút Flick (Toggle Switch) */}
              <button
                type="button"
                role="switch"
                aria-checked={autoCreateOpp}
                onClick={() => setAutoCreateOpp((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3CB371]/20 ${
                  autoCreateOpp ? 'bg-[#3CB371]' : 'bg-slate-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoCreateOpp ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Khi Flick Switch bật ON -> Mở rộng form chọn sản phẩm */}
            {autoCreateOpp && (
              <div className="pt-3 border-t border-[#DDF0E2] space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
                      Sản phẩm quan tâm <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Package className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3 pointer-events-none" />
                      <select
                        value={autoOpp.product_id}
                        onChange={(e) => {
                          setAutoOpp((prev) => ({ ...prev, product_id: e.target.value }));
                          if (fieldErrors.product_id) {
                            setFieldErrors((prev) => ({ ...prev, product_id: '' }));
                          }
                        }}
                        disabled={loadingProducts}
                        className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                          fieldErrors.product_id
                            ? 'border-rose-400 focus:ring-rose-200 text-slate-800'
                            : 'border-[#DDF0E2] focus:border-[#3CB371] focus:ring-[#3CB371]/20 text-[#1F2937]'
                        }`}
                      >
                        <option value="">-- Chọn sản phẩm khách quan tâm --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.product_code}) — {Number(p.unit_price || 0).toLocaleString('vi-VN')} đ
                          </option>
                        ))}
                      </select>
                    </div>
                    {fieldErrors.product_id && (
                      <p className="text-xs text-rose-500 mt-1">{fieldErrors.product_id}</p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
                      Số lượng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={autoOpp.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setAutoOpp((prev) => ({ ...prev, quantity: isNaN(val) ? '' : val }));
                        if (fieldErrors.quantity) {
                          setFieldErrors((prev) => ({ ...prev, quantity: '' }));
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-semibold text-center focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.quantity
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-[#DDF0E2] focus:border-[#3CB371] focus:ring-[#3CB371]/20 text-[#1F2937]'
                      }`}
                    />
                    {fieldErrors.quantity && (
                      <p className="text-xs text-rose-500 mt-1">{fieldErrors.quantity}</p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
                      Dự kiến chốt
                    </label>
                    <input
                      type="date"
                      value={autoOpp.expected_close_date}
                      onChange={(e) =>
                        setAutoOpp((prev) => ({ ...prev, expected_close_date: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDF0E2] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#3CB371] focus:ring-2 focus:ring-[#3CB371]/20 transition-all text-[#1F2937]"
                    />
                  </div>
                </div>

                {/* Tính toán giá trị dự kiến tức thời */}
                {selectedProduct && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#EAF5EC] border border-[#DDF0E2] rounded-xl text-xs">
                    <div className="text-[#6B7280]">
                      <span>Đơn giá: </span>
                      <strong className="text-[#1F2937]">
                        {Number(selectedProduct.unit_price || 0).toLocaleString('vi-VN')} đ
                      </strong>
                      <span className="mx-2">•</span>
                      <span>Tồn kho hiện tại: </span>
                      <strong className="text-[#1F2937]">{selectedProduct.stock_qty || 0} sản phẩm</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[#2E7D32] font-medium">Giá trị cơ hội dự kiến: </span>
                      <strong className="text-sm font-bold text-[#2E7D32]">
                        {(
                          Number(selectedProduct.unit_price || 0) * (parseInt(autoOpp.quantity, 10) || 1)
                        ).toLocaleString('vi-VN')}{' '}
                        đ
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDF0E2]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#1F2937] bg-[#F3F4F6] hover:bg-[#EAF5EC] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'Hủy Bỏ'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#3CB371] hover:bg-[#38A169] rounded-xl transition-colors shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit
              ? (language === 'en' ? 'Update Lead' : 'Cập Nhật Khách Hàng')
              : (language === 'en' ? 'Save New Lead' : 'Lưu Khách Hàng Mới')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
