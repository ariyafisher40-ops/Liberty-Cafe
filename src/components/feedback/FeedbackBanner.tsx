import { AlertCircle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

export function FeedbackBanner({
  tone = 'info',
  title,
  message,
  onRetry,
  action,
}: {
  tone?: 'info' | 'success' | 'error';
  title?: string;
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  const Icon =
    tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;

  const toneStyles =
    tone === 'error'
      ? 'border-[#E06A6A]/45 bg-[#E06A6A]/10 text-[#F7F5EF]'
      : tone === 'success'
      ? 'border-[#4CAF78]/45 bg-[#4CAF78]/10 text-[#F7F5EF]'
      : 'border-[#343238] bg-[#151518] text-[#F7F5EF]';

  const iconColor =
    tone === 'error'
      ? 'text-[#E06A6A]'
      : tone === 'success'
      ? 'text-[#4CAF78]'
      : 'text-[#D4AF37]';

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${toneStyles}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
        <div className="space-y-0.5 text-sm">
          {title && <p className="font-semibold text-[#F7F5EF]">{title}</p>}
          <p className="text-[#AAA69C]">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-md border border-[#343238] bg-[#1D1D21] px-3 py-1.5 text-xs font-medium text-[#F7F5EF] transition-colors hover:border-[#D4AF37]/60 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        )}
        {action}
      </div>
    </div>
  );
}

export function LoadingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-lg border border-[#343238] bg-[#151518]"
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-[#1D1D21]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-[#1D1D21]" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-[#1D1D21]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#1D1D21]" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 w-20 animate-pulse rounded bg-[#1D1D21]" />
              <div className="h-9 w-24 animate-pulse rounded bg-[#1D1D21]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[#343238] bg-[#151518] px-6 py-14 text-center">
      <h3 className="font-display text-xl font-semibold text-[#F7F5EF]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[#AAA69C]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
