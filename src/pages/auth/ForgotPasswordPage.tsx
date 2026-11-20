import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { validateEmailRequired } from '../../lib/validators';
import { sendPasswordResetEmail } from '../../services/auth.service';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailErr = validateEmailRequired(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <div className="rounded-lg border border-[#343238] bg-[#151518] p-6 sm:p-8">
          <p className="text-xs font-medium tracking-wider text-[#D4AF37]">ACCOUNT RECOVERY</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#F7F5EF]">
            Reset Password
          </h1>
          <p className="mt-1.5 text-sm text-[#AAA69C]">
            Enter the email address associated with your account to receive a reset link.
          </p>

          {error && (
            <div className="mt-5">
              <FeedbackBanner tone="error" message={error} />
            </div>
          )}

          {sent && (
            <div className="mt-5">
              <FeedbackBanner
                tone="success"
                title="Reset Link Sent"
                message="If an account matches that email, a password reset link has been sent."
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="fp-email" className="block text-xs font-semibold text-[#F7F5EF]">
                Email Address
              </label>
              <input
                id="fp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-md border border-[#343238] bg-[#0B0B0D] px-3.5 text-sm text-[#F7F5EF] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="min-h-11 w-full rounded-md bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0B0B0D] hover:bg-[#E7CB78] disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#AAA69C]">
            <Link to="/login" className="font-semibold text-[#E7CB78] hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
