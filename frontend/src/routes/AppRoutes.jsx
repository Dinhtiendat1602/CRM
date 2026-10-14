import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import MainLayout from '../components/Layout/MainLayout';

// Pages
import Login from '../pages/Auth/Login';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';
import Forbidden from '../pages/Forbidden';
import NotFound from '../pages/NotFound';
import Dashboard from '../pages/Dashboard/Dashboard';
import UserManagement from '../pages/Admin/UserManagement';
import ProfilePage from '../pages/Profile/ProfilePage';
import LeadListPage from '../pages/Leads/LeadListPage';
import LeadDetailPage from '../pages/Leads/LeadDetailPage';
import PlaceholderPage from '../pages/Common/PlaceholderPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/403" element={<Forbidden />} />

      {/* Protected Routes — Require Authentication & Wrap in MainLayout */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          {/* Default Redirect to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Leads Module (All Roles - SRS 3.1 - 3.5) */}
          <Route path="/leads" element={<LeadListPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />

          {/* Opportunities Module (All Roles) */}
          <Route
            path="/opportunities"
            element={
              <PlaceholderPage
                title="Quản lý Cơ hội Bán hàng (Opportunities)"
                srsRef="SRS 3.6 - 3.12"
                description="Theo dõi Deal, ghi nhật ký chăm sóc (Follow-up log) và Chốt đơn hàng."
                featureId="feat-013"
              />
            }
          />
          <Route
            path="/opportunities/:id"
            element={
              <PlaceholderPage
                title="Chi tiết Cơ hội & Timeline Chăm sóc"
                srsRef="SRS 3.7.3 REQ-4"
                description="Lịch sử tương tác qua điện thoại, email, gặp mặt và quy trình Make Order."
                featureId="feat-013"
              />
            }
          />

          {/* Orders Module (All Roles) */}
          <Route
            path="/orders"
            element={
              <PlaceholderPage
                title="Danh sách Đơn hàng (Orders)"
                srsRef="SRS 3.12"
                description="Quản lý hóa đơn đã chốt, bảo toàn giá bán và lịch sử giao hàng."
                featureId="feat-015"
              />
            }
          />
          <Route
            path="/orders/:id"
            element={
              <PlaceholderPage
                title="Chi tiết Đơn hàng"
                srsRef="SRS 3.12"
                description="Xem chi tiết hóa đơn xuất hàng, thông tin thanh toán và địa chỉ giao."
                featureId="feat-015"
              />
            }
          />

          {/* Manager & Admin Modules (RBAC Guard) */}
          <Route element={<RoleRoute allowedRoles={['SALE_MANAGER', 'ADMIN']} />}>
            <Route
              path="/products"
              element={
                <PlaceholderPage
                  title="Danh mục & Sản phẩm Kho (Products)"
                  srsRef="SRS 3.15 - 3.17"
                  description="Quản lý sản phẩm, tồn kho kho hàng, xem cơ hội và đơn hàng theo từng sản phẩm."
                  featureId="feat-011"
                />
              }
            />
            <Route
              path="/products/:id"
              element={
                <PlaceholderPage
                  title="Chi tiết Sản phẩm Kho"
                  srsRef="SRS 3.16 - 3.17"
                  description="Hai tabs con riêng biệt: View Opportunities và View Orders liên quan đến sản phẩm."
                  featureId="feat-011"
                />
              }
            />
            <Route
              path="/campaigns"
              element={
                <PlaceholderPage
                  title="Chiến dịch Tiếp thị (Campaigns)"
                  srsRef="SRS 3.18"
                  description="Lập kế hoạch chiến dịch, phân bổ ngân sách và gắn sản phẩm mục tiêu."
                  featureId="feat-017"
                />
              }
            />
            <Route
              path="/campaigns/:id/report"
              element={
                <PlaceholderPage
                  title="Báo cáo Hiệu quả Chiến dịch (Campaign Report)"
                  srsRef="SRS 3.19"
                  description="Đo lường ROI: Tổng Lead thu được, Tổng Cơ hội chuyển đổi và danh sách chi tiết."
                  featureId="feat-017"
                />
              }
            />
            <Route
              path="/forecast/setup"
              element={
                <PlaceholderPage
                  title="Lập Kế hoạch Doanh số 12 Tháng"
                  srsRef="SRS 3.20"
                  description="Thiết lập chỉ tiêu doanh số năm tài chính cho từng tháng trong năm."
                  featureId="feat-019"
                />
              }
            />
            <Route
              path="/forecast/performance"
              element={
                <PlaceholderPage
                  title="Báo cáo Đối soát Doanh số (Performance Report)"
                  srsRef="SRS 3.21"
                  description="Đối soát 12 tháng: Tháng | Kế hoạch ($) | Thực tế ($) | % Đạt và Biểu đồ Chart.js."
                  featureId="feat-019"
                />
              }
            />
            <Route
              path="/reports"
              element={
                <PlaceholderPage
                  title="Báo cáo Thống kê Toàn diện (General Reports)"
                  srsRef="SRS 2.1"
                  description="Báo cáo thống kê Leads, Đơn hàng và Doanh thu theo Ngày / Tháng / Năm."
                  featureId="feat-017"
                />
              }
            />
          </Route>

          {/* Admin Exclusive Modules (RBAC Guard) */}
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>

          {/* Profile Route for all logged in users */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
