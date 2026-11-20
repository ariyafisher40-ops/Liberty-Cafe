import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ProductImage } from '../../components/products/ProductImage';
import { toSlug } from '../../lib/formatters';
import {
  adminGetProductById,
  adminListAddOns,
  adminListCategories,
  adminSaveProduct,
  uploadPublicAsset,
} from '../../services/admin.service';
import type { AddOnRow, CategoryRow } from '../../types/database';

interface VariantDraft {
  id?: string;
  name: string;
  price_delta: number;
  is_available: boolean;
}

export function AdminProductFormPage() {
  const { productId } = useParams<{ productId?: string }>();
  const isEdit = Boolean(productId && productId !== 'new');
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [addOns, setAddOns] = useState<AddOnRow[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState('0');
  const [comparePrice, setComparePrice] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForm = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, addons] = await Promise.all([adminListCategories(), adminListAddOns()]);
      setCategories(cats);
      setAddOns(addons);
      if (cats.length > 0) {
        setCategoryId((prev) => prev || cats[0].id);
      }

      if (isEdit && productId) {
        const existing = await adminGetProductById(productId);
        if (!existing) {
          setError('Product not found.');
        } else {
          setCategoryId(existing.category_id);
          setName(existing.name);
          setSlug(existing.slug);
          setShortDesc(existing.short_description ?? '');
          setDescription(existing.description ?? '');
          setImagePath(existing.image_path);
          setBasePrice(String(existing.base_price));
          setComparePrice(
            existing.compare_at_price !== null ? String(existing.compare_at_price) : ''
          );
          setSortOrder(String(existing.sort_order));
          setIsFeatured(existing.is_featured);
          setIsBestSeller(existing.is_best_seller);
          setIsAvailable(existing.is_available);
          setIsDemo(existing.is_demo);
          setVariants(
            existing.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price_delta: Number(v.price_delta),
              is_available: v.is_available,
            }))
          );
          setSelectedAddOnIds(existing.add_ons.map((a) => a.id));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load product editor.');
    } finally {
      setLoading(false);
    }
  }, [isEdit, productId]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const path = await uploadPublicAsset('product-images', productId || 'draft', file);
      setImagePath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !slug.trim() || !categoryId) {
      setError('Category, product name, and URL slug are required.');
      return;
    }
    setSaving(true);
    try {
      await adminSaveProduct({
        id: isEdit ? productId : undefined,
        category_id: categoryId,
        name,
        slug,
        short_description: shortDesc,
        description,
        image_path: imagePath,
        base_price: Number(basePrice) || 0,
        compare_at_price: comparePrice ? Number(comparePrice) : null,
        is_featured: isFeatured,
        is_best_seller: isBestSeller,
        is_available: isAvailable,
        is_demo: isDemo,
        sort_order: Number(sortOrder) || 0,
        variants: variants.map((v, idx) => ({
          id: v.id,
          name: v.name,
          price_delta: Number(v.price_delta) || 0,
          is_available: v.is_available,
          sort_order: idx + 1,
        })),
        add_on_ids: selectedAddOnIds,
      });
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title={isEdit ? 'Edit Product' : 'New Product'}
      subtitle="Configure pricing, variants, linked add-ons, and imagery."
    >
      <Link
        to="/admin/products"
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#AAA69C] hover:text-[#E7CB78]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Products
      </Link>

      {error && (
        <div className="mb-6">
          <FeedbackBanner tone="error" message={error} />
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-[#151518]" />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 rounded-lg border border-[#343238] bg-[#151518] p-6 lg:col-span-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="p-name" className="block text-xs font-semibold text-[#F7F5EF]">
                    Product Name *
                  </label>
                  <input
                    id="p-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!isEdit) setSlug(toSlug(e.target.value));
                    }}
                    className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                  />
                </div>

                <div>
                  <label htmlFor="p-slug" className="block text-xs font-semibold text-[#F7F5EF]">
                    URL Slug *
                  </label>
                  <input
                    id="p-slug"
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(toSlug(e.target.value))}
                    className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                  />
                </div>

                <div>
                  <label htmlFor="p-cat" className="block text-xs font-semibold text-[#F7F5EF]">
                    Category *
                  </label>
                  <select
                    id="p-cat"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="p-price" className="block text-xs font-semibold text-[#F7F5EF]">
                    Base Price (PKR) *
                  </label>
                  <input
                    id="p-price"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="p-compare-price"
                    className="block text-xs font-semibold text-[#F7F5EF]"
                  >
                    Compare-at Price (PKR, Optional)
                  </label>
                  <input
                    id="p-compare-price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Optional original price"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
                  />
                </div>

                <div>
                  <label htmlFor="p-sort" className="block text-xs font-semibold text-[#F7F5EF]">
                    Display Sort Order
                  </label>
                  <input
                    id="p-sort"
                    type="number"
                    step="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="p-short" className="block text-xs font-semibold text-[#F7F5EF]">
                  Short Description
                </label>
                <input
                  id="p-short"
                  type="text"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
                />
              </div>

              <div>
                <label htmlFor="p-desc" className="block text-xs font-semibold text-[#F7F5EF]">
                  Full Description
                </label>
                <textarea
                  id="p-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#343238] bg-[#0B0B0D] p-3 text-sm text-[#F7F5EF]"
                />
              </div>

              <div className="flex flex-wrap gap-5 pt-2 text-xs text-[#F7F5EF]">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  <span>Available for ordering</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  <span>Featured on Home</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isDemo}
                    onChange={(e) => setIsDemo(e.target.checked)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  <span>Sample Demo Item</span>
                </label>
              </div>
            </div>

            {/* Image Panel */}
            <div className="space-y-4 rounded-lg border border-[#343238] bg-[#151518] p-6 lg:col-span-4">
              <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">Product Image</h2>
              <ProductImage
                src={imagePath}
                alt={name || 'Product preview'}
                aspectClassName="aspect-[4/3] rounded"
              />
              <div>
                <label htmlFor="p-img" className="block text-xs font-semibold text-[#F7F5EF]">
                  Upload Image (JPEG/PNG/WebP)
                </label>
                <input
                  id="p-img"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-xs text-[#AAA69C]"
                />
                {uploading && <p className="mt-1 text-xs text-[#E7CB78]">Uploading...</p>}
                {imagePath && (
                  <button
                    type="button"
                    onClick={() => setImagePath(null)}
                    className="mt-2 text-xs text-[#E06A6A] underline"
                  >
                    Revert to placeholder
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Variants & Add-ons */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
                  Product Variants
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setVariants((prev) => [
                      ...prev,
                      { name: '', price_delta: 0, is_available: true },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded border border-[#D4AF37] px-3 py-1 text-xs font-semibold text-[#E7CB78]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Variant
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {variants.length === 0 ? (
                  <p className="text-xs text-[#AAA69C]">No size/option variants added.</p>
                ) : (
                  variants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Variant name (e.g. Large)"
                        value={v.name}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                        className="min-h-9 flex-1 rounded border border-[#343238] bg-[#0B0B0D] px-3 text-xs text-[#F7F5EF]"
                      />
                      <input
                        type="number"
                        placeholder="+ PKR"
                        value={v.price_delta}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, price_delta: Number(e.target.value) } : item
                            )
                          )
                        }
                        className="min-h-9 w-24 rounded border border-[#343238] bg-[#0B0B0D] px-2 font-mono-tabular text-xs text-[#F7F5EF]"
                      />
                      <button
                        type="button"
                        aria-label="Remove variant"
                        onClick={() =>
                          setVariants((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-2 text-[#E06A6A]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-[#343238] bg-[#151518] p-6">
              <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
                Linked Add-ons
              </h2>
              <div className="mt-4 space-y-2">
                {addOns.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center justify-between rounded border border-[#343238] bg-[#0B0B0D] px-3 py-2 text-xs text-[#F7F5EF]"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAddOnIds.includes(a.id)}
                        onChange={() =>
                          setSelectedAddOnIds((prev) =>
                            prev.includes(a.id)
                              ? prev.filter((id) => id !== a.id)
                              : [...prev, a.id]
                          )
                        }
                        className="h-4 w-4 accent-[#D4AF37]"
                      />
                      <span>{a.name}</span>
                    </span>
                    <span className="font-mono-tabular text-[#E7CB78]">+{a.price}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-md bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Product Changes' : 'Create Product'}
            </button>
            <Link
              to="/admin/products"
              className="inline-flex min-h-11 items-center rounded-md border border-[#343238] px-5 py-2.5 text-sm font-medium text-[#AAA69C]"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
