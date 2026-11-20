import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { OrderStatusText, PaymentStatusText } from '../../components/orders/OrderStatusTimeline';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency, formatDateTime, formatOrderType } from '../../lib/formatters';
import { adminListOrders, getAdminMetrics } from '../../services/admin.service';
import type { AdminMetrics, OrderWithDetails } from '../../types/domain';

export function AdminDashboardPage() {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, orders] = await Promise.all([getAdminMetrics(), adminListOrders()]);
      setMetrics(m);
      setRecentOrders(orders.slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Live operational figures from your orders and menu database."
      action={
        <Link
          to="/admin/products/new"
          className="inline-flex min-h-9 items-center rounded-md bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] whitespace-nowrap"
        >
          New Product
        </Link>
      }
    >
      {error && (
        <div className="mb-6">
          <FeedbackBanner tone="error" message={error} onRetry={loadDashboard} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-5">
          <p className="text-xs text-[#AAA69C]">Orders Today</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F7F5EF]">
            {loading ? '—' : metrics?.orders_today ?? 0}
          </p>
        </div>

        <div className="rounded-lg border border-[#343238] bg-[#151518] p-5">
          <p className="text-xs text-[#AAA69C]">Sales Today</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#E7CB78]">
            {loading ? '—' : formatCurrency(metrics?.sales_today ?? 0, settings.currency)}
          </p>
        </div>

        <div className="rounded-lg border border-[#343238] bg-[#151518] p-5">
          <p className="text-xs text-[#AAA69C]">Open / Pending Orders</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F7F5EF]">
            {loading ? '—' : metrics?.pending_orders ?? 0}
          </p>
        </div>

        <div className="rounded-lg border border-[#343238] bg-[#151518] p-5">
          <p className="text-xs text-[#AAA69C]">Available Products</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F7F5EF]">
            {loading ? '—' : metrics?.active_products ?? 0}
          </p>
        </div>

        <div className="rounded-lg border border-[#343238] bg-[#151518] p-5">
          <p className="text-xs text-[#AAA69C]">Registered Customers</p>
          <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F7F5EF]">
            {loading ? '—' : metrics?.customers_count ?? 0}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs font-semibold text-[#E7CB78] underline">
            Manage all orders
          </Link>
        </div>

        {loading ? (
          <div className="h-44 animate-pulse rounded-lg bg-[#151518]" />
        ) : recentOrders.length === 0 ? (
          <EmptyState
            title="No orders recorded yet"
            description="Orders placed through checkout will appear here immediately with real totals. Sample revenue is never fabricated."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#343238] bg-[#151518]">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-[#343238] text-xs text-[#AAA69C]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Mode</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 text-right font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343238]/60">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#1D1D21]/60">
                    <td className="px-4 py-3 font-mono-tabular font-semibold">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-[#E7CB78] hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#F7F5EF]">{order.customer_name}</p>
                      <p className="text-xs text-[#AAA69C]">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#AAA69C]">
                      {formatOrderType(order.order_type)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusText status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusText status={order.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#F7F5EF]">
                      {formatCurrency(order.grand_total, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-tabular text-xs text-[#AAA69C]">
                      {formatDateTime(order.placed_at, settings.timezone)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
