/**
 * Utility & Client Service: API Đơn vị Hành chính Quốc gia Việt Nam
 * Kết nối dữ liệu 63 Tỉnh / Thành phố trực thuộc Trung ương, 696 Quận/Huyện, 10.051 Phường/Xã
 * Chuẩn Tổng cục Thống kê (GSO) & provinces.open-api.vn
 * Dữ liệu được tích hợp sẵn 100% trong hệ thống ("Tự có"), phản hồi 0ms, không phụ thuộc mạng.
 */
import vietnamData from '../data/vietnamAdministrative.json';

export const VIETNAM_PROVINCES = vietnamData.map((p) => ({
  code: p.code,
  name: p.name,
  short_name: p.short_name,
}));

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

/**
 * Lấy danh sách 63 Tỉnh / Thành phố
 */
export async function fetchVietnamProvinces() {
  return VIETNAM_PROVINCES;
}

/**
 * Tìm tỉnh theo code hoặc tên
 */
function findProvince(provinceCodeOrName) {
  if (!provinceCodeOrName) return null;
  const search = String(provinceCodeOrName).trim().toLowerCase();
  const cleanSearch = search.replace(/^(thành phố|tỉnh|tp\.)\s+/i, '').trim();

  return vietnamData.find((p) => {
    const pName = p.name.toLowerCase();
    const pShort = p.short_name.toLowerCase();
    const pClean = pShort.replace(/^(tp\.)\s+/i, '').trim();
    return (
      String(p.code) === search ||
      pName === search ||
      pShort === search ||
      pClean === cleanSearch ||
      pName.includes(cleanSearch) ||
      cleanSearch.includes(pClean)
    );
  });
}

/**
 * Lấy danh sách Quận / Huyện theo Tỉnh/Thành phố (Tự có sẵn 100%, 0ms latency)
 */
export async function fetchDistrictsByProvince(provinceCodeOrName) {
  if (!provinceCodeOrName) return [];
  const p = findProvince(provinceCodeOrName);
  if (!p || !Array.isArray(p.districts)) return [];
  return p.districts.map((d) => ({
    code: d.code,
    name: d.name,
  }));
}

/**
 * Lấy danh sách Phường / Xã theo Quận/Huyện và Tỉnh (Tự có sẵn 100%, 0ms latency)
 */
export async function fetchWardsByDistrict(districtCodeOrName, districtsList = [], provinceCodeOrName = null) {
  if (!districtCodeOrName) return [];
  const search = String(districtCodeOrName).trim().toLowerCase();
  const cleanSearch = search.replace(/^(quận|huyện|thị xã|thành phố)\s+/i, '').trim();

  // Nếu có province, tìm trong province đó trước
  let provincesToSearch = vietnamData;
  if (provinceCodeOrName) {
    const p = findProvince(provinceCodeOrName);
    if (p) provincesToSearch = [p];
  }

  for (const province of provincesToSearch) {
    const foundDistrict = (province.districts || []).find((d) => {
      const dName = d.name.toLowerCase();
      const dClean = dName.replace(/^(quận|huyện|thị xã|thành phố)\s+/i, '').trim();
      return (
        String(d.code) === search ||
        dName === search ||
        dClean === cleanSearch ||
        dName.includes(cleanSearch) ||
        cleanSearch.includes(dClean)
      );
    });

    if (foundDistrict && Array.isArray(foundDistrict.wards)) {
      return foundDistrict.wards.map((w, index) => ({
        code: `${foundDistrict.code}_${index}`,
        name: w,
      }));
    }
  }

  return [];
}
