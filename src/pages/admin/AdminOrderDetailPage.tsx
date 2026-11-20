import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
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
import {
  adminGetOrderById,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus,
} from '../../services/admin.service';
import { getPrivatePaymentProofUrl } from '../../services/payment.service';
import type { OrderStatus } from '../../types/database';
import type { OrderWithDetails } from '../../types/domain';

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled',
];

export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { settings } = useSettings();

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('pending');
  const [statusNote, setStatusNote] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [proofSignedUrl, setProofSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const found = await adminGetOrderById(orderId);
      setOrder(found);
      if (found) {
        setNextStatus(found.status);
        setAdminNote(found.admin_note ?? '');
        const proofPath = found.payments[0]?.proof_object_path;
        if (proofPath) {
          const url = await getPrivatePaymentProofUrl(proofPath);
          setProofSignedUrl(url);
        } else {
          setProofSignedUrl(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await adminUpdateOrderStatus(order.id, nextStatus, statusNote, adminNote);
      setStatusNote('');
      setFeedback('Order status updated and logged to status history.');
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update order.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPayment = async (decision: 'paid' | 'rejected' | 'unpaid') => {
    if (!order) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await adminUpdatePaymentStatus(order.id, order.payments[0]?.id ?? null, decision);
      setFeedback(`Payment status updated to ${decision}.`);
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update payment status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title={order ? `Order ${order.order_number}` : 'Order Detail'}
      subtitle="Inspect order snapshots, verify manual payments, and advance fulfillment status."
    >
      <Link
        to="/admin/orders"
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#AAA69C] hover:text-[#E7CB78]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Orders
      </Link>

      {error && (
        <div className="mb-6">
          <FeedbackBanner tone="error" message={error} />
        </div>
      )}
      {feedback && (
        <div className="mb-6">
          <FeedbackBanner tone="success" message={feedback} />
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-[#151518]" />
      ) : !order ? (
        <EmptyState title="Order not found" description="The requested order ID does not exist." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#343238] pb-4">
                <div>
                  <p className="text-xs text-[#AAA69C]">
                    {formatOrderType(order.order_type)} · Placed{' '}
                    {formatDateTime(order.placed_at, settings.timezone)}
                  </p>
                  <p className="mt-1 font-semibold text-[#F7F5EF]">
                    {order.customer_name} · {order.customer_phone}
                  </p>
                  {order.customer_email && (
                    <p className="text-xs text-[#AAA69C]">{order.customer_email}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <OrderStatusText status={order.status} />
                  <PaymentStatusText status={order.payment_status} />
                </div>
              </div>

              {order.order_type === 'delivery' && order.delivery_address_snapshot && (
                <div className="mt-4 border-b border-[#343238] pb-4 text-sm">
                  <p className="text-xs font-semibold text-[#D4AF37]">Delivery Address Snapshot</p>
                  <p className="mt-1 text-[#F7F5EF]">
                    {order.delivery_address_snapshot.recipient_name} (
                    {order.delivery_address_snapshot.phone})
                  </p>
                  <p className="text-[#AAA69C]">
                    {order.delivery_address_snapshot.address_line},{' '}
                    {order.delivery_address_snapshot.area},{' '}
                    {order.delivery_address_snapshot.city}
                  </p>
                </div>
              )}

              {order.order_type === 'dine_in' && (
                <div className="mt-4 border-b border-[#343238] pb-4 text-sm">
                  <p className="text-xs font-semibold text-[#D4AF37]">Dine-in Table</p>
                  <p className="mt-1 font-mono-tabular text-[#F7F5EF]">
                    {order.table_code_snapshot}
                  </p>
                </div>
              )}

              {order.customer_note && (
                <div className="mt-4 border-b border-[#343238] pb-4 text-sm">
                  <p className="text-xs font-semibold text-[#AAA69C]">Customer Note</p>
                  <p className="mt-1 text-[#F7F5EF]">{order.customer_note}</p>
                </div>
              )}

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
                      {item.special_instructions && (
                        <p className="text-xs italic text-[#E7CB78]">
                          Kitchen note: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    <span className="font-mono-tabular font-semibold text-[#F7F5EF]">
                      {formatCurrency(item.line_total, settings.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-1.5 border-t border-[#343238] pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#AAA69C]">Subtotal</dt>
                  <dd className="font-mono-tabular">
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
                    <dd className="font-mono-tabular">
                      {formatCurrency(order.delivery_fee, settings.currency)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#343238] pt-2 font-semibold">
                  <dt className="text-[#F7F5EF]">Grand Total</dt>
                  <dd className="font-mono-tabular text-[#E7CB78]">
                    {formatCurrency(order.grand_total, settings.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-[#F7F5EF]">
                Status History
              </h2>
              <OrderStatusTimeline history={order.status_history} timeZone={settings.timezone} />
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <form
              onSubmit={handleUpdateStatus}
              className="space-y-4 rounded-lg border border-[#343238] bg-[#151518] p-6"
            >
              <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
                Update Order Status
              </h2>
              <div>
                <label htmlFor="ord-status" className="block text-xs font-semibold text-[#F7F5EF]">
                  Order Status
                </label>
                <select
                  id="ord-status"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                  className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ord-hist-note" className="block text-xs font-semibold text-[#F7F5EF]">
                  Customer-visible Status Note (Optional)
                </label>
                <input
                  id="ord-hist-note"
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched with rider"
                  className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                />
              </div>
              <div>
                <label htmlFor="ord-admin-note" className="block text-xs font-semibold text-[#F7F5EF]">
                  Internal Admin Note
                </label>
                <textarea
                  id="ord-admin-note"
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#343238] bg-[#0B0B0D] p-3 text-sm text-[#F7F5EF]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="min-h-10 w-full rounded-md bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Save Status Update'}
              </button>
            </form>

            <div className="space-y-4 rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
                Payment Verification
              </h2>
              <p className="text-sm text-[#AAA69C]">
                Method: {formatPaymentMethod(order.payment_method)}
              </p>
              {order.payments[0]?.transaction_reference && (
                <p className="text-xs text-[#F7F5EF]">
                  Transaction Ref:{' '}
                  <span className="font-mono-tabular text-[#E7CB78]">
                    {order.payments[0].transaction_reference}
                  </span>
                </p>
              )}
              {order.payments[0]?.proof_object_path && (
                <div className="text-xs">
                  <p className="text-[#AAA69C]">
                    Proof Path: {order.payments[0].proof_object_path}
                  </p>
                  {proofSignedUrl && (
                    <a
                      href={proofSignedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block font-semibold text-[#E7CB78] underline"
                    >
                      Open Receipt Image (Signed URL)
                    </a>
                  )}
                </div>
              )}

              {order.payment_method === 'card_online_demo' ? (
                <p className="text-xs text-[#E7CB78]">
                  Card / Online Demo orders must never be marked as paid automatically.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleVerifyPayment('paid')}
                    className="min-h-9 rounded-md bg-[#4CAF78] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
                  >
                    Mark Paid / Verified
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleVerifyPayment('rejected')}
                    className="min-h-9 rounded-md bg-[#E06A6A] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
                  >
                    Reject Proof
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
