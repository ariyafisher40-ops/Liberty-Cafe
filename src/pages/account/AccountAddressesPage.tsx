import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { validatePhone } from '../../lib/validators';
import { deleteAddress, listOwnAddresses, saveAddress } from '../../services/auth.service';
import type { AddressRow } from '../../types/database';

export function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddressRow | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listOwnAddresses();
      setAddresses(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const startNew = () => {
    setEditingId(null);
    setLabel('Home');
    setRecipientName('');
    setPhone('');
    setAddressLine('');
    setArea('');
    setCity('');
    setDeliveryNotes('');
    setIsDefault(addresses.length === 0);
    setFormError(null);
    setShowForm(true);
  };

  const startEdit = (addr: AddressRow) => {
    setEditingId(addr.id);
    setLabel(addr.label ?? 'Home');
    setRecipientName(addr.recipient_name);
    setPhone(addr.phone);
    setAddressLine(addr.address_line);
    setArea(addr.area);
    setCity(addr.city);
    setDeliveryNotes(addr.delivery_notes ?? '');
    setIsDefault(addr.is_default);
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setFormError(phoneErr);
      return;
    }
    setSaving(true);
    try {
      await saveAddress({
        id: editingId ?? undefined,
        label,
        recipient_name: recipientName,
        phone,
        address_line: addressLine,
        area,
        city,
        delivery_notes: deliveryNotes,
        is_default: isDefault,
      });
      setShowForm(false);
      await loadAddresses();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteAddress(deleteTarget.id);
    setDeleteTarget(null);
    await loadAddresses();
  };

  return (
    <AccountLayout
      title="Saved Addresses"
      subtitle="Manage your delivery addresses and select a default location."
    >
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={startNew}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0B0B0D] hover:bg-[#E7CB78]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Address</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mb-8 space-y-4 rounded-lg border border-[#D4AF37]/50 bg-[#151518] p-6"
        >
          <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
            {editingId ? 'Edit Address' : 'New Delivery Address'}
          </h2>
          {formError && <FeedbackBanner tone="error" message={formError} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="addr-label" className="block text-xs font-semibold text-[#F7F5EF]">
                Label (e.g. Home, Office)
              </label>
              <input
                id="addr-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="addr-rec" className="block text-xs font-semibold text-[#F7F5EF]">
                Recipient Name *
              </label>
              <input
                id="addr-rec"
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="addr-phone" className="block text-xs font-semibold text-[#F7F5EF]">
                Phone *
              </label>
              <input
                id="addr-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="addr-city" className="block text-xs font-semibold text-[#F7F5EF]">
                City *
              </label>
              <input
                id="addr-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="addr-area" className="block text-xs font-semibold text-[#F7F5EF]">
                Area / Sector *
              </label>
              <input
                id="addr-area"
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="addr-line" className="block text-xs font-semibold text-[#F7F5EF]">
                Street Address *
              </label>
              <input
                id="addr-line"
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="addr-notes" className="block text-xs font-semibold text-[#F7F5EF]">
              Delivery Notes (Optional)
            </label>
            <input
              id="addr-notes"
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
            />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#F7F5EF]">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 accent-[#D4AF37]"
            />
            <span>Set as default delivery address</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D] hover:bg-[#E7CB78]"
            >
              {saving ? 'Saving...' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-10 rounded-md border border-[#343238] px-4 py-2 text-xs font-semibold text-[#AAA69C]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error ? (
        <FeedbackBanner tone="error" message={error} onRetry={loadAddresses} />
      ) : loading ? (
        <div className="h-36 animate-pulse rounded-lg bg-[#151518]" />
      ) : addresses.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          description="Save a delivery address for faster checkout."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((addr) => (
            <article
              key={addr.id}
              className="flex flex-col justify-between rounded-lg border border-[#343238] bg-[#151518] p-5"
            >
              <div>
                <p className="text-xs font-semibold text-[#D4AF37]">
                  {addr.label || 'Address'}
                  {addr.is_default ? ' · Default' : ''}
                </p>
                <p className="mt-1 font-semibold text-[#F7F5EF]">{addr.recipient_name}</p>
                <p className="text-xs text-[#AAA69C]">{addr.phone}</p>
                <p className="mt-2 text-sm text-[#AAA69C]">
                  {addr.address_line}, {addr.area}, {addr.city}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-4 border-t border-[#343238]/60 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => startEdit(addr)}
                  className="inline-flex items-center gap-1 text-[#E7CB78] hover:underline"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(addr)}
                  className="inline-flex items-center gap-1 text-[#E06A6A] hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Saved Address"
        description={`Remove "${deleteTarget?.label || 'this address'}" from your saved addresses? Past order snapshots will not be affected.`}
        confirmLabel="Delete Address"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AccountLayout>
  );
}
