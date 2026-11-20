import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { toSlug } from '../../lib/formatters';
import {
  adminDeleteCategory,
  adminListAllProducts,
  adminListCategories,
  adminSaveCategory,
  uploadPublicAsset,
} from '../../services/admin.service';
import type { CategoryRow } from '../../types/database';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, prods] = await Promise.all([adminListCategories(), adminListAllProducts()]);
      setCategories(list);
      const counts: Record<string, number> = {};
      for (const p of prods) {
        counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      }
      setProductCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const startNew = () => {
    setEditingId(undefined);
    setName('');
    setSlug('');
    setDescription('');
    setImagePath(null);
    setSortOrder(String(categories.length + 1));
    setIsActive(true);
    setShowForm(true);
  };

  const startEdit = (cat: CategoryRow) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? '');
    setImagePath(cat.image_path);
    setSortOrder(String(cat.sort_order));
    setIsActive(cat.is_active);
    setShowForm(true);
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const path = await uploadPublicAsset('category-images', editingId || 'new', file);
      setImagePath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminSaveCategory({
        id: editingId,
        name,
        slug,
        description: description.trim() || null,
        image_path: imagePath,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      });
      setShowForm(false);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete category.');
      setDeleteTarget(null);
    }
  };

  return (
    <AdminLayout
      title="Categories"
      subtitle="Organize menu collections, display order, and category artwork."
      action={
        <button
          type="button"
          onClick={startNew}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Category
        </button>
      }
    >
      {error && (
        <div className="mb-6">
          <FeedbackBanner tone="error" message={error} />
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mb-8 space-y-4 rounded-lg border border-[#D4AF37]/50 bg-[#151518] p-6"
        >
          <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cat-name" className="block text-xs font-semibold text-[#F7F5EF]">
                Name *
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) setSlug(toSlug(e.target.value));
                }}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="cat-slug" className="block text-xs font-semibold text-[#F7F5EF]">
                Slug *
              </label>
              <input
                id="cat-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(toSlug(e.target.value))}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="cat-sort" className="block text-xs font-semibold text-[#F7F5EF]">
                Sort Order
              </label>
              <input
                id="cat-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="cat-desc" className="block text-xs font-semibold text-[#F7F5EF]">
              Description
            </label>
            <input
              id="cat-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label htmlFor="cat-img" className="block text-xs font-semibold text-[#F7F5EF]">
                Category Image
              </label>
              <input
                id="cat-img"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                className="mt-1 text-xs text-[#AAA69C]"
              />
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#F7F5EF]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              <span>Active on Storefront</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
            >
              {saving ? 'Saving...' : 'Save Category'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-10 rounded-md border border-[#343238] px-4 py-2 text-xs text-[#AAA69C]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="h-44 animate-pulse rounded-lg bg-[#151518]" />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories" description="Add your first menu category." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#343238] bg-[#151518]">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-[#343238] text-xs text-[#AAA69C]">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 text-right font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343238]/60">
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-4 py-3 font-mono-tabular text-xs text-[#AAA69C]">
                    {cat.sort_order}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#F7F5EF]">{cat.name}</td>
                  <td className="px-4 py-3 font-mono-tabular text-xs text-[#AAA69C]">{cat.slug}</td>
                  <td className="px-4 py-3 text-right font-mono-tabular text-xs text-[#E7CB78]">
                    {productCounts[cat.id] ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={cat.is_active ? 'text-[#4CAF78]' : 'text-[#E06A6A]'}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="inline-flex items-center gap-1 rounded border border-[#343238] px-2.5 py-1 text-xs text-[#E7CB78]"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        aria-label={`Delete ${cat.name}`}
                        className="rounded border border-[#343238] p-1.5 text-[#E06A6A]"
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
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        description={`Delete "${deleteTarget?.name}"? Categories with linked products should be deactivated instead.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
