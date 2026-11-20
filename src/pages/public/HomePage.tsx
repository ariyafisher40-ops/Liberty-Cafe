import { ArrowRight, Clock, MapPin, Phone, Utensils } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackBanner, LoadingGridSkeleton } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductImage } from '../../components/products/ProductImage';
import {
  ABOUT_INTERIOR_IMAGE,
  HERO_BANNER_IMAGE,
  PROMO_COFFEE_DESSERT_IMAGE,
} from '../../data/demoSeed';
import { useSettings } from '../../features/settings/SettingsContext';
import { getHomePageData } from '../../services/menu.service';
import type { HomePageData } from '../../types/domain';

export function HomePage() {
  const { settings } = useSettings();
  const [data, setData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHomePageData();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load storefront.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const heroBanner = data?.hero_banners[0];
  const promoBanner = data?.promo_banners[0];

  return (
    <PublicLayout>
      {/* 1. Luxury Hero Section */}
      <section className="relative overflow-hidden border-b border-[#343238]">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-medium tracking-[0.2em] text-[#D4AF37]">
                LIBERTY CAFE · HOUSE ROASTERY &amp; KITCHEN
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] text-[#F7F5EF] sm:text-5xl lg:text-[3.5rem]">
                {heroBanner?.title || 'Crafted Espresso & Evening Dining'}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#AAA69C]">
                {heroBanner?.subtitle ||
                  'Small-batch espresso roasts, artisan burgers, and wood-fired classics prepared for Home Delivery, Takeaway, and Dine-in.'}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to={heroBanner?.cta_path || '/menu'}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B0B0D] transition-colors hover:bg-[#E7CB78] whitespace-nowrap shrink-0"
                >
                  <span>{heroBanner?.cta_label || 'Explore Menu'}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/track-order"
                  className="inline-flex min-h-11 items-center rounded-md border border-[#343238] bg-[#151518] px-5 py-3 text-sm font-medium text-[#F7F5EF] transition-colors hover:border-[#D4AF37]/60 whitespace-nowrap shrink-0"
                >
                  Track an Order
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full overflow-hidden rounded-lg border border-[#343238] bg-[#151518]">
                <ProductImage
                  src={heroBanner?.image_path || HERO_BANNER_IMAGE}
                  bucket="banner-images"
                  alt="Liberty Cafe espresso cup and plated evening dessert on black slate"
                  aspectClassName="aspect-[16/9] lg:h-full lg:aspect-auto"
                  lazy={false}
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0D]/60 via-transparent to-transparent"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* 3-Mode Ordering Strip */}
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#343238] bg-[#343238] sm:grid-cols-3">
            <div className="bg-[#151518] p-5">
              <p className="text-xs font-semibold tracking-wider text-[#D4AF37]">01. Home Delivery</p>
              <p className="mt-1.5 text-sm text-[#AAA69C]">
                Direct delivery within admin-configured service zones with transparent zone fees.
              </p>
            </div>
            <div className="bg-[#151518] p-5">
              <p className="text-xs font-semibold tracking-wider text-[#D4AF37]">
                02. Takeaway / Pickup
              </p>
              <p className="mt-1.5 text-sm text-[#AAA69C]">
                Order ahead with your preferred pickup time and collect fresh from our counter.
              </p>
            </div>
            <div className="bg-[#151518] p-5">
              <p className="text-xs font-semibold tracking-wider text-[#D4AF37]">03. Dine-in</p>
              <p className="mt-1.5 text-sm text-[#AAA69C]">
                Select your cafe table code when ordering from the dining room.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <FeedbackBanner tone="error" title="Catalogue Error" message={error} onRetry={loadData} />
        </div>
      )}

      {/* 2. Categories Strip */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#D4AF37]">CURATED COLLECTIONS</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#F7F5EF] sm:text-3xl">
              Explore by Category
            </h2>
          </div>
          <Link
            to="/menu"
            className="text-sm font-medium text-[#E7CB78] underline underline-offset-4 hover:text-[#F7F5EF]"
          >
            View full menu
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {(data?.categories ?? []).map((cat) => {
            const count = data?.category_counts?.[cat.id] ?? 0;
            return (
              <Link
                key={cat.id}
                to={`/menu/${cat.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-[#343238] bg-[#151518] transition-colors hover:border-[#D4AF37]/60"
              >
                <ProductImage
                  src={cat.image_path}
                  bucket="category-images"
                  alt={cat.name}
                  placeholderType="category"
                  aspectClassName="aspect-[4/3]"
                  className="group-hover:[&_img]:scale-[1.04]"
                />
                <div className="p-3 text-center">
                  <span className="block truncate text-xs font-semibold text-[#F7F5EF] group-hover:text-[#E7CB78]">
                    {cat.name}
                  </span>
                  <span className="mt-0.5 block font-mono-tabular text-[11px] text-[#AAA69C]">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="border-t border-[#343238]/60 bg-[#0B0B0D]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-[#D4AF37]">HOUSE SELECTION</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#F7F5EF] sm:text-3xl">
                Featured Dishes &amp; Coffee
              </h2>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E7CB78] hover:underline"
            >
              <span>Browse all items</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8">
            {loading ? (
              <LoadingGridSkeleton count={3} />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(data?.featured_products ?? []).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Best Sellers & Promotional Banner */}
      <section className="border-t border-[#343238]/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-12 overflow-hidden rounded-lg border border-[#343238] bg-[#151518]">
            <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
              <div className="lg:col-span-6">
                <ProductImage
                  src={promoBanner?.image_path || PROMO_COFFEE_DESSERT_IMAGE}
                  bucket="banner-images"
                  alt="Artisan cappuccino beside warm dark chocolate brownie"
                  aspectClassName="aspect-[16/9] lg:h-full lg:aspect-auto"
                />
              </div>
              <div className="flex flex-col justify-center p-8 lg:col-span-6 lg:p-12">
                <p className="text-xs font-medium tracking-wider text-[#D4AF37]">
                  SEASONAL OFFER{promoBanner?.is_demo ? ' · SAMPLE PREVIEW' : ''}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#F7F5EF] sm:text-3xl">
                  {promoBanner?.title || 'Evening Coffee & Dessert Pairing'}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#AAA69C]">
                  {promoBanner?.subtitle ||
                    'Explore active promo codes and dining offers configured by Liberty Cafe.'}
                </p>
                <div className="mt-6">
                  <Link
                    to={promoBanner?.cta_path || '/offers'}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#E7CB78] transition-colors hover:bg-[#D4AF37] hover:text-[#0B0B0D] whitespace-nowrap"
                  >
                    <span>{promoBanner?.cta_label || 'View Offers'}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-[#D4AF37]">GUEST FAVORITES</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#F7F5EF] sm:text-3xl">
                Best Sellers
              </h2>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.best_sellers ?? []).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. About & Cafe Location / Hours Block */}
      <section className="border-t border-[#343238] bg-[#151518]/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="h-full overflow-hidden rounded-lg border border-[#343238]">
                <ProductImage
                  src={ABOUT_INTERIOR_IMAGE}
                  alt="Liberty Cafe evening dining room and brass espresso bar"
                  aspectClassName="aspect-[4/3] lg:h-full lg:aspect-auto"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="text-xs font-medium tracking-wider text-[#D4AF37]">OUR SPACE</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F7F5EF]">
                Quiet Hospitality, Crafted Daily
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#AAA69C]">
                Liberty Cafe brings together freshly pulled espresso, house-grilled classics, and
                unhurried table service. Whether dining inside, picking up on your commute, or
                ordering home delivery, every order is prepared to order.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-5 border-t border-[#343238] pt-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                  <div className="text-sm">
                    <p className="font-semibold text-[#F7F5EF]">Location</p>
                    <p className="text-[#AAA69C]">{settings.address}</p>
                    <p className="text-[#AAA69C]">{settings.city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                  <div className="text-sm">
                    <p className="font-semibold text-[#F7F5EF]">Opening Hours</p>
                    <p className="text-[#AAA69C]">{settings.opening_hours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                  <div className="text-sm">
                    <p className="font-semibold text-[#F7F5EF]">Direct Contact</p>
                    <p className="text-[#AAA69C]">{settings.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Utensils className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                  <div className="text-sm">
                    <p className="font-semibold text-[#F7F5EF]">Service Modes</p>
                    <p className="text-[#AAA69C]">Delivery · Takeaway · Dine-in</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/about"
                  className="inline-flex min-h-10 items-center rounded-md border border-[#343238] bg-[#151518] px-5 py-2.5 text-xs font-semibold text-[#F7F5EF] transition-colors hover:border-[#D4AF37]"
                >
                  About Liberty Cafe
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex min-h-10 items-center rounded-md border border-[#343238] bg-[#151518] px-5 py-2.5 text-xs font-semibold text-[#F7F5EF] transition-colors hover:border-[#D4AF37]"
                >
                  Contact &amp; Hours
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
