import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { OrderStatusText, PaymentStatusText } from '../../components/orders/OrderStatusTimeline';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency, formatDateTime, formatOrderType } from '../../lib/formatters';
import { adminListOrders } from '../../services/admin.service';
import type { OrderPaymentStatus, OrderStatus, OrderType } from '../../types/database';
import type { OrderWithDetails } from '../../types/domain';

export function AdminOrdersPage() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<OrderType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<OrderPaymentStatus | 'all'>('all');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminListOrders();
      setOrders(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (modeFilter !== 'all' && o.order_type !== modeFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [orders, modeFilter, statusFilter, paymentFilter, search]);

  return (
    <AdminLayout
      title="Orders"
      subtitle="Filter orders by mode, fulfillment status, and payment verification state."
    >
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <label htmlFor="ord-search" className="sr-only">
            Search orders
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AAA69C]" />
          <input
            id="ord-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order #, name, phone..."
            className="min-h-10 w-full rounded-md border border-[#343238] bg-[#151518] pl-9 pr-3 text-xs text-[#F7F5EF]"
          />
        </div>

        <select
          aria-label="Filter by order mode"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value as OrderType | 'all')}
          className="min-h-10 rounded-md border border-[#343238] bg-[#151518] px-3 text-xs text-[#F7F5EF]"
        >
          <option value="all">All Order Modes</option>
          <option value="delivery">Home Delivery</option>
          <option value="takeaway">Takeaway</option>
          <option value="dine_in">Dine-in</option>
        </select>

        <select
          aria-label="Filter by order status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="min-h-10 rounded-md border border-[#343238] bg-[#151518] px-3 text-xs text-[#F7F5EF]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          aria-label="Filter by payment status"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as OrderPaymentStatus | 'all')}
          className="min-h-10 rounded-md border border-[#343238] bg-[#151518] px-3 text-xs text-[#F7F5EF]"
        >
          <option value="all">All Payment Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {error ? (
        <FeedbackBanner tone="error" message={error} onRetry={loadOrders} />
      ) : loading ? (
        <div className="h-48 animate-pulse rounded-lg bg-[#151518]" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching orders"
          description="Orders matching your filters will appear here once customers complete checkout."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#343238] bg-[#151518]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#343238] text-xs text-[#AAA69C]">
              <tr>
                <th className="px-4 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Mode</th>
                <th className="px-4 py-3 font-semibold">Order Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 text-right font-semibold">Grand Total</th>
                <th className="px-4 py-3 text-right font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343238]/60">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-[#1D1D21]/60">
                  <td className="px-4 py-3 font-mono-tabular font-semibold text-[#E7CB78]">
                    {order.order_number}
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
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="rounded border border-[#343238] px-3 py-1.5 text-xs font-semibold text-[#F7F5EF] hover:border-[#D4AF37]"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
