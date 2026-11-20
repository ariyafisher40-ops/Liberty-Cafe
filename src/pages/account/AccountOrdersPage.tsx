import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { OrderStatusText, PaymentStatusText } from '../../components/orders/OrderStatusTimeline';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency, formatDateTime, formatOrderType } from '../../lib/formatters';
import { getCustomerOrders } from '../../services/order.service';
import type { OrderWithDetails } from '../../types/domain';

export function AccountOrdersPage() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getCustomerOrders();
      setOrders(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <AccountLayout
      title="Order History"
      subtitle="Track current orders and inspect itemized snapshots from past purchases."
    >
      {error ? (
        <FeedbackBanner tone="error" message={error} onRetry={loadOrders} />
      ) : loading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-lg bg-[#151518]" />
          <div className="h-24 animate-pulse rounded-lg bg-[#151518]" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="You have no orders yet"
          description="Your completed and active orders will appear here."
          action={
            <Link
              to="/menu"
              className="inline-flex min-h-10 items-center rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
            >
              Browse Menu
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/account/orders/${order.order_number}`}
              className="block rounded-lg border border-[#343238] bg-[#151518] p-5 transition-colors hover:border-[#D4AF37]/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono-tabular text-base font-semibold text-[#F7F5EF]">
                    {order.order_number}
                  </p>
                  <p className="mt-1 text-xs text-[#AAA69C]">
                    {formatOrderType(order.order_type)} ·{' '}
                    {formatDateTime(order.placed_at, settings.timezone)} ·{' '}
                    {order.items.length} item(s)
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <OrderStatusText status={order.status} />
                  <PaymentStatusText status={order.payment_status} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#343238]/60 pt-3 text-sm">
                <span className="text-xs text-[#AAA69C]">View full receipt &amp; timeline</span>
                <span className="font-mono-tabular font-semibold text-[#E7CB78]">
                  {formatCurrency(order.grand_total, settings.currency)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
