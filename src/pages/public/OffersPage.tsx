import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { listActiveCoupons } from '../../services/menu.service';
import type { CouponRow } from '../../types/database';

export function OffersPage() {
  const { settings } = useSettings();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listActiveCoupons();
      setCoupons(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Clipboard may be restricted in some environments
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-b border-[#343238] pb-8">
          <p className="text-xs font-medium tracking-wider text-[#D4AF37]">PROMOTIONS &amp; CODES</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#F7F5EF] sm:text-4xl">
            Current Offers
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#AAA69C]">
            Apply eligible coupon codes during cart review or checkout. Final coupon eligibility is
            verified automatically when your order is placed.
          </p>
        </div>

        <div className="mt-8">
          {error ? (
            <FeedbackBanner
              tone="error"
              title="Unable to load offers"
              message={error}
              onRetry={loadOffers}
            />
          ) : loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="h-44 animate-pulse rounded-lg bg-[#151518]" />
              <div className="h-44 animate-pulse rounded-lg bg-[#151518]" />
            </div>
          ) : coupons.length === 0 ? (
            <EmptyState
              title="No active offers right now"
              description="Check back soon or browse our full menu for daily house selections."
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {coupons.map((coupon) => (
                <article
                  key={coupon.id}
                  className="flex flex-col justify-between rounded-lg border border-[#343238] bg-[#151518] p-6"
                >
                  <div>
                    <p className="text-xs text-[#AAA69C]">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}% Off`
                        : `${formatCurrency(coupon.discount_value, settings.currency)} Off`}
                      {coupon.is_demo ? ' · Sample Preview Coupon' : ''}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-4">
                      <h2 className="font-mono-tabular text-2xl font-semibold tracking-wider text-[#E7CB78]">
                        {coupon.code}
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleCopy(coupon.code)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#343238] bg-[#1D1D21] px-3 py-1.5 text-xs font-semibold text-[#F7F5EF] transition-colors hover:border-[#D4AF37] whitespace-nowrap"
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#4CAF78]" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    {coupon.description && (
                      <p className="mt-3 text-sm text-[#AAA69C]">{coupon.description}</p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#343238] pt-4 text-xs text-[#AAA69C]">
                    <span>
                      Min. order: {formatCurrency(coupon.min_order_amount, settings.currency)}
                    </span>
                    {coupon.max_discount_amount !== null && (
                      <span>
                        Max discount:{' '}
                        {formatCurrency(coupon.max_discount_amount, settings.currency)}
                      </span>
                    )}
                    {coupon.expires_at && (
                      <span>
                        Valid until {formatDateTime(coupon.expires_at, settings.timezone)}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
