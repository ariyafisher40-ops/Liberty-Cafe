import {
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { formatDateTime, formatOrderStatus, formatPaymentStatus } from '../../lib/formatters';
import type { OrderPaymentStatus, OrderStatus, OrderStatusHistoryRow, PaymentRecordStatus } from '../../types/database';

export function OrderStatusText({ status }: { status: OrderStatus | string }) {
  const Icon =
    status === 'cancelled'
      ? XCircle
      : status === 'delivered' || status === 'completed'
      ? CheckCircle2
      : status === 'out_for_delivery'
      ? Truck
      : status === 'ready'
      ? PackageCheck
      : status === 'preparing'
      ? ChefHat
      : Clock;

  const color =
    status === 'cancelled'
      ? 'text-[#E06A6A]'
      : status === 'delivered' || status === 'completed' || status === 'ready'
      ? 'text-[#4CAF78]'
      : 'text-[#E7CB78]';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${color} whitespace-nowrap`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{formatOrderStatus(status)}</span>
    </span>
  );
}

export function PaymentStatusText({
  status,
}: {
  status: OrderPaymentStatus | PaymentRecordStatus;
}) {
  const color =
    status === 'paid'
      ? 'text-[#4CAF78]'
      : status === 'failed' || status === 'rejected'
      ? 'text-[#E06A6A]'
      : status === 'pending_verification'
      ? 'text-[#E7CB78]'
      : 'text-[#AAA69C]';

  return (
    <span className={`text-xs font-semibold ${color} whitespace-nowrap`}>
      {formatPaymentStatus(status)}
    </span>
  );
}

export function OrderStatusTimeline({
  history,
  timeZone,
}: {
  history: OrderStatusHistoryRow[];
  timeZone?: string;
}) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-[#AAA69C]">No status updates recorded yet.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {history.map((entry, idx) => (
        <li
          key={entry.id}
          className="flex items-start justify-between gap-4 border-b border-[#343238]/60 pb-3 last:border-b-0 last:pb-0"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-tabular text-xs text-[#AAA69C]">
                {String(idx + 1).padStart(2, '0')}.
              </span>
              <OrderStatusText status={entry.new_status} />
            </div>
            {entry.note && <p className="text-sm text-[#AAA69C]">{entry.note}</p>}
          </div>
          <time className="font-mono-tabular text-xs text-[#AAA69C] whitespace-nowrap shrink-0">
            {formatDateTime(entry.created_at, timeZone)}
          </time>
        </li>
      ))}
    </ol>
  );
}
