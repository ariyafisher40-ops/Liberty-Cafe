import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RequireAdmin, RequireCustomer } from '../components/navigation/RouteGuards';
import { AccountAddressesPage } from '../pages/account/AccountAddressesPage';
import { AccountOrderDetailPage } from '../pages/account/AccountOrderDetailPage';
import { AccountOrdersPage } from '../pages/account/AccountOrdersPage';
import { AccountOverviewPage } from '../pages/account/AccountOverviewPage';
import { AccountProfilePage } from '../pages/account/AccountProfilePage';
import { AdminAddOnsPage } from '../pages/admin/AdminAddOnsPage';
import { AdminBannersPage } from '../pages/admin/AdminBannersPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminCouponsPage } from '../pages/admin/AdminCouponsPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminDeliveryZonesPage } from '../pages/admin/AdminDeliveryZonesPage';
import { AdminOrderDetailPage } from '../pages/admin/AdminOrderDetailPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminProductFormPage } from '../pages/admin/AdminProductFormPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminReviewsPage } from '../pages/admin/AdminReviewsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminTablesPage } from '../pages/admin/AdminTablesPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { AboutPage } from '../pages/public/AboutPage';
import { CartPage } from '../pages/public/CartPage';
import { CheckoutPage } from '../pages/public/CheckoutPage';
import { ContactPage } from '../pages/public/ContactPage';
import { HomePage } from '../pages/public/HomePage';
import { MenuPage } from '../pages/public/MenuPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { OffersPage } from '../pages/public/OffersPage';
import { OrderConfirmationPage } from '../pages/public/OrderConfirmationPage';
import { ProductDetailPage } from '../pages/public/ProductDetailPage';
import { TrackOrderPage } from '../pages/public/TrackOrderPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:categorySlug" element={<MenuPage />} />
        <Route path="/product/:productSlug" element={<ProductDetailPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />

        {/* Auth & Customer Account Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/account"
          element={
            <RequireCustomer>
              <AccountOverviewPage />
            </RequireCustomer>
          }
        />
        <Route
          path="/account/orders"
          element={
            <RequireCustomer>
              <AccountOrdersPage />
            </RequireCustomer>
          }
        />
        <Route
          path="/account/orders/:orderNumber"
          element={
            <RequireCustomer>
              <AccountOrderDetailPage />
            </RequireCustomer>
          }
        />
        <Route
          path="/account/addresses"
          element={
            <RequireCustomer>
              <AccountAddressesPage />
            </RequireCustomer>
          }
        />
        <Route
          path="/account/profile"
          element={
            <RequireCustomer>
              <AccountProfilePage />
            </RequireCustomer>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RequireAdmin>
              <AdminOrdersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/orders/:orderId"
          element={
            <RequireAdmin>
              <AdminOrderDetailPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RequireAdmin>
              <AdminProductsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <RequireAdmin>
              <AdminProductFormPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/products/:productId"
          element={
            <RequireAdmin>
              <AdminProductFormPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RequireAdmin>
              <AdminCategoriesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/add-ons"
          element={
            <RequireAdmin>
              <AdminAddOnsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <RequireAdmin>
              <AdminCouponsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/delivery-zones"
          element={
            <RequireAdmin>
              <AdminDeliveryZonesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <RequireAdmin>
              <AdminTablesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <RequireAdmin>
              <AdminReviewsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/banners"
          element={
            <RequireAdmin>
              <AdminBannersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAdmin>
              <AdminSettingsPage />
            </RequireAdmin>
          }
        />

        {/* Branded 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
