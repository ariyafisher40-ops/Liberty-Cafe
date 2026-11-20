import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency } from '../../lib/formatters';
import {
  adminDeleteCoupon,
  adminListCoupons,
  adminSaveCoupon,
} from '../../services/admin.service';
import type { CouponRow, DiscountType } from '../../types/database';

export function AdminCouponsPage() {
  const { settings } = useSettings();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | undefined>();
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrder, setMinOrder] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CouponRow | null>(null);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCoupons(await adminListCoupons());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load coupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const startNew = () => {
    setEditingId(undefined);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('10');
    setMinOrder('0');
    setMaxDiscount('');
    setUsageLimit('');
    setPerUserLimit('1');
    setIsActive(true);
    setIsDemo(false);
    setShowForm(true);
  };

  const startEdit = (c: CouponRow) => {
    setEditingId(c.id);
    setCode(c.code);
    setDescription(c.description ?? '');
    setDiscountType(c.discount_type);
    setDiscountValue(String(c.discount_value));
    setMinOrder(String(c.min_order_amount));
    setMaxDiscount(c.max_discount_amount !== null ? String(c.max_discount_amount) : '');
    setUsageLimit(c.usage_limit !== null ? String(c.usage_limit) : '');
    setPerUserLimit(String(c.per_user_limit));
    setIsActive(c.is_active);
    setIsDemo(c.is_demo);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminSaveCoupon({
        id: editingId,
        code,
        description: description.trim() || null,
        discount_type: discountType,
        discount_value: Number(discountValue) || 1,
        min_order_amount: Number(minOrder) || 0,
        max_discount_amount: maxDiscount ? Number(maxDiscount) : null,
        starts_at: null,
        expires_at: null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
        per_user_limit: Number(perUserLimit) || 1,
        is_active: isActive,
        is_demo: isDemo,
      });
      setShowForm(false);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Coupons & Offers"
      subtitle="Configure discount codes, minimum thresholds, and demo flags."
      action={
        <button
          type="button"
          onClick={startNew}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Coupon
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cp-code" className="block text-xs font-semibold text-[#F7F5EF]">
                Code *
              </label>
              <input
                id="cp-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 uppercase text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="cp-type" className="block text-xs font-semibold text-[#F7F5EF]">
                Discount Type
              </label>
              <select
                id="cp-type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ({settings.currency})</option>
              </select>
            </div>
            <div>
              <label htmlFor="cp-val" className="block text-xs font-semibold text-[#F7F5EF]">
                Discount Value *
              </label>
              <input
                id="cp-val"
                type="number"
                min="1"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="cp-min" className="block text-xs font-semibold text-[#F7F5EF]">
                Min. Order Amount
              </label>
              <input
                id="cp-min"
                type="number"
                min="0"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="cp-max" className="block text-xs font-semibold text-[#F7F5EF]">
                Max Discount Cap (Optional)
              </label>
              <input
                id="cp-max"
                type="number"
                min="0"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="cp-user-limit" className="block text-xs font-semibold text-[#F7F5EF]">
                Per-User Limit
              </label>
              <input
                id="cp-user-limit"
                type="number"
                min="1"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="cp-desc" className="block text-xs font-semibold text-[#F7F5EF]">
              Description
            </label>
            <input
              id="cp-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
            />
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
              <span>Demo Offer</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
            >
              {saving ? 'Saving...' : 'Save Coupon'}
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
      ) : coupons.length === 0 ? (
        <EmptyState title="No coupons configured" description="Create a promotional coupon code." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#343238] bg-[#151518]">
          <table className="w-full min-w-[660px] text-left text-sm">
            <thead className="border-b border-[#343238] text-xs text-[#AAA69C]">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Min Order</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343238]/60">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono-tabular font-semibold text-[#E7CB78]">
                    {c.code}
                    {c.is_demo && (
                      <span className="ml-2 font-sans text-xs font-normal text-[#AAA69C]">
                        · Demo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#F7F5EF]">
                    {c.discount_type === 'percentage'
                      ? `${c.discount_value}%`
                      : formatCurrency(c.discount_value, settings.currency)}
                  </td>
                  <td className="px-4 py-3 font-mono-tabular text-xs text-[#AAA69C]">
                    {formatCurrency(c.min_order_amount, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={c.is_active ? 'text-[#4CAF78]' : 'text-[#E06A6A]'}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="inline-flex items-center gap-1 rounded border border-[#343238] px-2.5 py-1 text-xs text-[#E7CB78]"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        aria-label={`Delete ${c.code}`}
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
        title="Delete Coupon"
        description={`Delete coupon "${deleteTarget?.code}"?`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await adminDeleteCoupon(deleteTarget.id);
          setDeleteTarget(null);
          await loadCoupons();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
