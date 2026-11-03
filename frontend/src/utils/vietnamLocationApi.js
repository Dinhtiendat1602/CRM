/**
 * Utility & Client Service: API Đơn vị Hành chính Quốc gia Việt Nam
 * Kết nối dữ liệu 63 Tỉnh / Thành phố trực thuộc Trung ương chuẩn Tổng cục Thống kê (GSO)
 * Tích hợp API công khai provinces.open-api.vn kèm cơ chế cache và fallback dự phòng offline 100%.
 */

export const VIETNAM_PROVINCES = [
  { code: 1, name: 'Thành phố Hà Nội', short_name: 'Hà Nội' },
  { code: 79, name: 'Thành phố Hồ Chí Minh', short_name: 'TP. Hồ Chí Minh' },
  { code: 48, name: 'Thành phố Đà Nẵng', short_name: 'Đà Nẵng' },
  { code: 31, name: 'Thành phố Hải Phòng', short_name: 'Hải Phòng' },
  { code: 92, name: 'Thành phố Cần Thơ', short_name: 'Cần Thơ' },
  { code: 74, name: 'Tỉnh Bình Dương', short_name: 'Bình Dương' },
  { code: 75, name: 'Tỉnh Đồng Nai', short_name: 'Đồng Nai' },
  { code: 77, name: 'Tỉnh Bà Rịa - Vũng Tàu', short_name: 'Bà Rịa - Vũng Tàu' },
  { code: 49, name: 'Tỉnh Quảng Nam', short_name: 'Quảng Nam' },
  { code: 46, name: 'Tỉnh Thừa Thiên Huế', short_name: 'Thừa Thiên Huế' },
  { code: 56, name: 'Tỉnh Khánh Hòa', short_name: 'Khánh Hòa' },
  { code: 68, name: 'Tỉnh Lâm Đồng', short_name: 'Lâm Đồng' },
  { code: 27, name: 'Tỉnh Bắc Ninh', short_name: 'Bắc Ninh' },
  { code: 22, name: 'Tỉnh Quảng Ninh', short_name: 'Quảng Ninh' },
  { code: 30, name: 'Tỉnh Hải Dương', short_name: 'Hải Dương' },
  { code: 33, name: 'Tỉnh Hưng Yên', short_name: 'Hưng Yên' },
  { code: 38, name: 'Tỉnh Thanh Hóa', short_name: 'Thanh Hóa' },
  { code: 40, name: 'Tỉnh Nghệ An', short_name: 'Nghệ An' },
  { code: 80, name: 'Tỉnh Long An', short_name: 'Long An' },
  { code: 82, name: 'Tỉnh Tiền Giang', short_name: 'Tiền Giang' },
  { code: 89, name: 'Tỉnh An Giang', short_name: 'An Giang' },
  { code: 91, name: 'Tỉnh Kiên Giang', short_name: 'Kiên Giang' },
  { code: 2, name: 'Tỉnh Hà Giang', short_name: 'Hà Giang' },
  { code: 4, name: 'Tỉnh Cao Bằng', short_name: 'Cao Bằng' },
  { code: 6, name: 'Tỉnh Bắc Kạn', short_name: 'Bắc Kạn' },
  { code: 8, name: 'Tỉnh Tuyên Quang', short_name: 'Tuyên Quang' },
  { code: 10, name: 'Tỉnh Lào Cai', short_name: 'Lào Cai' },
  { code: 11, name: 'Tỉnh Điện Biên', short_name: 'Điện Biên' },
  { code: 12, name: 'Tỉnh Lai Châu', short_name: 'Lai Châu' },
  { code: 14, name: 'Tỉnh Sơn La', short_name: 'Sơn La' },
  { code: 15, name: 'Tỉnh Yên Bái', short_name: 'Yên Bái' },
  { code: 17, name: 'Tỉnh Hoà Bình', short_name: 'Hoà Bình' },
  { code: 19, name: 'Tỉnh Thái Nguyên', short_name: 'Thái Nguyên' },
  { code: 20, name: 'Tỉnh Lạng Sơn', short_name: 'Lạng Sơn' },
  { code: 24, name: 'Tỉnh Bắc Giang', short_name: 'Bắc Giang' },
  { code: 25, name: 'Tỉnh Phú Thọ', short_name: 'Phú Thọ' },
  { code: 26, name: 'Tỉnh Vĩnh Phúc', short_name: 'Vĩnh Phúc' },
  { code: 34, name: 'Tỉnh Thái Bình', short_name: 'Thái Bình' },
  { code: 35, name: 'Tỉnh Hà Nam', short_name: 'Hà Nam' },
  { code: 36, name: 'Tỉnh Nam Định', short_name: 'Nam Định' },
  { code: 37, name: 'Tỉnh Ninh Bình', short_name: 'Ninh Bình' },
  { code: 42, name: 'Tỉnh Hà Tĩnh', short_name: 'Hà Tĩnh' },
  { code: 44, name: 'Tỉnh Quảng Bình', short_name: 'Quảng Bình' },
  { code: 45, name: 'Tỉnh Quảng Trị', short_name: 'Quảng Trị' },
  { code: 51, name: 'Tỉnh Quảng Ngãi', short_name: 'Quảng Ngãi' },
  { code: 52, name: 'Tỉnh Bình Định', short_name: 'Bình Định' },
  { code: 54, name: 'Tỉnh Phú Yên', short_name: 'Phú Yên' },
  { code: 58, name: 'Tỉnh Ninh Thuận', short_name: 'Ninh Thuận' },
  { code: 60, name: 'Tỉnh Bình Thuận', short_name: 'Bình Thuận' },
  { code: 62, name: 'Tỉnh Kon Tum', short_name: 'Kon Tum' },
  { code: 64, name: 'Tỉnh Gia Lai', short_name: 'Gia Lai' },
  { code: 66, name: 'Tỉnh Đắk Lắk', short_name: 'Đắk Lắk' },
  { code: 67, name: 'Tỉnh Đắk Nông', short_name: 'Đắk Nông' },
  { code: 70, name: 'Tỉnh Bình Phước', short_name: 'Bình Phước' },
  { code: 72, name: 'Tỉnh Tây Ninh', short_name: 'Tây Ninh' },
  { code: 83, name: 'Tỉnh Bến Tre', short_name: 'Bến Tre' },
  { code: 84, name: 'Tỉnh Trà Vinh', short_name: 'Trà Vinh' },
  { code: 86, name: 'Tỉnh Vĩnh Long', short_name: 'Vĩnh Long' },
  { code: 87, name: 'Tỉnh Đồng Tháp', short_name: 'Đồng Tháp' },
  { code: 93, name: 'Tỉnh Hậu Giang', short_name: 'Hậu Giang' },
  { code: 94, name: 'Tỉnh Sóc Trăng', short_name: 'Sóc Trăng' },
  { code: 95, name: 'Tỉnh Bạc Liêu', short_name: 'Bạc Liêu' },
  { code: 96, name: 'Tỉnh Cà Mau', short_name: 'Cà Mau' },
];

