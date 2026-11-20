import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ProductImage } from '../../components/products/ProductImage';
import { useSettings } from '../../features/settings/SettingsContext';
import { env } from '../../lib/env';
import { formatCurrency } from '../../lib/formatters';
import {
  adminDeleteProduct,
  adminListAllProducts,
  adminListCategories,
  adminSaveProduct,
} from '../../services/admin.service';
import type { CategoryRow } from '../../types/database';
import type { ProductWithDetails } from '../../types/domain';

const ADMIN_PAGE_SIZE = 25;

export function AdminProductsPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>(
    'all'
  );
  const [demoFilter, setDemoFilter] = useState<'all' | 'demo' | 'custom'>('all');
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithDetails | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, cats] = await Promise.all([adminListAllProducts(), adminListCategories()]);
      setProducts(list);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, availabilityFilter, demoFilter]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      map[p.category_id] = (map[p.category_id] ?? 0) + 1;
    }
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
      if (availabilityFilter === 'available' && !p.is_available) return false;
      if (availabilityFilter === 'unavailable' && p.is_available) return false;
      if (demoFilter === 'demo' && !p.is_demo) return false;
      if (demoFilter === 'custom' && p.is_demo) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.category?.name ?? '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [products, categoryFilter, availabilityFilter, demoFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ADMIN_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = useMemo(() => {
    if (showAll) return filteredProducts;
    const start = (currentPage - 1) * ADMIN_PAGE_SIZE;
    return filteredProducts.slice(start, start + ADMIN_PAGE_SIZE);
  }, [filteredProducts, showAll, currentPage]);

  const demoCount = useMemo(() => products.filter((p) => p.is_demo).length, [products]);
  const availableCount = useMemo(() => products.filter((p) => p.is_available).length, [products]);

  const handleToggleAvailable = async (p: ProductWithDetails, nextState = !p.is_available) => {
    setBusyAction(true);
    setError(null);
    setNotice(null);
    try {
      await adminSaveProduct({
        id: p.id,
        category_id: p.category_id,
        name: p.name,
        slug: p.slug,
        short_description: p.short_description ?? '',
        description: p.description ?? '',
        image_path: p.image_path,
        base_price: Number(p.base_price),
        compare_at_price: p.compare_at_price,
        is_featured: p.is_featured,
        is_best_seller: p.is_best_seller,
        is_available: nextState,
        is_demo: p.is_demo,
        sort_order: p.sort_order,
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price_delta: Number(v.price_delta),
          is_available: v.is_available,
          sort_order: v.sort_order,
        })),
        add_on_ids: p.add_ons.map((a) => a.id),
      });
      setNotice(
        `"${p.name}" marked ${nextState ? 'available' : 'unavailable'}.`
      );
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update availability.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleMarkUnavailableFromDialog = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await handleToggleAvailable(target, false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyAction(true);
    setError(null);
    setNotice(null);
    try {
      const deletedName = deleteTarget.name;
      await adminDeleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      setNotice(
        `"${deletedName}" deleted from the live menu. Historical order snapshots remain preserved.`
      );
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete product.');
      setDeleteTarget(null);
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <AdminLayout
      title="Products"
      subtitle="Manage menu items, illustrative demo flags, availability, and PKR pricing."
      action={
        <Link
          to="/admin/products/new"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Add Product</span>
        </Link>
      }
    >
      {!env.isSupabaseConfigured && (
        <div className="mb-5 rounded-lg border border-[#343238] bg-[#151518] p-4 text-xs text-[#AAA69C]">
          Local preview mode active: edits, availability toggles, additions, and deletions persist in
          browser preview storage. Connect Supabase with RLS policies for live multi-user database
          persistence.
        </div>
      )}

      {error && (
        <div className="mb-5">
          <FeedbackBanner tone="error" message={error} onRetry={loadProducts} />
        </div>
      )}
      {notice && (
        <div className="mb-5">
          <FeedbackBanner tone="success" message={notice} />
        </div>
      )}

      {/* Summary Counts */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#AAA69C]">Total Products</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#F7F5EF]">
            {products.length}
          </p>
        </div>
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#AAA69C]">Available</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#4CAF78]">
            {availableCount}
          </p>
        </div>
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#AAA69C]">Demo Flagged</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#E7CB78]">
            {demoCount}
          </p>
        </div>
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#AAA69C]">Filtered Match</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#F7F5EF]">
            {filteredProducts.length}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-[#343238] bg-[#151518] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <label htmlFor="admin-prod-search" className="sr-only">
            Search products
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AAA69C]"
            aria-hidden="true"
          />
          <input
            id="admin-prod-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or slug..."
            className="min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] pl-9 pr-3 text-xs text-[#F7F5EF] placeholder:text-[#AAA69C]/60 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="admin-cat-filter" className="sr-only">
            Filter by category
          </label>
          <select
            id="admin-cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-xs text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({categoryCounts[cat.id] ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-avail-filter" className="sr-only">
            Filter by availability
          </label>
          <select
            id="admin-avail-filter"
            value={availabilityFilter}
            onChange={(e) =>
              setAvailabilityFilter(e.target.value as 'all' | 'available' | 'unavailable')
            }
            className="min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-xs text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="all">All Availability</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Unavailable Only</option>
          </select>
        </div>

        <div>
          <label htmlFor="admin-demo-filter" className="sr-only">
            Filter by demo flag
          </label>
          <select
            id="admin-demo-filter"
            value={demoFilter}
            onChange={(e) => setDemoFilter(e.target.value as 'all' | 'demo' | 'custom')}
            className="min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-xs text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="all">All Source Types</option>
            <option value="demo">Demo Seed Items Only</option>
            <option value="custom">Custom Cafe Items Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-lg bg-[#151518]" />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="No matching products"
          description={
            products.length === 0
              ? 'Create your first menu product to display it on the Liberty Cafe storefront.'
              : 'Adjust your search term or category filters to view products.'
          }
          action={
            products.length === 0 ? (
              <Link
                to="/admin/products/new"
                className="inline-flex min-h-10 items-center rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
              >
                Add Product
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                  setAvailabilityFilter('all');
                  setDemoFilter('all');
                }}
                className="inline-flex min-h-10 items-center rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
              >
                Reset Filters
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#343238] bg-[#151518]">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-[#343238] text-xs text-[#AAA69C]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status &amp; Flags</th>
                  <th className="px-4 py-3 text-right font-semibold">Base Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343238]/60">
                {visibleProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#1D1D21]/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 shrink-0 overflow-hidden rounded border border-[#343238]">
                          <ProductImage
                            src={product.image_path}
                            alt={product.name}
                            aspectClassName="aspect-[4/3]"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-[#F7F5EF]">{product.name}</p>
                          <p className="text-xs text-[#AAA69C]">
                            /{product.slug} ·{' '}
                            {product.image_path ? 'Image linked' : 'Placeholder image'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#AAA69C]">
                      {product.category?.name ?? 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          product.is_available ? 'text-[#4CAF78]' : 'text-[#E06A6A]'
                        }
                      >
                        {product.is_available ? 'Available' : 'Unavailable'}
                      </span>
                      {product.is_demo && (
                        <span className="text-[#E7CB78]"> · Demo</span>
                      )}
                      {product.is_featured && (
                        <span className="text-[#AAA69C]"> · Featured</span>
                      )}
                      {product.is_best_seller && (
                        <span className="text-[#AAA69C]"> · Best Seller</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#E7CB78]">
                      <span>{formatCurrency(product.base_price, settings.currency)}</span>
                      {product.compare_at_price !== null &&
                        Number(product.compare_at_price) > Number(product.base_price) && (
                          <span className="block text-[11px] font-normal text-[#AAA69C] line-through">
                            {formatCurrency(product.compare_at_price, settings.currency)}
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handleToggleAvailable(product)}
                          className="rounded border border-[#343238] px-2.5 py-1 text-xs text-[#AAA69C] hover:border-[#D4AF37] hover:text-[#F7F5EF] disabled:opacity-50"
                        >
                          {product.is_available ? 'Disable' : 'Enable'}
                        </button>
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="inline-flex items-center gap-1 rounded border border-[#343238] px-2.5 py-1 text-xs text-[#E7CB78] hover:border-[#D4AF37]"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => setDeleteTarget(product)}
                          aria-label={`Delete ${product.name}`}
                          className="rounded border border-[#343238] p-1.5 text-[#E06A6A] hover:border-[#E06A6A] disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#AAA69C]">
            <p className="font-mono-tabular">
              Showing {visibleProducts.length} of {filteredProducts.length} filtered products (
              {products.length} total in catalogue)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {!showAll && totalPages > 1 && (
                <>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded border border-[#343238] bg-[#151518] px-3 py-1.5 text-[#F7F5EF] disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-mono-tabular">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded border border-[#343238] bg-[#151518] px-3 py-1.5 text-[#F7F5EF] disabled:opacity-40"
                  >
                    Next
                  </button>
                </>
              )}
              {filteredProducts.length > ADMIN_PAGE_SIZE && (
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="rounded border border-[#D4AF37]/60 bg-[#151518] px-3 py-1.5 font-semibold text-[#E7CB78] hover:bg-[#D4AF37] hover:text-[#0B0B0D]"
                >
                  {showAll ? `Paginate (${ADMIN_PAGE_SIZE}/page)` : `Show All (${filteredProducts.length})`}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Product"
        description={`Delete "${deleteTarget?.name}" from the live menu? Existing order-item snapshots keep their recorded name and price while order_items.product_id becomes null. You can also mark this item unavailable to keep it in your catalogue without accepting new orders.`}
        confirmLabel="Delete Product"
        secondaryActionLabel={deleteTarget?.is_available ? 'Mark Unavailable Instead' : undefined}
        onSecondaryAction={
          deleteTarget?.is_available ? handleMarkUnavailableFromDialog : undefined
        }
        isBusy={busyAction}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
