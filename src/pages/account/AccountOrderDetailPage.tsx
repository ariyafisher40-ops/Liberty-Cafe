import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AccountLayout } from '../../components/layout/AccountLayout';
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
import { getCustomerOrderByNumber, submitOrderProductReview } from '../../services/order.service';
import type { OrderWithDetails } from '../../types/domain';

export function AccountOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { settings } = useSettings();

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewProductId, setReviewProductId] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [reviewErr, setReviewErr] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderNumber) return;
    setLoading(true);
    setError(null);
    try {
      const found = await getCustomerOrderByNumber(orderNumber);
      setOrder(found);
      const firstProd = found?.items.find((i) => i.product_id)?.product_id ?? '';
      setReviewProductId(firstProd);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order.');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !reviewProductId) return;
    setReviewErr(null);
    setReviewMsg(null);
    setReviewSubmitting(true);
    try {
      await submitOrderProductReview({
        order_id: order.id,
        product_id: reviewProductId,
        rating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviewMsg('Review submitted and queued for admin moderation.');
      setReviewTitle('');
      setReviewComment('');
    } catch (err) {
      setReviewErr(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isReviewEligible =
    Boolean(order) &&
    (order!.status === 'completed' || order!.status === 'delivered') &&
    order!.items.some((i) => Boolean(i.product_id));

  return (
    <AccountLayout
      title={order ? `Order ${order.order_number}` : 'Order Details'}
      subtitle="Itemized order snapshot, payment status, and live status history."
    >
      <Link
        to="/account/orders"
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#AAA69C] hover:text-[#E7CB78]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Orders
      </Link>

      {error ? (
        <FeedbackBanner tone="error" message={error} onRetry={loadOrder} />
      ) : loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-[#151518]" />
      ) : !order ? (
        <EmptyState
          title="Order not found"
          description="This order does not belong to your account or could not be found."
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#343238] pb-4">
              <div>
                <p className="text-xs text-[#AAA69C]">
                  {formatOrderType(order.order_type)} · Placed{' '}
                  {formatDateTime(order.placed_at, settings.timezone)}
                </p>
                <p className="mt-1 text-sm text-[#F7F5EF]">
                  Payment: {formatPaymentMethod(order.payment_method)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <OrderStatusText status={order.status} />
                <PaymentStatusText status={order.payment_status} />
              </div>
            </div>

            <ul className="mt-4 divide-y divide-[#343238]/60 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-[#F7F5EF]">
                      {item.quantity}× {item.product_name_snapshot}
                    </p>
                    {item.variant_name_snapshot && (
                      <p className="text-xs text-[#AAA69C]">
                        Option: {item.variant_name_snapshot}
                      </p>
                    )}
                    {item.add_ons.length > 0 && (
                      <p className="text-xs text-[#AAA69C]">
                        Add-ons: {item.add_ons.map((a) => a.add_on_name_snapshot).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-mono-tabular text-[#F7F5EF]">
                    {formatCurrency(item.line_total, settings.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-[#343238] pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#AAA69C]">Subtotal</dt>
                <dd className="font-mono-tabular text-[#F7F5EF]">
                  {formatCurrency(order.subtotal, settings.currency)}
                </dd>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-[#4CAF78]">
                  <dt>Discount</dt>
                  <dd className="font-mono-tabular">
                    -{formatCurrency(order.discount_total, settings.currency)}
                  </dd>
                </div>
              )}
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[#AAA69C]">Delivery Fee</dt>
                  <dd className="font-mono-tabular text-[#F7F5EF]">
                    {formatCurrency(order.delivery_fee, settings.currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[#343238] pt-3 font-semibold">
                <dt className="text-[#F7F5EF]">Grand Total</dt>
                <dd className="font-mono-tabular text-[#E7CB78]">
                  {formatCurrency(order.grand_total, settings.currency)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-[#F7F5EF]">
              Order Status Timeline
            </h2>
            <OrderStatusTimeline history={order.status_history} timeZone={settings.timezone} />
          </div>

          {isReviewEligible && (
            <form
              onSubmit={handleReviewSubmit}
              className="space-y-4 rounded-lg border border-[#343238] bg-[#151518] p-6"
            >
              <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
                Submit Product Review
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rev-prod" className="block text-xs font-semibold text-[#F7F5EF]">
                    Item
                  </label>
                  <select
                    id="rev-prod"
                    value={reviewProductId}
                    onChange={(e) => setReviewProductId(e.target.value)}
                    className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                  >
                    {order.items
                      .filter((i) => i.product_id)
                      .map((i) => (
                        <option key={i.id} value={i.product_id!}>
                          {i.product_name_snapshot}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rev-rate" className="block text-xs font-semibold text-[#F7F5EF]">
                    Rating (1–5)
                  </label>
                  <select
                    id="rev-rate"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Star{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="rev-title" className="block text-xs font-semibold text-[#F7F5EF]">
                  Headline (Optional)
                </label>
                <input
                  id="rev-title"
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                />
              </div>
              <div>
                <label htmlFor="rev-body" className="block text-xs font-semibold text-[#F7F5EF]">
                  Your Feedback
                </label>
                <textarea
                  id="rev-body"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#343238] bg-[#0B0B0D] p-3 text-sm text-[#F7F5EF]"
                />
              </div>
              {reviewErr && <p className="text-xs text-[#E06A6A]">{reviewErr}</p>}
              {reviewMsg && <p className="text-xs text-[#4CAF78]">{reviewMsg}</p>}
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D] hover:bg-[#E7CB78]"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}
    </AccountLayout>
  );
}
