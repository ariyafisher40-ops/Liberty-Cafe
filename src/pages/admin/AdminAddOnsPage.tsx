import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency } from '../../lib/formatters';
import {
  adminDeleteAddOn,
  adminListAddOns,
  adminSaveAddOn,
} from '../../services/admin.service';
import type { AddOnRow } from '../../types/database';

export function AdminAddOnsPage() {
  const { settings } = useSettings();
  const [addOns, setAddOns] = useState<AddOnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [sortOrder, setSortOrder] = useState('0');
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AddOnRow | null>(null);

  const loadAddOns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAddOns(await adminListAddOns());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load add-ons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddOns();
  }, [loadAddOns]);

  const startNew = () => {
    setEditingId(undefined);
    setName('');
    setDescription('');
    setPrice('0');
    setSortOrder(String(addOns.length + 1));
    setIsAvailable(true);
    setShowForm(true);
  };

  const startEdit = (item: AddOnRow) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description ?? '');
    setPrice(String(item.price));
    setSortOrder(String(item.sort_order));
    setIsAvailable(item.is_available);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminSaveAddOn({
        id: editingId,
        name,
        description: description.trim() || null,
        price: Number(price) || 0,
        sort_order: Number(sortOrder) || 0,
        is_available: isAvailable,
      });
      setShowForm(false);
      await loadAddOns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save add-on.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Add-ons"
      subtitle="Manage optional extras that can be linked to menu items."
      action={
        <button
          type="button"
          onClick={startNew}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Extra
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
              <label htmlFor="ao-name" className="block text-xs font-semibold text-[#F7F5EF]">
                Name *
              </label>
              <input
                id="ao-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="ao-price" className="block text-xs font-semibold text-[#F7F5EF]">
                Price (PKR) *
              </label>
              <input
                id="ao-price"
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="ao-sort" className="block text-xs font-semibold text-[#F7F5EF]">
                Sort Order
              </label>
              <input
                id="ao-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="ao-desc" className="block text-xs font-semibold text-[#F7F5EF]">
              Description
            </label>
            <input
              id="ao-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
            />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#F7F5EF]">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="h-4 w-4 accent-[#D4AF37]"
            />
            <span>Available</span>
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
            >
              {saving ? 'Saving...' : 'Save Add-on'}
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
      ) : addOns.length === 0 ? (
        <EmptyState title="No add-ons" description="Create optional extras for products." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#343238] bg-[#151518]">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead className="border-b border-[#343238] text-xs text-[#AAA69C]">
              <tr>
                <th className="px-4 py-3 font-semibold">Add-on</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343238]/60">
              {addOns.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-semibold text-[#F7F5EF]">{item.name}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={item.is_available ? 'text-[#4CAF78]' : 'text-[#E06A6A]'}>
                      {item.is_available ? 'Available' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-tabular text-[#E7CB78]">
                    {formatCurrency(item.price, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1 rounded border border-[#343238] px-2.5 py-1 text-xs text-[#E7CB78]"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.name}`}
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
        title="Delete Add-on"
        description={`Remove "${deleteTarget?.name}" from available add-ons?`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await adminDeleteAddOn(deleteTarget.id);
          setDeleteTarget(null);
          await loadAddOns();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
