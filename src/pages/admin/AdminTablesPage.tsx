import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  adminDeleteTable,
  adminListTables,
  adminSaveTable,
} from '../../services/admin.service';
import type { RestaurantTableRow } from '../../types/database';

export function AdminTablesPage() {
  const [tables, setTables] = useState<RestaurantTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | undefined>();
  const [tableCode, setTableCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantTableRow | null>(null);

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTables(await adminListTables());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dine-in tables.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  const startNew = () => {
    setEditingId(undefined);
    setTableCode('');
    setDisplayName('');
    setCapacity('4');
    setSortOrder(String(tables.length + 1));
    setIsActive(true);
    setIsDemo(false);
    setShowForm(true);
  };

  const startEdit = (t: RestaurantTableRow) => {
    setEditingId(t.id);
    setTableCode(t.table_code);
    setDisplayName(t.display_name);
    setCapacity(t.capacity !== null ? String(t.capacity) : '');
    setSortOrder(String(t.sort_order));
    setIsActive(t.is_active);
    setIsDemo(t.is_demo);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminSaveTable({
        id: editingId,
        table_code: tableCode,
        display_name: displayName,
        capacity: capacity ? Number(capacity) : null,
        is_active: isActive,
        is_demo: isDemo,
        sort_order: Number(sortOrder) || 0,
      });
      setShowForm(false);
      await loadTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save table.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Dine-in Tables"
      subtitle="Manage cafe dining room table codes for immediate dine-in checkout."
      action={
        <button
          type="button"
          onClick={startNew}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0D]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Table
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="tb-code" className="block text-xs font-semibold text-[#F7F5EF]">
                Table Code *
              </label>
              <input
                id="tb-code"
                type="text"
                required
                value={tableCode}
                onChange={(e) => setTableCode(e.target.value.toUpperCase())}
                placeholder="T09"
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 uppercase text-sm text-[#F7F5EF]"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tb-name" className="block text-xs font-semibold text-[#F7F5EF]">
                Display Name *
              </label>
              <input
                id="tb-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Window Booth 09"
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 text-sm text-[#F7F5EF]"
              />
            </div>
            <div>
              <label htmlFor="tb-cap" className="block text-xs font-semibold text-[#F7F5EF]">
                Seats
              </label>
              <input
                id="tb-cap"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3 font-mono-tabular text-sm text-[#F7F5EF]"
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
              <span>Demo Table</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0B0B0D]"
            >
              {saving ? 'Saving...' : 'Save Table'}
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
      ) : tables.length === 0 ? (
        <EmptyState title="No tables configured" description="Add dining tables for dine-in orders." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#343238] bg-[#151518]">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-[#343238] text-xs text-[#AAA69C]">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Label</th>
                <th className="px-4 py-3 font-semibold">Capacity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343238]/60">
              {tables.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-mono-tabular font-semibold text-[#E7CB78]">
                    {t.table_code}
                  </td>
                  <td className="px-4 py-3 text-[#F7F5EF]">
                    {t.display_name}
                    {t.is_demo && <span className="ml-2 text-xs text-[#AAA69C]">· Demo</span>}
                  </td>
                  <td className="px-4 py-3 font-mono-tabular text-xs text-[#AAA69C]">
                    {t.capacity ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={t.is_active ? 'text-[#4CAF78]' : 'text-[#E06A6A]'}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="inline-flex items-center gap-1 rounded border border-[#343238] px-2.5 py-1 text-xs text-[#E7CB78]"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(t)}
                        aria-label={`Delete ${t.table_code}`}
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
        title="Delete Table"
        description={`Remove table "${deleteTarget?.table_code}"?`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await adminDeleteTable(deleteTarget.id);
          setDeleteTarget(null);
          await loadTables();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
