import { useEffect, useState } from 'react';
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useSettings } from '../../features/settings/SettingsContext';
import { env } from '../../lib/env';
import { formatPaymentMethod } from '../../lib/formatters';
import { previewStore } from '../../services/previewStore';
import { updateSiteSettings } from '../../services/settings.service';
import type { PaymentMethod } from '../../types/database';
import type { SiteSettingsMap } from '../../types/domain';

export function AdminSettingsPage() {
  const { settings, refreshSettings } = useSettings();
  const [form, setForm] = useState<SiteSettingsMap>(settings);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      await updateSiteSettings(form);
      await refreshSettings();
      setSavedMsg('Cafe settings updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPreview = async () => {
    previewStore.reset();
    await refreshSettings();
    setSavedMsg('Local preview data reset to initial demo defaults.');
  };

  return (
    <AdminLayout
      title="Site Settings"
      subtitle="Configure real cafe contact info, opening hours, order modes, and payment instructions."
    >
      <form onSubmit={handleSave} className="space-y-8">
        {error && <FeedbackBanner tone="error" message={error} />}
        {savedMsg && <FeedbackBanner tone="success" message={savedMsg} />}

        <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
          <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
            Brand &amp; Contact Information
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="st-name" className="block text-xs font-semibold text-[#F7F5EF]">
                Restaurant Name
              </label>
              <input
                id="st-name"
                type="text"
                value={form.restaurant_name}
                onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-phone" className="block text-xs font-semibold text-[#F7F5EF]">
                Phone
              </label>
              <input
                id="st-phone"
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-wa" className="block text-xs font-semibold text-[#F7F5EF]">
                WhatsApp
              </label>
              <input
                id="st-wa"
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-email" className="block text-xs font-semibold text-[#F7F5EF]">
                Contact Email
              </label>
              <input
                id="st-email"
                type="text"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-addr" className="block text-xs font-semibold text-[#F7F5EF]">
                Street Address
              </label>
              <input
                id="st-addr"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-city" className="block text-xs font-semibold text-[#F7F5EF]">
                City
              </label>
              <input
                id="st-city"
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-hours" className="block text-xs font-semibold text-[#F7F5EF]">
                Opening Hours
              </label>
              <input
                id="st-hours"
                type="text"
                value={form.opening_hours}
                onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-tax" className="block text-xs font-semibold text-[#F7F5EF]">
                Tax Rate (%)
              </label>
              <input
                id="st-tax"
                type="number"
                min="0"
                step="0.5"
                value={form.tax_rate}
                onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) || 0 })}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
          <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
            Order Modes &amp; Pickup Instructions
          </h2>
          <div className="mt-4 flex flex-wrap gap-6 text-xs text-[#F7F5EF]">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.delivery_enabled}
                onChange={(e) => setForm({ ...form, delivery_enabled: e.target.checked })}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              <span>Enable Home Delivery</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.takeaway_enabled}
                onChange={(e) => setForm({ ...form, takeaway_enabled: e.target.checked })}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              <span>Enable Takeaway / Pickup</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.dine_in_enabled}
                onChange={(e) => setForm({ ...form, dine_in_enabled: e.target.checked })}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              <span>Enable Dine-in</span>
            </label>
          </div>

          <div className="mt-4">
            <label htmlFor="st-pickup" className="block text-xs font-semibold text-[#F7F5EF]">
              Takeaway Pickup Instructions
            </label>
            <textarea
              id="st-pickup"
              rows={2}
              value={form.pickup_instructions}
              onChange={(e) => setForm({ ...form, pickup_instructions: e.target.value })}
              className="mt-1.5 w-full rounded-md border border-[#343238] bg-[#0B0B0D] p-3 text-sm text-[#F7F5EF]"
            />
          </div>
        </section>

        <section className="rounded-lg border border-[#343238] bg-[#151518] p-6">
          <h2 className="font-display text-lg font-semibold text-[#F7F5EF]">
            Payment Methods &amp; Manual Transfer Instructions
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(form.payment_methods) as PaymentMethod[]).map((method) => (
              <label
                key={method}
                className="flex cursor-pointer items-center gap-2.5 rounded border border-[#343238] bg-[#0B0B0D] p-3 text-xs text-[#F7F5EF]"
              >
                <input
                  type="checkbox"
                  checked={form.payment_methods[method]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_methods: {
                        ...form.payment_methods,
                        [method]: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 accent-[#D4AF37]"
                />
                <span>{formatPaymentMethod(method)}</span>
              </label>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="st-jc" className="block text-xs font-semibold text-[#F7F5EF]">
                JazzCash Manual Instructions
              </label>
              <input
                id="st-jc"
                type="text"
                value={form.manual_payment_instructions.jazzcash_manual}
                onChange={(e) =>
                  setForm({
                    ...form,
                    manual_payment_instructions: {
                      ...form.manual_payment_instructions,
                      jazzcash_manual: e.target.value,
                    },
                  })
                }
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-ep" className="block text-xs font-semibold text-[#F7F5EF]">
                Easypaisa Manual Instructions
              </label>
              <input
                id="st-ep"
                type="text"
                value={form.manual_payment_instructions.easypaisa_manual}
                onChange={(e) =>
                  setForm({
                    ...form,
                    manual_payment_instructions: {
                      ...form.manual_payment_instructions,
                      easypaisa_manual: e.target.value,
                    },
                  })
                }
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="st-bk" className="block text-xs font-semibold text-[#F7F5EF]">
                Bank Transfer Manual Instructions
              </label>
              <input
                id="st-bk"
                type="text"
                value={form.manual_payment_instructions.bank_transfer_manual}
                onChange={(e) =>
                  setForm({
                    ...form,
                    manual_payment_instructions: {
                      ...form.manual_payment_instructions,
                      bank_transfer_manual: e.target.value,
                    },
                  })
                }
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-md bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] disabled:opacity-50"
          >
            {saving ? 'Saving Settings...' : 'Save Site Settings'}
          </button>

          {!env.isSupabaseConfigured && (
            <button
              type="button"
              onClick={handleResetPreview}
              className="min-h-10 rounded-md border border-[#343238] px-4 py-2 text-xs font-semibold text-[#AAA69C] hover:border-[#E06A6A] hover:text-[#E06A6A]"
            >
              Reset Local Preview Data
            </button>
          )}
        </div>
      </form>
    </AdminLayout>
  );
}
