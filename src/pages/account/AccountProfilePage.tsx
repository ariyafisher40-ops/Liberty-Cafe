import { useEffect, useState } from 'react';
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { useAuth } from '../../features/auth/AuthContext';
import { updateOwnProfile } from '../../services/auth.service';

export function AccountProfilePage() {
  const { profile, email, refreshAuth } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setSaving(true);
    try {
      await updateOwnProfile({ full_name: fullName, phone });
      await refreshAuth();
      setMsg('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountLayout
      title="Profile Settings"
      subtitle="Update your name and contact phone number."
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-lg border border-[#343238] bg-[#151518] p-6"
      >
        {error && <FeedbackBanner tone="error" message={error} />}
        {msg && <FeedbackBanner tone="success" message={msg} />}

        <div>
          <label htmlFor="prof-email" className="block text-xs font-semibold text-[#AAA69C]">
            Email Address
          </label>
          <input
            id="prof-email"
            type="email"
            disabled
            value={email ?? ''}
            className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D]/60 px-3.5 text-sm text-[#AAA69C]"
          />
        </div>

        <div>
          <label htmlFor="prof-name" className="block text-xs font-semibold text-[#F7F5EF]">
            Full Name *
          </label>
          <input
            id="prof-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#F7F5EF]">
            Mobile Phone
          </label>
          <input
            id="prof-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div>
          <p className="text-xs text-[#AAA69C]">
            Account role: <span className="font-semibold text-[#F7F5EF]">{profile?.role}</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded-md bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </AccountLayout>
  );
}
