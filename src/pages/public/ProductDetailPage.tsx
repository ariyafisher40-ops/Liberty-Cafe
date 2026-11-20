import { ArrowLeft, Minus, Plus, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ProductImage } from '../../components/products/ProductImage';
import { useCart } from '../../features/cart/CartContext';
import { useSettings } from '../../features/settings/SettingsContext';
import { env } from '../../lib/env';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { getProductBySlug, listPublishedProductReviews } from '../../services/menu.service';
import type { ProductWithDetails, ReviewWithDetails } from '../../types/domain';

export function ProductDetailPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { addToCart } = useCart();
  const { settings } = useSettings();

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!productSlug) return;
    setLoading(true);
    setError(null);
    try {
      const item = await getProductBySlug(productSlug);
      setProduct(item);
      if (item) {
        const firstAvail = item.variants.find((v) => v.is_available) ?? item.variants[0] ?? null;
        setSelectedVariantId(firstAvail?.id ?? null);
        setSelectedAddOnIds([]);
        setQuantity(1);
        setInstructions('');
        const revs = await listPublishedProductReviews(item.id);
        setReviews(revs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load product details.');
    } finally {
      setLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const selectedVariant = useMemo(
    () => product?.variants.find((v) => v.id === selectedVariantId) ?? null,
    [product, selectedVariantId]
  );

  const selectedAddOns = useMemo(
    () => product?.add_ons.filter((a) => selectedAddOnIds.includes(a.id)) ?? [],
    [product, selectedAddOnIds]
  );

  const unitEstimate = useMemo(() => {
    if (!product) return 0;
    const addOnTotal = selectedAddOns.reduce((sum, a) => sum + Number(a.price), 0);
    return Number(product.base_price) + Number(selectedVariant?.price_delta ?? 0) + addOnTotal;
  }, [product, selectedVariant, selectedAddOns]);

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    if (!product || !product.is_available) return;
    addToCart({
      product,
      variant: selectedVariant,
      addOns: selectedAddOns.map((a) => ({
        add_on_id: a.id,
        name: a.name,
        price: Number(a.price),
      })),
      quantity,
      specialInstructions: instructions,
    });
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#AAA69C] transition-colors hover:text-[#E7CB78]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Menu</span>
        </Link>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="aspect-[4/3] animate-pulse rounded-lg bg-[#151518] lg:col-span-6" />
            <div className="space-y-4 lg:col-span-6">
              <div className="h-4 w-32 animate-pulse rounded bg-[#151518]" />
              <div className="h-9 w-3/4 animate-pulse rounded bg-[#151518]" />
              <div className="h-24 w-full animate-pulse rounded bg-[#151518]" />
            </div>
          </div>
        ) : error ? (
          <div className="mt-8">
            <FeedbackBanner
              tone="error"
              title="Unable to load product"
              message={error}
              onRetry={loadProduct}
            />
          </div>
        ) : !product ? (
          <div className="mt-8">
            <EmptyState
              title="Dish not found"
              description="The requested menu item could not be found or is no longer available."
              action={
                <Link
                  to="/menu"
                  className="inline-flex min-h-10 items-center rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
                >
                  Return to Menu
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
              {/* Left Gallery */}
              <div className="lg:col-span-6">
                <div className="sticky top-24 overflow-hidden rounded-lg border border-[#343238] bg-[#151518]">
                  <ProductImage
                    src={product.image_path}
                    alt={product.name}
                    aspectClassName="aspect-[4/3]"
                    lazy={false}
                  />
                </div>
              </div>

              {/* Right Contiguous Purchase Module */}
              <div className="lg:col-span-6">
                <div className="rounded-lg border border-[#343238] bg-[#151518] p-6 sm:p-8">
                  <p className="text-xs font-medium tracking-wider text-[#AAA69C]">
                    {[
                      product.category?.name,
                      product.is_available ? 'Available' : 'Currently Sold Out',
                      product.is_demo && env.enableDemoMenuBadge ? 'Sample Menu Item' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  <h1 className="mt-2 font-display text-3xl font-semibold text-[#F7F5EF] sm:text-4xl">
                    {product.name}
                  </h1>

                  <p className="mt-3 font-mono-tabular text-2xl font-semibold text-[#E7CB78]">
                    {formatCurrency(unitEstimate, settings.currency)}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed text-[#AAA69C]">
                    {product.description || product.short_description}
                  </p>

                  {/* Variants */}
                  {product.variants.length > 0 && (
                    <fieldset className="mt-7 border-t border-[#343238] pt-6">
                      <legend className="text-xs font-semibold tracking-wider text-[#F7F5EF]">
                        Select Option / Size
                      </legend>
                      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {product.variants.map((variant) => {
                          const checked = selectedVariant?.id === variant.id;
                          return (
                            <label
                              key={variant.id}
                              className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors ${
                                !variant.is_available
                                  ? 'cursor-not-allowed border-[#343238]/50 opacity-50'
                                  : checked
                                  ? 'border-[#D4AF37] bg-[#1D1D21] text-[#F7F5EF]'
                                  : 'border-[#343238] bg-[#0B0B0D] text-[#AAA69C] hover:border-[#D4AF37]/50'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="product_variant"
                                  disabled={!variant.is_available}
                                  checked={checked}
                                  onChange={() => setSelectedVariantId(variant.id)}
                                  className="accent-[#D4AF37]"
                                />
                                <span>{variant.name}</span>
                              </span>
                              <span className="font-mono-tabular text-xs text-[#E7CB78]">
                                {variant.price_delta > 0
                                  ? `+${formatCurrency(variant.price_delta, settings.currency)}`
                                  : 'Included'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {/* Add-ons */}
                  {product.add_ons.length > 0 && (
                    <fieldset className="mt-6 border-t border-[#343238] pt-6">
                      <legend className="text-xs font-semibold tracking-wider text-[#F7F5EF]">
                        Optional Add-ons
                      </legend>
                      <div className="mt-3 space-y-2.5">
                        {product.add_ons.map((addOn) => {
                          const checked = selectedAddOnIds.includes(addOn.id);
                          return (
                            <label
                              key={addOn.id}
                              className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors ${
                                !addOn.is_available
                                  ? 'cursor-not-allowed border-[#343238]/50 opacity-50'
                                  : checked
                                  ? 'border-[#D4AF37] bg-[#1D1D21] text-[#F7F5EF]'
                                  : 'border-[#343238] bg-[#0B0B0D] text-[#AAA69C] hover:border-[#D4AF37]/50'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  disabled={!addOn.is_available}
                                  checked={checked}
                                  onChange={() => toggleAddOn(addOn.id)}
                                  className="h-4 w-4 accent-[#D4AF37]"
                                />
                                <span>{addOn.name}</span>
                              </span>
                              <span className="font-mono-tabular text-xs text-[#E7CB78]">
                                +{formatCurrency(addOn.price, settings.currency)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {/* Special Instructions */}
                  <div className="mt-6 border-t border-[#343238] pt-6">
                    <label
                      htmlFor="special-instructions"
                      className="block text-xs font-semibold tracking-wider text-[#F7F5EF]"
                    >
                      Special Kitchen Instructions (Optional)
                    </label>
                    <textarea
                      id="special-instructions"
                      rows={2}
                      maxLength={240}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Allergy notes or preparation preferences..."
                      className="mt-2 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 py-2.5 text-sm text-[#F7F5EF] placeholder:text-[#AAA69C]/60 focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  {/* Quantity & Add CTA */}
                  <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-[#343238] pt-6">
                    <div className="inline-flex items-center rounded-md border border-[#343238] bg-[#0B0B0D]">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={!product.is_available || quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-11 w-11 items-center justify-center text-[#F7F5EF] disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-mono-tabular text-sm font-semibold text-[#F7F5EF]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={!product.is_available || quantity >= 50}
                        onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                        className="flex h-11 w-11 items-center justify-center text-[#F7F5EF] disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!product.is_available}
                      onClick={handleAddToCart}
                      className="flex-1 min-h-11 rounded-md bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B0B0D] transition-colors hover:bg-[#E7CB78] disabled:cursor-not-allowed disabled:bg-[#343238] disabled:text-[#AAA69C] whitespace-nowrap"
                    >
                      {product.is_available
                        ? `Add to Cart · ${formatCurrency(unitEstimate * quantity, settings.currency)}`
                        : 'Currently Sold Out'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Published Reviews */}
            <section className="mt-16 border-t border-[#343238] pt-12">
              <h2 className="font-display text-2xl font-semibold text-[#F7F5EF]">
                Customer Reviews
              </h2>
              {reviews.length === 0 ? (
                <p className="mt-3 text-sm text-[#AAA69C]">
                  No published reviews for this item yet. Signed-in guests can submit a review from
                  their completed order history.
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {reviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="rounded-lg border border-[#343238] bg-[#151518] p-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[#D4AF37]">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="h-4 w-4 fill-current" aria-hidden="true" />
                          ))}
                          <span className="ml-2 font-mono-tabular text-xs text-[#AAA69C]">
                            {rev.rating}/5
                          </span>
                        </div>
                        <time className="text-xs text-[#AAA69C]">
                          {formatDateTime(rev.created_at, settings.timezone)}
                        </time>
                      </div>
                      {rev.title && (
                        <h3 className="mt-3 font-semibold text-[#F7F5EF]">{rev.title}</h3>
                      )}
                      {rev.comment && (
                        <p className="mt-1.5 text-sm text-[#AAA69C]">{rev.comment}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
