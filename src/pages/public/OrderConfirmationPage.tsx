import { Check, CheckCircle2, Copy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import {
  OrderStatusText,
  OrderStatusTimeline,
  PaymentStatusText,
} from '../../components/orders/OrderStatusTimeline';
import { useSettings } from '../../features/settings/SettingsContext';
import { env } from '../../lib/env';
import {
  formatCurrency,
  formatDateTime,
  formatOrderType,
  formatPaymentMethod,
} from '../../lib/formatters';
import { validateImageFile } from '../../lib/validators';
import { getOrderForConfirmation } from '../../services/order.service';
import { submitManualPaymentProof } from '../../services/payment.service';
import type { OrderWithDetails } from '../../types/domain';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { settings } = useSettings();

  const stateToken = (location.state as { trackingToken?: string | null } | null)?.trackingToken;
  const trackingToken = stateToken || searchParams.get('token');

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const [txRef, setTxRef] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofMsg, setProofMsg] = useState<string | null>(null);
  const [proofErr, setProofErr] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderNumber) return;
    setLoading(true);
    setError(null);
    try {
      const found = await getOrderForConfirmation(orderNumber, trackingToken);
      setOrder(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order confirmation.');
    } finally {
      setLoading(false);
    }
  }, [orderNumber, trackingToken]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleCopyToken = async () => {
    if (!trackingToken) return;
    try {
      await navigator.clipboard.writeText(trackingToken);
      setCopiedToken(true);
      window.setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      // Ignore clipboard restriction
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setProofErr(null);
    setProofMsg(null);
    if (proofFile) {
      const fErr = validateImageFile(proofFile);
      if (fErr) {
        setProofErr(fErr);
        return;
      }
    }
    setUploadingProof(true);
    try {
      await submitManualPaymentProof({
        orderId: order.id,
        transactionReference: txRef,
        file: proofFile,
        trackingToken,
      });
      setProofMsg('Payment reference submitted and marked Pending Verification.');
      await loadOrder();
    } catch (err) {
      setProofErr(err instanceof Error ? err.message : 'Unable to submit payment proof.');
    } finally {
      setUploadingProof(false);
    }
  };

  const isManualPayment =
    order &&
    (order.payment_method === 'jazzcash_manual' ||
      order.payment_method === 'easypaisa_manual' ||
      order.payment_method === 'bank_transfer_manual');

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-lg bg-[#151518]" />
            <div className="h-64 animate-pulse rounded-lg bg-[#151518]" />
          </div>
        ) : error ? (
          <FeedbackBanner
            tone="error"
            title="Unable to verify order"
            message={error}
            onRetry={loadOrder}
          />
        ) : !order ? (
          <EmptyState
            title="Order details unavailable"
            description="For privacy protection, guest order confirmations require a valid tracking token or signed-in owner session."
            action={
              <Link
                to="/track-order"
                className="inline-flex min-h-10 items-center rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
              >
                Track Your Order
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {!env.isSupabaseConfigured && (
              <FeedbackBanner
                tone="info"
                title="Preview Order Confirmation"
                message="This order was validated and saved in your local browser preview session because live Supabase is not yet connected."
              />
            )}

            <div className="rounded-lg border border-[#343238] bg-[#151518] p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#4CAF78]" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium tracking-wider text-[#D4AF37]">
                      ORDER RECEIVED
                    </p>
                    <h1 className="mt-1 font-display text-2xl font-semibold text-[#F7F5EF] sm:text-3xl">
                      Order <span className="font-mono-tabular">{order.order_number}</span>
                    </h1>
                    <p className="mt-1 text-xs text-[#AAA69C]">
                      Placed {formatDateTime(order.placed_at, settings.timezone)} ·{' '}
                      {formatOrderType(order.order_type)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <OrderStatusText status={order.status} />
                  <PaymentStatusText status={order.payment_status} />
                </div>
              </div>

              {trackingToken && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#343238] bg-[#0B0B0D] p-4 text-xs">
                  <div>
                    <p className="font-semibold text-[#F7F5EF]">Guest Tracking Token</p>
                    <p className="mt-0.5 font-mono-tabular text-[#E7CB78] break-all">
                      {trackingToken}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="inline-flex items-center gap-1.5 rounded border border-[#343238] bg-[#151518] px-3 py-1.5 font-semibold text-[#F7F5EF] hover:border-[#D4AF37]"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#4CAF78]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Order Mode Specific Info */}
              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#343238] pt-6 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-[#AAA69C]">Customer</p>
                  <p className="mt-1 font-medium text-[#F7F5EF]">{order.customer_name}</p>
                  <p className="text-[#AAA69C]">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#AAA69C]">Fulfillment Details</p>
                  {order.order_type === 'delivery' && order.delivery_address_snapshot && (
                    <p className="mt-1 text-[#F7F5EF]">
                      {order.delivery_address_snapshot.address_line},{' '}
                      {order.delivery_address_snapshot.area}, {order.delivery_address_snapshot.city}
                    </p>
                  )}
                  {order.order_type === 'takeaway' && (
                    <div className="mt-1 text-[#F7F5EF]">
                      <p>{settings.pickup_instructions}</p>
                      {order.pickup_time && (
                        <p className="mt-1 text-xs text-[#E7CB78]">
                          Preferred pickup: {formatDateTime(order.pickup_time, settings.timezone)}
                        </p>
                      )}
                      {order.status === 'ready' && (
                        <p className="mt-1 text-xs font-semibold text-[#4CAF78]">
                          Ready for pickup at counter
                        </p>
                      )}
                    </div>
                  )}
                  {order.order_type === 'dine_in' && (
                    <p className="mt-1 text-[#F7F5EF]">
                      Table:{' '}
                      <span className="font-mono-tabular font-semibold text-[#E7CB78]">
                        {order.table_code_snapshot}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment & Proof Upload */}
            <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
                    Payment Information
                  </h2>
                  <p className="mt-1 text-sm text-[#AAA69C]">
                    {formatPaymentMethod(order.payment_method)}
                  </p>
                </div>
                <PaymentStatusText status={order.payment_status} />
              </div>

              {order.payment_method === 'card_online_demo' && (
                <p className="mt-3 text-xs text-[#E7CB78]">
                  Demo Only — no real charge was processed. Order payment status remains unpaid.
                </p>
              )}

              {isManualPayment && order.payment_status !== 'paid' && (
                <form
                  onSubmit={handleUploadProof}
                  className="mt-5 space-y-4 border-t border-[#343238] pt-4"
                >
                  <p className="text-xs text-[#AAA69C]">
                    Submit or update your transfer reference ID and receipt screenshot for admin
                    verification.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="conf-tx" className="block text-xs font-semibold text-[#F7F5EF]">
                        Transaction Reference *
                      </label>
                      <input
                        id="conf-tx"
                        type="text"
                        required
                        value={txRef}
                        onChange={(e) => setTxRef(e.target.value)}
                        placeholder="e.g. TID-123456"
                        className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                      />
                    </div>
                    <div>
                      <label htmlFor="conf-file" className="block text-xs font-semibold text-[#F7F5EF]">
                        Receipt Screenshot (Optional)
                      </label>
                      <input
                        id="conf-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                        className="mt-1.5 block w-full text-xs text-[#AAA69C]"
                      />
                    </div>
                  </div>
                  {proofErr && <p className="text-xs text-[#E06A6A]">{proofErr}</p>}
                  {proofMsg && <p className="text-xs text-[#4CAF78]">{proofMsg}</p>}
                  <button
                    type="submit"
                    disabled={uploadingProof}
                    className="min-h-10 rounded-md bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] disabled:opacity-50"
                  >
                    {uploadingProof ? 'Submitting...' : 'Submit Payment Proof'}
                  </button>
                </form>
              )}
            </div>

            {/* Items Snapshot & Totals */}
            <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">Order Items</h2>
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
                    <dt className="text-[#AAA69C]">Delivery fee</dt>
                    <dd className="font-mono-tabular text-[#F7F5EF]">
                      {formatCurrency(order.delivery_fee, settings.currency)}
                    </dd>
                  </div>
                )}
                {order.tax_total > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#AAA69C]">Tax</dt>
                    <dd className="font-mono-tabular text-[#F7F5EF]">
                      {formatCurrency(order.tax_total, settings.currency)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#343238] pt-3 text-base font-semibold">
                  <dt className="text-[#F7F5EF]">Grand Total</dt>
                  <dd className="font-mono-tabular text-[#E7CB78]">
                    {formatCurrency(order.grand_total, settings.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Status Timeline */}
            <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-[#F7F5EF]">
                Status History
              </h2>
              <OrderStatusTimeline history={order.status_history} timeZone={settings.timezone} />
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/menu"
                className="inline-flex min-h-10 items-center rounded-md border border-[#343238] bg-[#151518] px-5 py-2 text-xs font-semibold text-[#F7F5EF] hover:border-[#D4AF37]"
              >
                Continue Browsing Menu
              </Link>
              <Link
                to="/track-order"
                className="inline-flex min-h-10 items-center rounded-md border border-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#E7CB78]"
              >
                Track Another Order
              </Link>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
