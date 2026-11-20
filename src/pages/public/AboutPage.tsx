import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ProductImage } from '../../components/products/ProductImage';
import { ABOUT_INTERIOR_IMAGE } from '../../data/demoSeed';
import { useSettings } from '../../features/settings/SettingsContext';

export function AboutPage() {
  const { settings } = useSettings();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-xs font-medium tracking-wider text-[#D4AF37]">ABOUT LIBERTY CAFE</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-[#F7F5EF] sm:text-4xl">
              An Unhurried Evening Cafe &amp; Kitchen
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-[#AAA69C]">
              {settings.restaurant_name || 'Liberty Cafe'} is designed around balanced espresso
              extraction, thoughtfully sourced kitchen classics, and warm evening hospitality.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#AAA69C]">
              Every dish is prepared fresh when your order is confirmed—whether you are seated at a
              table in our dining room, collecting takeaway on your way home, or ordering delivery
              within our active service zones.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#343238] pt-6 sm:grid-cols-2">
              <div>
                <h2 className="text-xs font-semibold tracking-wider text-[#D4AF37]">
                  PREPARED TO ORDER
                </h2>
                <p className="mt-1.5 text-sm text-[#AAA69C]">
                  Customizable sizes, toppings, and kitchen instructions tracked from confirmation
                  to handoff.
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold tracking-wider text-[#D4AF37]">
                  FLEXIBLE ORDERING
                </h2>
                <p className="mt-1.5 text-sm text-[#AAA69C]">
                  Seamless support for Home Delivery, Takeaway Pickup, and Dine-in table service.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/menu"
                className="inline-flex min-h-11 items-center rounded-md bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B0B0D] hover:bg-[#E7CB78]"
              >
                Explore the Menu
              </Link>
              <Link
                to="/contact"
                className="inline-flex min-h-11 items-center rounded-md border border-[#343238] bg-[#151518] px-5 py-2.5 text-sm font-medium text-[#F7F5EF] hover:border-[#D4AF37]"
              >
                Contact &amp; Hours
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full overflow-hidden rounded-lg border border-[#343238]">
              <ProductImage
                src={ABOUT_INTERIOR_IMAGE}
                alt="Liberty Cafe dark architectural dining interior"
                aspectClassName="aspect-[4/3] lg:h-full lg:aspect-auto"
                lazy={false}
              />
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
