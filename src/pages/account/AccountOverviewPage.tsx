import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { OrderStatusText } from '../../components/orders/OrderStatusTimeline';
import { useAuth } from '../../features/auth/AuthContext';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency, formatDateTime, formatOrderType } from '../../lib/formatters';
import { listOwnAddresses } from '../../services/auth.service';
import { getCustomerOrders } from '../../services/order.service';
import type { OrderWithDetails } from '../../types/domain';

export function AccountOverviewPage() {
  const { profile, email } = useAuth();
  const { settings } = useSettings();

  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordList, addrList] = await Promise.all([getCustomerOrders(), listOwnAddresses()]);
      setOrders(ordList);
      setAddressCount(addrList.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load account summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  return (
    <AccountLayout
      title="Account Overview"
      subtitle="View your recent orders, saved delivery addresses, and profile details."
    >
      {error && (
        <div className="mb-6">
          <FeedbackBanner tone="error" message={error} onRetry={loadOverview} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-5">
          <p className="text-xs text-[#AAA69C]">Account Holder</p>
          <p className="mt-1 font-display text-lg font-semibold text-[#F7F5EF]">
            {profile?.full_name || 'Customer'}
          </p>
          <p className="truncate text-xs text-[#AAA69C]">{email}</p>
        </div>

        <div className="rounded-lg border border-[#343238] bg-[#151518] p-5">
          <p className="text-xs text-[#AAA69C]">Orders Placed</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#E7CB78]">
            {loading ? '—' : orders.length}
          </p>
          <Link to="/account/orders" className="mt-1 inline-block text-xs text-[#AAA69C] underline">
            View order history
          </Link>
        </div>

        <div className="rounded-lg border border-[#343238] bg-[#151518] p-5">
          <p className="text-xs text-[#AAA69C]">Saved Addresses</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#E7CB78]">
            {loading ? '—' : addressCount}
          </p>
          <Link
            to="/account/addresses"
            className="mt-1 inline-block text-xs text-[#AAA69C] underline"
          >
            Manage addresses
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">Recent Orders</h2>
          <Link to="/account/orders" className="text-xs font-semibold text-[#E7CB78] underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="h-36 animate-pulse rounded-lg bg-[#151518]" />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders placed yet"
            description="Browse the menu to place your first Home Delivery, Takeaway, or Dine-in order."
            action={
              <Link
                to="/menu"
                className="inline-flex min-h-10 items-center rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
              >
                Explore Menu
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.order_number}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#343238] bg-[#151518] p-4 transition-colors hover:border-[#D4AF37]/60"
              >
                <div>
                  <p className="font-mono-tabular text-sm font-semibold text-[#F7F5EF]">
                    {order.order_number}
                  </p>
                  <p className="text-xs text-[#AAA69C]">
                    {formatOrderType(order.order_type)} ·{' '}
                    {formatDateTime(order.placed_at, settings.timezone)}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <OrderStatusText status={order.status} />
                  <span className="font-mono-tabular text-sm font-semibold text-[#E7CB78]">
                    {formatCurrency(order.grand_total, settings.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
