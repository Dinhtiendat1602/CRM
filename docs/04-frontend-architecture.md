# KIẾN TRÚC FRONTEND VÀ GIAO DIỆN NGƯỜI DÙNG (REACT 18 + VITE)
> **Dự án:** Zen CRM  
> **Tech Stack:** React 18 (Vite), React Router v6, Axios, Chart.js, Lucide Icons  
> **Phong cách UI:** Zoho CRM Modern Dashboard (SRS 4.1: "Refer to www.zoho.com/crm")  
> **Port:** `5173`  
> **Căn cứ:** SRS Version 1.1 — Mục 2.1, 3.1 → 3.21, 4.1, 5.3

---

## 1. CẤU TRÚC THƯ MỤC FRONTEND

```plaintext
frontend/
├── src/
│   ├── api/                            # Tầng giao tiếp HTTP với Backend
│   │   ├── axiosClient.js              # BaseURL, tự động gán Bearer Token, bắt lỗi 401 → Logout
│   │   ├── authApi.js                  # login, me, updateProfile, forgotPassword, resetPassword (SRS 3.13, 3.14)
│   │   ├── adminApi.js                 # getUsers, createUser, toggleStatus, changeRole, resetPw (SRS 2.1)
│   │   ├── leadApi.js                  # CRUD Leads, getLeadDetail (với Opp list) (SRS 3.1-3.5)
│   │   ├── oppApi.js                   # CRUD Opps, addFollowUp, makeOrder (SRS 3.6-3.12)
│   │   ├── orderApi.js                 # getOrders, getOrderDetail (SRS 3.12)
│   │   ├── categoryApi.js              # CRUD Product Categories (Lấy danh mục, thêm/sửa danh mục)
│   │   ├── productApi.js               # CRUD Products, getProductOpps, getProductOrders (SRS 3.15-3.17)
│   │   ├── campaignApi.js              # CRUD Campaigns, getCampaignReport (SRS 3.18-3.19)
│   │   ├── forecastApi.js              # setupPlan, getPerformanceReport (SRS 3.20-3.21)
│   │   └── reportApi.js                # getLeadReport, getOrderReport, getRevenueReport (SRS 2.1)
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── MainLayout.jsx           # Wrapper: Header (user info + logout) + Sidebar + Content Area
│   │   │   └── Sidebar.jsx              # Menu động — chỉ hiển thị mục theo quyền (RBAC)
│   │   ├── Common/
│   │   │   ├── Pagination.jsx           # Thanh phân trang chuẩn: 20 dòng/trang (SRS 3.2.3 REQ-1)
│   │   │   ├── DataTable.jsx            # Bảng dữ liệu có sort asc/desc, filter date range
│   │   │   ├── Modal.jsx                # Reusable Modal Dialog (backdrop, close button)
│   │   │   ├── ConfirmDialog.jsx        # Dialog xác nhận xóa/thao tác nguy hiểm
│   │   │   ├── SearchInput.jsx          # Ô tìm kiếm debounced (SRS 3.3, 3.8, 3.15, 3.18)
│   │   │   └── StatusBadge.jsx          # Badge hiển thị trạng thái Opp/Order với màu sắc
│   │   └── TimeoutWarning.jsx           # Popup cảnh báo đếm ngược 2 phút trước khi auto-logout (SRS 5.3)
│   │
│   ├── context/
│   │   └── AuthContext.jsx              # Global State: user, token, login(), logout(), role
│   │                                    # Tích hợp Hook useIdleTimeout (30 phút bất hoạt → logout) (SRS 5.3)
│   │
│   ├── hooks/
│   │   └── useIdleTimeout.js            # Lắng nghe mouse/keyboard events, reset 30-phút timer (SRS 5.3)
│   │
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx                # Form đăng nhập (username + password) (SRS 3.13)
│   │   │   ├── ForgotPassword.jsx       # Form nhập email gửi link reset (SRS 3.14 REQ-1)
│   │   │   └── ResetPassword.jsx        # Form nhập mật khẩu mới (từ link email) (SRS 3.14 REQ-2)
│   │   │
│   │   ├── Dashboard/
│   │   │   └── Dashboard.jsx            # Tổng quan: Cards thống kê + Biểu đồ Plan vs Actual (SRS 3.21)
│   │   │
│   │   ├── Leads/
│   │   │   ├── LeadList.jsx             # Bảng 20 Leads: sort date, filter date, search tên (SRS 3.2, 3.3)
│   │   │   ├── LeadModal.jsx            # Form Thêm/Sửa Lead + Cảnh báo trùng SĐT/Email (SRS 3.1, 3.4)
│   │   │   └── LeadDetail.jsx           # Chi tiết Lead + Tab danh sách Opportunity (SRS 3.2.3 REQ-4)
│   │   │
│   │   ├── Opportunities/
│   │   │   ├── OppList.jsx              # Bảng 20 Opps: sort, filter, search tên Lead/SP (SRS 3.7, 3.8)
│   │   │   ├── OppModal.jsx             # Form Thêm/Sửa Cơ hội (chọn Lead + SP + SL) (SRS 3.6, 3.9)
│   │   │   ├── FollowUpModal.jsx        # Form ghi nhật ký chăm sóc: Ngày, Kênh, ND, Phản hồi, KH tiếp (SRS 3.11)
│   │   │   └── MakeOrderModal.jsx       # Form chốt đơn: Thông tin thanh toán + Địa chỉ giao hàng (SRS 3.12)
│   │   │
│   │   ├── Orders/
│   │   │   ├── OrderList.jsx            # Danh sách đơn hàng đã chốt, lọc theo khoảng thời gian
│   │   │   └── OrderDetail.jsx          # Chi tiết: tổng tiền, thanh toán, địa chỉ giao hàng (SRS 3.12)
│   │   │
│   │   ├── Products/
│   │   │   ├── ProductList.jsx          # Quản lý sản phẩm, tìm kiếm theo tên/mã, lọc theo Danh mục (SRS 3.15)
│   │   │   ├── ProductModal.jsx         # Form Thêm/Sửa SP (mã, tên, giá, kho, chọn Danh mục, chiến dịch) (SRS 3.15)
│   │   │   ├── CategoryModal.jsx        # Quản lý Danh mục sản phẩm (thêm/sửa/xóa danh mục)
│   │   │   └── ProductDetail.jsx        # Chi tiết SP + Tab Cơ hội (SRS 3.16) + Tab Đơn hàng (SRS 3.17)
│   │   │
│   │   ├── Campaigns/
│   │   │   ├── CampaignList.jsx         # Danh sách & tìm kiếm chiến dịch (SRS 3.18)
│   │   │   ├── CampaignModal.jsx        # Form Thêm/Sửa chiến dịch (tên, mô tả, ngày, ngân sách) (SRS 3.18)
│   │   │   └── CampaignReport.jsx       # Báo cáo: Tổng Lead + Tổng Opp + Danh sách Lead (SRS 3.19)
│   │   │
│   │   ├── Forecast/
│   │   │   ├── SetupPlan.jsx            # Form nhập chỉ tiêu 12 tháng + Chọn năm tài chính (SRS 3.20)
│   │   │   └── PerformanceReport.jsx    # Bảng đối soát: Month | Plan | Actual | % + Biểu đồ (SRS 3.21)
│   │   │
│   │   ├── Reports/
│   │   │   └── GeneralReports.jsx       # Tab: Leads / Orders / Revenue — Bộ lọc Ngày/Tháng/Năm + Chart (SRS 2.1)
│   │   │
│   │   └── Admin/
│   │       └── UserManagement.jsx       # Bảng tất cả Users + Modal tạo mới + Toggle status + Gán role (SRS 2.1)
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx                # Cấu hình toàn bộ danh sách Routes
│   │   ├── PrivateRoute.jsx             # Guard: Redirect về /login nếu chưa đăng nhập
│   │   └── RoleRoute.jsx                # Guard: Redirect về /403 nếu không đủ quyền
│   │
│   ├── App.jsx                          # Bọc AuthContext + AppRoutes
│   ├── main.jsx                         # Entry point React DOM render
│   └── index.css                        # Global CSS: Variables, Reset, Typography, Layout tokens
│
├── .env                                 # VITE_API_URL=http://localhost:5000/api
├── index.html
├── vite.config.js
└── package.json
```

