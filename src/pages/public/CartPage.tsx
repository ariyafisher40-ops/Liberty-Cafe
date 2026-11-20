import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ProductImage } from '../../components/products/ProductImage';
import { getCartLineUnitEstimate, useCart } from '../../features/cart/CartContext';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency } from '../../lib/formatters';
import { validateCouponCodeFormat } from '../../lib/validators';
import { validateCouponEstimate } from '../../services/order.service';

export function CartPage() {
  const { items, subtotalEstimate, updateQuantity, removeItem, clearCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    estimatedDiscount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const formatErr = validateCouponCodeFormat(couponInput);
    if (formatErr) {
      setCouponError(formatErr);
      return;
    }

    setCheckingCoupon(true);
    try {
      const result = await validateCouponEstimate(couponInput, subtotalEstimate);
      setAppliedCoupon({
        code: result.coupon.code,
        estimatedDiscount: result.estimatedDiscount,
      });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : 'Unable to apply coupon.');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const estimatedAfterDiscount = Math.max(
    0,
    subtotalEstimate - (appliedCoupon?.estimatedDiscount ?? 0)
  );

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#343238] pb-6">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#D4AF37]">ORDER REVIEW</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-[#F7F5EF]">
              Your Cart
            </h1>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-medium text-[#AAA69C] underline underline-offset-4 hover:text-[#E06A6A]"
            >
              Clear cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="Your cart is empty"
              description="Add items from the Liberty Cafe menu to begin a Home Delivery, Takeaway, or Dine-in order."
              action={
                <Link
                  to="/menu"
                  className="inline-flex min-h-11 items-center rounded-md bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B0B0D] hover:bg-[#E7CB78]"
                >
                  Browse Menu
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Cart Items List */}
            <div className="space-y-4 lg:col-span-8">
              {items.map((item) => {
                const unitPrice = getCartLineUnitEstimate(item);
                const lineTotal = unitPrice * item.quantity;

                return (
                  <article
                    key={item.cart_item_id}
                    className="flex flex-col gap-4 rounded-lg border border-[#343238] bg-[#151518] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <Link to={`/product/${item.product_slug}`} className="w-24 shrink-0">
                        <ProductImage
                          src={item.image_path}
                          alt={item.product_name}
                          aspectClassName="aspect-[4/3] rounded"
                        />
                      </Link>
                      <div className="min-w-0">
                        <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
                          <Link
                            to={`/product/${item.product_slug}`}
                            className="hover:text-[#E7CB78]"
                          >
                            {item.product_name}
                          </Link>
                        </h2>
                        {item.variant_name && (
                          <p className="mt-0.5 text-xs text-[#AAA69C]">
                            Option: {item.variant_name}
                          </p>
                        )}
                        {item.add_ons.length > 0 && (
                          <p className="mt-0.5 text-xs text-[#AAA69C]">
                            Add-ons: {item.add_ons.map((a) => a.name).join(', ')}
                          </p>
                        )}
                        {item.special_instructions && (
                          <p className="mt-1 text-xs italic text-[#AAA69C]">
                            Note: {item.special_instructions}
                          </p>
                        )}
                        <p className="mt-2 font-mono-tabular text-xs text-[#E7CB78]">
                          {formatCurrency(unitPrice, settings.currency)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="inline-flex items-center rounded-md border border-[#343238] bg-[#0B0B0D]">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.product_name}`}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                          className="flex h-10 w-10 items-center justify-center text-[#F7F5EF] hover:text-[#E7CB78]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono-tabular text-sm font-semibold text-[#F7F5EF]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.product_name}`}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="flex h-10 w-10 items-center justify-center text-[#F7F5EF] hover:text-[#E7CB78]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="min-w-24 text-right font-mono-tabular text-sm font-semibold text-[#F7F5EF]">
                        {formatCurrency(lineTotal, settings.currency)}
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${item.product_name} from cart`}
                        onClick={() => removeItem(item.cart_item_id)}
                        className="rounded p-2 text-[#AAA69C] transition-colors hover:text-[#E06A6A]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Summary Column */}
            <aside className="lg:col-span-4">
              <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
                <h2 className="font-display text-xl font-semibold text-[#F7F5EF]">
                  Estimate Summary
                </h2>

                <form onSubmit={handleApplyCoupon} className="mt-5">
                  <label
                    htmlFor="cart-coupon"
                    className="block text-xs font-semibold text-[#AAA69C]"
                  >
                    Promo / Coupon Code
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="cart-coupon"
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. LIBERTY10"
                      className="min-h-10 flex-1 rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-xs uppercase text-[#F7F5EF] placeholder:normal-case placeholder:text-[#AAA69C]/60 focus:border-[#D4AF37] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={checkingCoupon}
                      className="min-h-10 rounded-md border border-[#D4AF37] px-4 text-xs font-semibold text-[#E7CB78] transition-colors hover:bg-[#D4AF37] hover:text-[#0B0B0D] disabled:opacity-50 whitespace-nowrap"
                    >
                      {checkingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p role="alert" className="mt-2 text-xs text-[#E06A6A]">
                      {couponError}
                    </p>
                  )}
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between text-xs text-[#4CAF78]">
                      <span>Code {appliedCoupon.code} estimated</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponInput('');
                        }}
                        className="underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </form>

                <dl className="mt-6 space-y-3 border-t border-[#343238] pt-5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-[#AAA69C]">Subtotal estimate</dt>
                    <dd className="font-mono-tabular text-[#F7F5EF]">
                      {formatCurrency(subtotalEstimate, settings.currency)}
                    </dd>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-[#4CAF78]">
                      <dt>Discount estimate ({appliedCoupon.code})</dt>
                      <dd className="font-mono-tabular">
                        -{formatCurrency(appliedCoupon.estimatedDiscount, settings.currency)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-[#343238] pt-3 font-semibold">
                    <dt className="text-[#F7F5EF]">Estimated total (before delivery/tax)</dt>
                    <dd className="font-mono-tabular text-[#E7CB78]">
                      {formatCurrency(estimatedAfterDiscount, settings.currency)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 text-xs leading-relaxed text-[#AAA69C]">
                  Final prices, delivery zone fees, taxes, and coupon eligibility are verified on
                  the backend when placing your order.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/checkout', {
                      state: { couponCode: appliedCoupon?.code ?? '' },
                    })
                  }
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B0B0D] transition-colors hover:bg-[#E7CB78]"
                >
                  <span>Continue to Checkout</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </aside>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8">
            <FeedbackBanner
              tone="info"
              message="Cart selections stay saved in your browser while you browse. No payment credentials or authoritative totals are stored locally."
            />
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
