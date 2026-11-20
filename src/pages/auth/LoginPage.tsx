import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useAuth } from '../../features/auth/AuthContext';
import { env } from '../../lib/env';
import { validateEmailRequired } from '../../lib/validators';
import { signInWithEmail } from '../../services/auth.service';

export function LoginPage() {
  const { refreshAuth, enterPreviewSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailErr = validateEmailRequired(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const session = await signInWithEmail(email, password);
      await refreshAuth();
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate(session.profile?.role === 'admin' ? '/admin' : '/account', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewEnter = (role: 'customer' | 'admin') => {
    enterPreviewSession(role);
    if (redirectTo && (role === 'admin' || !redirectTo.startsWith('/admin'))) {
      navigate(redirectTo, { replace: true });
      return;
    }
    navigate(role === 'admin' ? '/admin' : '/account', { replace: true });
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-6 sm:p-8">
          <p className="text-xs font-medium tracking-wider text-[#D4AF37]">ACCOUNT ACCESS</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#F7F5EF]">Sign In</h1>
          <p className="mt-1.5 text-sm text-[#AAA69C]">
            Access your saved addresses, order history, or staff portal.
          </p>

          {!env.isSupabaseConfigured && (
            <div className="mt-5">
              <FeedbackBanner
                tone="info"
                title="Supabase Setup Pending"
                message="Live Supabase Auth is not connected in this environment yet. You can preview customer or admin interfaces locally below."
              />
            </div>
          )}

          {error && (
            <div className="mt-5">
              <FeedbackBanner tone="error" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#F7F5EF]">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#F7F5EF]"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#E7CB78] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {!env.isSupabaseConfigured && (
            <div className="mt-6 border-t border-[#343238] pt-5">
              <p className="text-xs font-semibold text-[#AAA69C]">
                Local UI Preview Sessions (Non-production)
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handlePreviewEnter('customer')}
                  className="min-h-10 rounded-md border border-[#343238] bg-[#0B0B0D] px-3 py-2 text-xs font-semibold text-[#F7F5EF] hover:border-[#D4AF37]"
                >
                  Preview Customer
                </button>
                <button
                  type="button"
                  onClick={() => handlePreviewEnter('admin')}
                  className="min-h-10 rounded-md border border-[#D4AF37]/60 bg-[#1D1D21] px-3 py-2 text-xs font-semibold text-[#E7CB78] hover:bg-[#D4AF37] hover:text-[#0B0B0D]"
                >
                  Preview Admin
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-[#AAA69C]">
            New to Liberty Cafe?{' '}
            <Link to="/signup" className="font-semibold text-[#E7CB78] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