---

## 2. CẤU HÌNH AXIOS CLIENT (`src/api/axiosClient.js`)

```javascript
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // http://localhost:5000/api
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Tự động đính kèm JWT Token vào mọi request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Bắt lỗi 401 → tự động xóa token và chuyển về Login
axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;
```

---

## 3. XỬ LÝ YÊU CẦU PHI CHỨC NĂNG: SESSION TIMEOUT 30 PHÚT (SRS 5.3)

> *"System will timeout automatically if there are no actions during 30 minutes."* — SRS 5.3

### Hook `useIdleTimeout.js`
```javascript
// frontend/src/hooks/useIdleTimeout.js
import { useEffect, useRef } from 'react';

export const useIdleTimeout = (onTimeout, timeoutDuration = 30 * 60 * 1000) => {
    const timerRef = useRef(null);

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(onTimeout, timeoutDuration);
    };

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        resetTimer(); // Khởi động hẹn giờ ngay khi mount
        events.forEach(e => window.addEventListener(e, resetTimer));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(e => window.removeEventListener(e, resetTimer));
        };
    }, []);
};
```

### Tích hợp trong `AuthContext.jsx`
```javascript
// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [token, setToken] = useState(() => localStorage.getItem('token'));

    const login = (userData, jwtToken) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', jwtToken);
        setUser(userData); setToken(jwtToken);
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null); setToken(null);
        navigate('/login');
    };

    // SRS 5.3: Tự động logout sau 30 phút không tương tác
    useIdleTimeout(() => {
        if (token) {
            logout();
            alert('Phiên làm việc đã hết hạn sau 30 phút không hoạt động. Vui lòng đăng nhập lại.');
        }
    }, 30 * 60 * 1000);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 4. DANH SÁCH TRANG & ROUTES PHÂN QUYỀN

| Route path | Component | Quyền truy cập | SRS Ref |
| :--- | :--- | :--- | :--- |
| `/login` | `Login.jsx` | Public | SRS 3.13 |
| `/forgot-password` | `ForgotPassword.jsx` | Public | SRS 3.14 |
| `/reset-password/:token` | `ResetPassword.jsx` | Public | SRS 3.14 |
| `/dashboard` | `Dashboard.jsx` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.21 (chart) |
| `/leads` | `LeadList.jsx` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.2, 3.3 |
| `/leads/:id` | `LeadDetail.jsx` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.2.3 REQ-4 |
| `/opportunities` | `OppList.jsx` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.7, 3.8 |
| `/opportunities/:id` | `OppDetail.jsx` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.7.3 REQ-4 |
| `/orders` | `OrderList.jsx` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.12 |
| `/orders/:id` | `OrderDetail.jsx` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.12 |
| `/products` | `ProductList.jsx` | SALE_MANAGER, ADMIN | SRS 3.15 |
| `/products/:id` | `ProductDetail.jsx` | SALE_MANAGER, ADMIN | SRS 3.16, 3.17 |
| `/campaigns` | `CampaignList.jsx` | SALE_MANAGER, ADMIN | SRS 3.18 |
| `/campaigns/:id/report` | `CampaignReport.jsx` | SALE_MANAGER, ADMIN | SRS 3.19 |
| `/forecast/setup` | `SetupPlan.jsx` | SALE_MANAGER, ADMIN | SRS 3.20 |
| `/forecast/performance` | `PerformanceReport.jsx` | SALE_MANAGER, ADMIN | SRS 3.21 |
| `/reports` | `GeneralReports.jsx` | SALE_MANAGER, ADMIN | SRS 2.1 |
| `/admin/users` | `UserManagement.jsx` | ADMIN | SRS 2.1 |
| `/profile` | `Profile.jsx` (trong MainLayout) | AUTH (tất cả) | SRS 3.13 |

---

## 5. SIDEBAR NAVIGATION THEO RBAC

```javascript
// Cấu hình menu: chỉ hiển thị mục phù hợp với role
const MENU_ITEMS = [
    { label: 'Dashboard',     icon: <LayoutDashboard />, path: '/dashboard',    roles: ['SALESMAN','SALE_MANAGER','ADMIN'] },
    { label: 'Leads',         icon: <Users />,           path: '/leads',        roles: ['SALESMAN','SALE_MANAGER','ADMIN'] },
    { label: 'Opportunities', icon: <TrendingUp />,      path: '/opportunities',roles: ['SALESMAN','SALE_MANAGER','ADMIN'] },
    { label: 'Orders',        icon: <ShoppingCart />,    path: '/orders',       roles: ['SALESMAN','SALE_MANAGER','ADMIN'] },
    { label: 'Products',      icon: <Package />,         path: '/products',     roles: ['SALE_MANAGER','ADMIN'] },
    { label: 'Campaigns',     icon: <Megaphone />,       path: '/campaigns',    roles: ['SALE_MANAGER','ADMIN'] },
    { label: 'Forecast',      icon: <BarChart2 />,       path: '/forecast/setup', roles: ['SALE_MANAGER','ADMIN'] },
    { label: 'Reports',       icon: <FileText />,        path: '/reports',      roles: ['SALE_MANAGER','ADMIN'] },
    { label: 'User Mgmt',     icon: <UserCog />,         path: '/admin/users',  roles: ['ADMIN'] },
];
```
