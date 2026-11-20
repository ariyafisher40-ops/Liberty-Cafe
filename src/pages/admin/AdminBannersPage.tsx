import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ProductImage } from '../../components/products/ProductImage';
import {
  adminDeleteBanner,
  adminListBanners,
  adminSaveBanner,
  uploadPublicAsset,
} from '../../services/admin.service';
import type { BannerPlacement, BannerRow } from '../../types/database';

export function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [ctaLabel, setCtaLabel] = useState('Explore Menu');
  const [ctaPath, setCtaPath] = useState('/menu');
  const [placement, setPlacement] = useState<BannerPlacement>('home_hero');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BannerRow | null>(null);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBanners(await adminListBanners());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  const startNew = () => {
    setEditingId(undefined);
    setTitle('');
    setSubtitle('');
    setImagePath(null);
    setCtaLabel('Explore Menu');
    setCtaPath('/menu');
    setPlacement('home_promo');
    setSortOrder(String(banners.length + 1));
    setIsActive(true);
    setIsDemo(false);
    setShowForm(true);
  };

  const startEdit = (b: BannerRow) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle ?? '');
    setImagePath(b.image_path);
    setCtaLabel(b.cta_label ?? '');
    setCtaPath(b.cta_path ?? '/menu');
    setPlacement(b.placement);
    setSortOrder(String(b.sort_order));
    setIsActive(b.is_active);
    setIsDemo(b.is_demo);
    setShowForm(true);
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const path = await uploadPublicAsset('banner-images', editingId || 'new', file);
      setImagePath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Banner image upload failed.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminSaveBanner({
        id: editingId,
        title,
        subtitle: subtitle.trim() || null,
        image_path: imagePath,
        cta_label: ctaLabel.trim() || null,
        cta_path: ctaPath.trim() || null,
        placement,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
        is_demo: isDemo,
        starts_at: null,
        ends_at: null,
      });
      setShowForm(false);
      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Banners"
      subtitle="Manage homepage hero and promotional campaign banners."
      action={
        <button
          type="button"
          onClick={startNew}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Banner
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bn-title" className="block text-xs font-semibold text-[#F7F5EF]">
                Headline *
              </label>
              <input
                id="bn-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="bn-place" className="block text-xs font-semibold text-[#F7F5EF]">
                Placement
              </label>
              <select
                id="bn-place"
                value={placement}
                onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              >
                <option value="home_hero">Homepage Hero</option>
                <option value="home_promo">Homepage Promo</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="bn-sub" className="block text-xs font-semibold text-[#F7F5EF]">
              Supporting Copy
            </label>
            <textarea
              id="bn-sub"
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-[#343238] bg-[#0B0B0D] p-3 text-sm text-[#F7F5EF]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="bn-cta-l" className="block text-xs font-semibold text-[#F7F5EF]">
                CTA Label
              </label>
              <input
                id="bn-cta-l"
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="bn-cta-p" className="block text-xs font-semibold text-[#F7F5EF]">
                CTA Path
              </label>
              <input
                id="bn-cta-p"
                type="text"
                value={ctaPath}
                onChange={(e) => setCtaPath(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="bn-img" className="block text-xs font-semibold text-[#F7F5EF]">
                Banner Image
              </label>
              <input
                id="bn-img"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-xs text-[#AAA69C]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-xs text-[#F7F5EF]">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              <span>Active</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isDemo}
                onChange={(e) => setIsDemo(e.target.checked)}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              <span>Demo Banner</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
            >
              {saving ? 'Saving...' : 'Save Banner'}
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
      ) : banners.length === 0 ? (
        <EmptyState title="No banners" description="Create a hero or promotional banner." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {banners.map((b) => (
            <article
              key={b.id}
              className="overflow-hidden rounded-lg border border-[#343238] bg-[#151518]"
            >
              <ProductImage
                src={b.image_path}
                bucket="banner-images"
                alt={b.title}
                aspectClassName="aspect-[16/9]"
              />
              <div className="p-5">
                <p className="text-xs text-[#AAA69C]">
                  {b.placement} · {b.is_active ? 'Active' : 'Inactive'}
                  {b.is_demo ? ' · Demo' : ''}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-[#F7F5EF]">
                  {b.title}
                </h2>
                {b.subtitle && <p className="mt-1 text-xs text-[#AAA69C]">{b.subtitle}</p>}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    className="inline-flex items-center gap-1 rounded border border-[#343238] px-3 py-1.5 text-xs text-[#E7CB78]"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(b)}
                    className="inline-flex items-center gap-1 rounded border border-[#343238] px-3 py-1.5 text-xs text-[#E06A6A]"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Banner"
        description={`Delete banner "${deleteTarget?.title}"?`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await adminDeleteBanner(deleteTarget.id);
          setDeleteTarget(null);
          await loadBanners();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
