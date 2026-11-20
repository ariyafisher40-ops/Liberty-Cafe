import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  EmptyState,
  FeedbackBanner,
  LoadingGridSkeleton,
} from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ProductCard } from '../../components/products/ProductCard';
import {
  listActiveCategories,
  listMenuProducts,
  type MenuSortOption,
} from '../../services/menu.service';
import type { CategoryRow } from '../../types/database';
import type { ProductWithDetails } from '../../types/domain';

const PAGE_SIZE = 24;

export function MenuPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [allProducts, setAllProducts] = useState<ProductWithDetails[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<MenuSortOption>('featured');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, items] = await Promise.all([
        listActiveCategories(),
        listMenuProducts({ sort: 'featured' }),
      ]);
      setCategories(cats);
      setAllProducts(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load menu items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [categorySlug, search, sort, onlyAvailable]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProducts) {
      if (onlyAvailable && !p.is_available) continue;
      counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
    }
    return counts;
  }, [allProducts, onlyAvailable]);

  const totalBaseCount = useMemo(() => {
    return onlyAvailable
      ? allProducts.filter((p) => p.is_available).length
      : allProducts.length;
  }, [allProducts, onlyAvailable]);

  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    if (categorySlug) {
      list = list.filter((p) => p.category?.slug === categorySlug);
    }
    if (onlyAvailable) {
      list = list.filter((p) => p.is_available);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.short_description ?? '').toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.category?.name ?? '').toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => Number(a.base_price) - Number(b.base_price));
        break;
      case 'price_desc':
        list.sort((a, b) => Number(b.base_price) - Number(a.base_price));
        break;
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list.sort((a, b) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          return a.sort_order - b.sort_order;
        });
    }

    return list;
  }, [allProducts, categorySlug, onlyAvailable, search, sort]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const hasMore = displayedProducts.length < filteredProducts.length;
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#343238] pb-8">
          <div>
            <p className="text-xs font-medium tracking-wider text-[#D4AF37]">CULINARY MENU</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-[#F7F5EF] sm:text-4xl">
              {activeCategory ? activeCategory.name : 'All Menu Selections'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#AAA69C]">
              {activeCategory?.description ||
                'Explore burgers, stone-baked pizzas, fried chicken, shawarmas, pasta, freshly pulled espresso, and desserts.'}
            </p>
          </div>

          <p className="font-mono-tabular text-xs text-[#AAA69C]">
            {loading
              ? 'Loading catalogue...'
              : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'items'} available to browse`}
          </p>
        </div>

        {/* Search, Category Dropdown, Sort & Availability Controls */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <label htmlFor="menu-search" className="sr-only">
                Search menu items
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AAA69C]"
                aria-hidden="true"
              />
              <input
                id="menu-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 150 menu items..."
                className="min-h-11 w-full rounded-md border border-[#343238] bg-[#151518] pl-10 pr-4 text-sm text-[#F7F5EF] placeholder:text-[#AAA69C]/70 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="sm:w-56">
              <label htmlFor="menu-category-select" className="sr-only">
                Category filter
              </label>
              <select
                id="menu-category-select"
                value={categorySlug ?? ''}
                onChange={(e) =>
                  navigate(e.target.value ? `/menu/${e.target.value}` : '/menu')
                }
                className="min-h-11 w-full rounded-md border border-[#343238] bg-[#151518] px-3 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">All Categories ({totalBaseCount})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name} ({categoryCounts[cat.id] ?? 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#AAA69C]">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-[#343238] bg-[#151518] accent-[#D4AF37]"
              />
              <span>Available only</span>
            </label>

            <div className="flex items-center gap-2">
              <label htmlFor="menu-sort" className="text-xs text-[#AAA69C] whitespace-nowrap">
                Sort by
              </label>
              <select
                id="menu-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as MenuSortOption)}
                className="min-h-10 rounded-md border border-[#343238] bg-[#151518] px-3 text-xs font-medium text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="featured">Featured &amp; Order</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter menu by category"
          className="mt-6 flex items-center gap-2 overflow-x-auto pb-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!categorySlug}
            onClick={() => navigate('/menu')}
            className={`min-h-9 rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              !categorySlug
                ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0B0B0D]'
                : 'border-[#343238] bg-[#151518] text-[#AAA69C] hover:border-[#D4AF37]/50 hover:text-[#F7F5EF]'
            }`}
          >
            All ({totalBaseCount})
          </button>

          {categories.map((cat) => {
            const active = categorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => navigate(`/menu/${cat.slug}`)}
                className={`min-h-9 rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0B0B0D]'
                    : 'border-[#343238] bg-[#151518] text-[#AAA69C] hover:border-[#D4AF37]/50 hover:text-[#F7F5EF]'
                }`}
              >
                {cat.name} ({categoryCounts[cat.id] ?? 0})
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-[#AAA69C]">
          Displayed sample menu prices in PKR are illustrative until confirmed by Liberty Cafe
          management.
        </p>

        {/* Results */}
        <div className="mt-6">
          {error ? (
            <FeedbackBanner
              tone="error"
              title="Unable to load menu"
              message={error}
              onRetry={loadMenu}
            />
          ) : loading ? (
            <LoadingGridSkeleton count={6} />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="No menu items found"
              description={
                search.trim()
                  ? `No items matched "${search}". Try clearing your search or viewing all menu items.`
                  : 'There are currently no items available in this category.'
              }
              action={
                <Link
                  to="/menu"
                  onClick={() => {
                    setSearch('');
                    setOnlyAvailable(false);
                  }}
                  className="inline-flex min-h-10 items-center rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D] hover:bg-[#E7CB78]"
                >
                  View All Menu Items
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination / Load More Controls */}
              <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#343238] pt-6 sm:flex-row">
                <p className="font-mono-tabular text-xs text-[#AAA69C]">
                  Showing {displayedProducts.length} of {filteredProducts.length} items
                </p>

                {hasMore && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((prev) =>
                          Math.min(prev + PAGE_SIZE, filteredProducts.length)
                        )
                      }
                      className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D] transition-colors hover:bg-[#E7CB78]"
                    >
                      Load {Math.min(PAGE_SIZE, filteredProducts.length - displayedProducts.length)}{' '}
                      More Items
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleCount(filteredProducts.length)}
                      className="min-h-10 rounded-md border border-[#343238] bg-[#151518] px-4 py-2 text-xs font-medium text-[#F7F5EF] transition-colors hover:border-[#D4AF37]"
                    >
                      Show All ({filteredProducts.length})
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
