import { Search } from 'lucide-react';
import { useState } from 'react';
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import {
  OrderStatusText,
  OrderStatusTimeline,
  PaymentStatusText,
} from '../../components/orders/OrderStatusTimeline';
import { useSettings } from '../../features/settings/SettingsContext';
import {
  formatCurrency,
  formatDateTime,
  formatOrderType,
  formatPaymentMethod,
} from '../../lib/formatters';
import { trackGuestOrder } from '../../services/order.service';
import type { OrderWithDetails } from '../../types/domain';

export function TrackOrderPage() {
  const { settings } = useSettings();
  const [orderNumber, setOrderNumber] = useState('');
  const [verification, setVerification] = useState('');
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const found = await trackGuestOrder(orderNumber, verification);
      setOrder(found);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Unable to locate order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-b border-[#343238] pb-6">
          <p className="text-xs font-medium tracking-wider text-[#D4AF37]">ORDER TRACKING</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#F7F5EF]">
            Track Your Order
          </h1>
          <p className="mt-2 text-sm text-[#AAA69C]">
            Enter your order number along with either your mobile phone number or guest tracking
            token. Order numbers alone do not disclose order details.
          </p>
        </div>

        <form
          onSubmit={handleTrack}
          className="mt-8 space-y-4 rounded-lg border border-[#343238] bg-[#151518] p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="track-num" className="block text-xs font-semibold text-[#F7F5EF]">
                Order Number *
              </label>
              <input
                id="track-num"
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. LC-123456"
                className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm uppercase text-[#F7F5EF]"
              />
            </div>

            <div>
              <label htmlFor="track-verify" className="block text-xs font-semibold text-[#F7F5EF]">
                Mobile Phone or Tracking Token *
              </label>
              <input
                id="track-verify"
                type="text"
                required
                value={verification}
                onChange={(e) => setVerification(e.target.value)}
                placeholder="Phone number or token"
                className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] disabled:opacity-50"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? 'Checking...' : 'Look Up Order'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-6">
            <FeedbackBanner tone="error" message={error} />
          </div>
        )}

        {order && (
          <div className="mt-8 space-y-6 rounded-lg border border-[#343238] bg-[#151518] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#343238] pb-4">
              <div>
                <h2 className="font-mono-tabular text-xl font-semibold text-[#F7F5EF]">
                  {order.order_number}
                </h2>
                <p className="mt-1 text-xs text-[#AAA69C]">
                  {formatOrderType(order.order_type)} · Placed{' '}
                  {formatDateTime(order.placed_at, settings.timezone)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <OrderStatusText status={order.status} />
                <PaymentStatusText status={order.payment_status} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#AAA69C]">Payment Method</p>
                <p className="mt-0.5 text-[#F7F5EF]">
                  {formatPaymentMethod(order.payment_method)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#AAA69C]">Total</p>
                <p className="mt-0.5 font-mono-tabular font-semibold text-[#E7CB78]">
                  {formatCurrency(order.grand_total, settings.currency)}
                </p>
              </div>
            </div>

            <div className="border-t border-[#343238] pt-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[#D4AF37]">
                STATUS TIMELINE
              </h3>
              <OrderStatusTimeline history={order.status_history} timeZone={settings.timezone} />
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
