import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatCurrency } from '../../lib/formatters';
import {
  adminDeleteDeliveryZone,
  adminListDeliveryZones,
  adminSaveDeliveryZone,
} from '../../services/admin.service';
import type { DeliveryZoneRow } from '../../types/database';

export function AdminDeliveryZonesPage() {
  const { settings } = useSettings();
  const [zones, setZones] = useState<DeliveryZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [areasText, setAreasText] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('150');
  const [minOrder, setMinOrder] = useState('500');
  const [estMinutes, setEstMinutes] = useState('45');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZoneRow | null>(null);

  const loadZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setZones(await adminListDeliveryZones());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load delivery zones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const startNew = () => {
    setEditingId(undefined);
    setName('');
    setCity('');
    setAreasText('');
    setDeliveryFee('150');
    setMinOrder('500');
    setEstMinutes('45');
    setIsActive(true);
    setShowForm(true);
  };

  const startEdit = (z: DeliveryZoneRow) => {
    setEditingId(z.id);
    setName(z.name);
    setCity(z.city);
    setAreasText(z.area_names.join(', '));
    setDeliveryFee(String(z.delivery_fee));
    setMinOrder(String(z.min_order_amount));
    setEstMinutes(z.estimated_minutes !== null ? String(z.estimated_minutes) : '');
    setIsActive(z.is_active);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const areas = areasText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim() || !city.trim() || areas.length === 0) {
      setError('Zone name, city, and at least one area name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminSaveDeliveryZone({
        id: editingId,
        name,
        city,
        area_names: areas,
        delivery_fee: Number(deliveryFee) || 0,
        min_order_amount: Number(minOrder) || 0,
        estimated_minutes: estMinutes ? Number(estMinutes) : null,
        is_active: isActive,
      });
      setShowForm(false);
      await loadZones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save delivery zone.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Delivery Zones"
      subtitle="Define confirmed service cities, neighborhoods, fees, and minimum order rules."
      action={
        <button
          type="button"
          onClick={startNew}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Delivery Zone
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
              <label htmlFor="dz-name" className="block text-xs font-semibold text-[#F7F5EF]">
                Zone Name *
              </label>
              <input
                id="dz-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Central District"
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="dz-city" className="block text-xs font-semibold text-[#F7F5EF]">
                City *
              </label>
              <input
                id="dz-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="dz-areas" className="block text-xs font-semibold text-[#F7F5EF]">
              Covered Areas (comma-separated) *
            </label>
            <input
              id="dz-areas"
              type="text"
              required
              value={areasText}
              onChange={(e) => setAreasText(e.target.value)}
              placeholder="e.g. Gulberg, Model Town, DHA Phase 1"
              className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="dz-fee" className="block text-xs font-semibold text-[#F7F5EF]">
                Delivery Fee ({settings.currency})
              </label>
              <input
                id="dz-fee"
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="dz-min" className="block text-xs font-semibold text-[#F7F5EF]">
                Min Order ({settings.currency})
              </label>
              <input
                id="dz-min"
                type="number"
                min="0"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="dz-eta" className="block text-xs font-semibold text-[#F7F5EF]">
                Est. Minutes
              </label>
              <input
                id="dz-eta"
                type="number"
                min="5"
                value={estMinutes}
                onChange={(e) => setEstMinutes(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#F7F5EF]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-[#D4AF37]"
            />
            <span>Active for Checkout</span>
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
            >
              {saving ? 'Saving...' : 'Save Delivery Zone'}
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
      ) : zones.length === 0 ? (
        <EmptyState
          title="No delivery zones configured"
          description="Per schema guidelines, no city or area is pre-filled. Add confirmed delivery zones before accepting Home Delivery orders."
          action={
            <button
              type="button"
              onClick={startNew}
              className="inline-flex min-h-10 items-center rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
            >
              Add First Delivery Zone
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#343238] bg-[#151518]">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-[#343238] text-xs text-[#AAA69C]">
              <tr>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">City &amp; Areas</th>
                <th className="px-4 py-3 font-semibold">Fee / Min</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343238]/60">
              {zones.map((z) => (
                <tr key={z.id}>
                  <td className="px-4 py-3 font-semibold text-[#F7F5EF]">{z.name}</td>
                  <td className="px-4 py-3 text-xs text-[#AAA69C]">
                    <span className="font-semibold text-[#F7F5EF]">{z.city}:</span>{' '}
                    {z.area_names.join(', ')}
                  </td>
                  <td className="px-4 py-3 font-mono-tabular text-xs text-[#E7CB78]">
                    {formatCurrency(z.delivery_fee, settings.currency)} / Min{' '}
                    {formatCurrency(z.min_order_amount, settings.currency)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={z.is_active ? 'text-[#4CAF78]' : 'text-[#E06A6A]'}>
                      {z.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(z)}
                        className="inline-flex items-center gap-1 rounded border border-[#343238] px-2.5 py-1 text-xs text-[#E7CB78]"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(z)}
                        aria-label={`Delete ${z.name}`}
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
        title="Delete Delivery Zone"
        description={`Delete "${deleteTarget?.name}"?`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await adminDeleteDeliveryZone(deleteTarget.id);
          setDeleteTarget(null);
          await loadZones();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
