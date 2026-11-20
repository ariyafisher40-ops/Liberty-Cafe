import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../features/cart/CartContext';
import { useSettings } from '../../features/settings/SettingsContext';
import { env } from '../../lib/env';
import { formatCurrency } from '../../lib/formatters';
import type { ProductWithDetails } from '../../types/domain';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: ProductWithDetails;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { settings } = useSettings();

  const defaultVariant =
    product.variants.find((v) => v.is_available) ?? product.variants[0] ?? null;
  const displayPrice =
    Number(product.base_price) + Number(defaultVariant?.price_delta ?? 0);

  const metaParts: string[] = [];
  if (product.category?.name) metaParts.push(product.category.name);
  if (product.is_best_seller) metaParts.push('Best Seller');
  else if (product.is_featured) metaParts.push('Featured');
  if (!product.is_available) metaParts.push('Unavailable');
  else if (product.is_demo && env.enableDemoMenuBadge) metaParts.push('Sample Menu');

  const handleQuickAdd = () => {
    if (!product.is_available) return;
    addToCart({
      product,
      variant: defaultVariant,
      addOns: [],
      quantity: 1,
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-[#343238] bg-[#151518] transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:border-[#D4AF37]/45">
      <Link
        to={`/product/${product.slug}`}
        className="block overflow-hidden focus-visible:outline-offset-0"
      >
        <ProductImage
          src={product.image_path}
          alt={product.name}
          aspectClassName="aspect-[4/3]"
          className="group-hover:[&_img]:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {metaParts.length > 0 && (
            <p
              className={`text-xs tracking-wide ${
                !product.is_available ? 'text-[#E06A6A]' : 'text-[#AAA69C]'
              }`}
            >
              {metaParts.join(' · ')}
            </p>
          )}

          <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-[#F7F5EF]">
            <Link
              to={`/product/${product.slug}`}
              className="transition-colors hover:text-[#E7CB78]"
            >
              {product.name}
            </Link>
          </h3>

          {product.short_description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#AAA69C]">
              {product.short_description}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#343238]/70 pt-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-mono-tabular text-sm font-semibold text-[#E7CB78]">
                {formatCurrency(displayPrice, settings.currency)}
              </span>
              {product.compare_at_price !== null &&
                Number(product.compare_at_price) > displayPrice && (
                  <span className="font-mono-tabular text-xs text-[#AAA69C] line-through">
                    {formatCurrency(product.compare_at_price, settings.currency)}
                  </span>
                )}
            </div>
            {product.variants.length > 0 && (
              <span className="text-[11px] text-[#AAA69C]">
                {product.variants.length} size options
              </span>
            )}
          </div>

          {product.is_available ? (
            product.variants.length > 1 || product.add_ons.length > 0 ? (
              <Link
                to={`/product/${product.slug}`}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#D4AF37]/60 px-4 py-2 text-xs font-semibold text-[#F7F5EF] transition-colors hover:bg-[#D4AF37] hover:text-[#0B0B0D] whitespace-nowrap shrink-0"
              >
                Select Options
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0B0B0D] transition-colors hover:bg-[#E7CB78] whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            )
          ) : (
            <span className="text-xs font-medium text-[#E06A6A] whitespace-nowrap shrink-0">
              Currently Sold Out
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