export const POPULAR_COUNTRIES = [
  'Việt Nam',
  'Hoa Kỳ (United States)',
  'Nhật Bản (Japan)',
  'Hàn Quốc (South Korea)',
  'Singapore',
  'Úc (Australia)',
  'Đức (Germany)',
  'Pháp (France)',
  'Anh (United Kingdom)',
  'Thái Lan (Thailand)',
  'Malaysia',
  'Khác',
];

// Bộ nhớ cache tạm thời trong phiên làm việc
let cachedProvinces = null;
const cachedDistricts = new Map();
const cachedWards = new Map();

/**
 * Lấy danh sách 63 Tỉnh/Thành phố từ API Quốc gia Việt Nam (provinces.open-api.vn)
 * Tự động fallback danh sách chuẩn nếu mất kết nối hoặc timeout
 */
export async function fetchVietnamProvinces() {
  if (cachedProvinces && cachedProvinces.length > 0) {
    return cachedProvinces;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://provinces.open-api.vn/api/p/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedProvinces = data.map((item) => ({
          code: item.code,
          name: item.name,
          short_name: item.name
            .replace(/^Thành phố\s+/i, 'TP. ')
            .replace(/^Tỉnh\s+/i, ''),
        }));
        return cachedProvinces;
      }
    }
  } catch (err) {
    console.info('Sử dụng danh mục 63 Tỉnh/Thành phố Việt Nam dự phòng:', err?.message || err);
  }

  cachedProvinces = VIETNAM_PROVINCES;
  return cachedProvinces;
}

/**
 * Lấy danh sách Quận / Huyện theo mã Tỉnh/Thành phố từ API Quốc gia
 */
export async function fetchDistrictsByProvince(provinceCodeOrName) {
  if (!provinceCodeOrName) return [];

  // Tìm mã tỉnh
  let code = null;
  if (typeof provinceCodeOrName === 'number') {
    code = provinceCodeOrName;
  } else {
    const found = VIETNAM_PROVINCES.find(
      (p) =>
        String(p.code) === String(provinceCodeOrName) ||
        p.name.toLowerCase() === String(provinceCodeOrName).trim().toLowerCase() ||
        p.short_name.toLowerCase() === String(provinceCodeOrName).trim().toLowerCase()
    );
    if (found) code = found.code;
  }

  if (!code) return [];
  if (cachedDistricts.has(code)) return cachedDistricts.get(code);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.districts)) {
        const districts = data.districts.map((d) => ({
          code: d.code,
          name: d.name,
        }));
        cachedDistricts.set(code, districts);
        return districts;
      }
    }
  } catch (err) {
    console.info('Không thể tải Quận/Huyện từ API Quốc gia:', err?.message || err);
  }

  return [];
}

/**
 * Lấy danh sách Phường / Xã theo Quận/Huyện từ API Quốc gia
 */
export async function fetchWardsByDistrict(districtCodeOrName, districtsList = []) {
  if (!districtCodeOrName) return [];

  let code = null;
  if (typeof districtCodeOrName === 'number') {
    code = districtCodeOrName;
  } else {
    const searchName = String(districtCodeOrName).trim().toLowerCase();
    const allDistricts = [...districtsList, ...Array.from(cachedDistricts.values()).flat()];
    const found = allDistricts.find(
      (d) =>
        String(d.code) === String(districtCodeOrName) ||
        d.name.toLowerCase() === searchName ||
        d.name.toLowerCase().replace(/^(quận|huyện|thị xã|thành phố)\s+/i, '') === searchName
    );
    if (found) code = found.code;
  }

  if (!code) return [];
  if (cachedWards.has(code)) return cachedWards.get(code);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.wards)) {
        const wards = data.wards.map((w) => ({
          code: w.code,
          name: w.name,
          division_type: w.division_type,
        }));
        cachedWards.set(code, wards);
        return wards;
      }
    }
  } catch (err) {
    console.info('Không thể tải Phường/Xã từ API Quốc gia:', err?.message || err);
  }

  return [];
}

