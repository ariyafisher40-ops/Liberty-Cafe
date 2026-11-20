import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useAuth } from '../../features/auth/AuthContext';
import { validateEmailRequired, validatePassword } from '../../lib/validators';
import { signUpCustomer } from '../../services/auth.service';

export function SignupPage() {
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmMessage(null);

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    const emailErr = validateEmailRequired(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    const passErr = validatePassword(password);
    if (passErr) {
      setError(passErr);
      return;
    }

    setLoading(true);
    try {
      const res = await signUpCustomer({
        full_name: fullName,
        email,
        password,
        phone,
      });
      if (res.requiresEmailConfirmation) {
        setConfirmMessage(
          'Account created. Check your inbox to confirm your email address before signing in.'
        );
      } else {
        await refreshAuth();
        navigate('/account', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-6 sm:p-8">
          <p className="text-xs font-medium tracking-wider text-[#D4AF37]">CUSTOMER ACCOUNT</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#F7F5EF]">
            Create Account
          </h1>
          <p className="mt-1.5 text-sm text-[#AAA69C]">
            Save delivery addresses and track your order history. Guest checkout remains always
            available without an account.
          </p>

          {error && (
            <div className="mt-5">
              <FeedbackBanner tone="error" message={error} />
            </div>
          )}

          {confirmMessage && (
            <div className="mt-5">
              <FeedbackBanner tone="success" title="Check Your Email" message={confirmMessage} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="su-name" className="block text-xs font-semibold text-[#F7F5EF]">
                Full Name *
              </label>
              <input
                id="su-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="su-phone" className="block text-xs font-semibold text-[#F7F5EF]">
                Mobile Phone (Optional)
              </label>
              <input
                id="su-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="su-email" className="block text-xs font-semibold text-[#F7F5EF]">
                Email Address *
              </label>
              <input
                id="su-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="su-password" className="block text-xs font-semibold text-[#F7F5EF]">
                Password (min. 8 characters) *
              </label>
              <input
                id="su-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="min-h-11 w-full rounded-md bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0B0B0D] transition-colors hover:bg-[#E7CB78] disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Customer Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#AAA69C]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#E7CB78] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
