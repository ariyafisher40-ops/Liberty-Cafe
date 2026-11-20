import { useCallback, useEffect, useState } from 'react';
import { EmptyState, FeedbackBanner } from '../../components/feedback/FeedbackBanner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useSettings } from '../../features/settings/SettingsContext';
import { formatDateTime, formatReviewStatus } from '../../lib/formatters';
import { adminListReviews, adminUpdateReviewStatus } from '../../services/admin.service';
import type { ReviewStatus } from '../../types/database';
import type { ReviewWithDetails } from '../../types/domain';

export function AdminReviewsPage() {
  const { settings } = useSettings();
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReviews(await adminListReviews());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handleModerate = async (id: string, status: ReviewStatus) => {
    await adminUpdateReviewStatus(id, status);
    await loadReviews();
  };

  return (
    <AdminLayout
      title="Reviews Moderation"
      subtitle="Approve or reject genuine customer reviews from eligible completed orders."
    >
      {error ? (
        <FeedbackBanner tone="error" message={error} onRetry={loadReviews} />
      ) : loading ? (
        <div className="h-44 animate-pulse rounded-lg bg-[#151518]" />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No customer reviews yet"
          description="Authentic reviews submitted by verified customers after completed orders will appear here for moderation."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <article
              key={rev.id}
              className="flex flex-col justify-between gap-4 rounded-lg border border-[#343238] bg-[#151518] p-5 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-xs text-[#AAA69C]">
                  {rev.product_name || 'Product'} · Rating{' '}
                  <span className="font-mono-tabular font-semibold text-[#E7CB78]">
                    {rev.rating}/5
                  </span>{' '}
                  · {formatReviewStatus(rev.status)} ·{' '}
                  {formatDateTime(rev.created_at, settings.timezone)}
                </p>
                {rev.title && (
                  <h2 className="mt-1 font-semibold text-[#F7F5EF]">{rev.title}</h2>
                )}
                {rev.comment && <p className="mt-1 text-sm text-[#AAA69C]">{rev.comment}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleModerate(rev.id, 'published')}
                  className="min-h-9 rounded-md bg-[#4CAF78] px-3 py-1.5 text-xs font-semibold text-[#0B0B0D]"
                >
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => handleModerate(rev.id, 'rejected')}
                  className="min-h-9 rounded-md bg-[#E06A6A] px-3 py-1.5 text-xs font-semibold text-[#0B0B0D]"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
