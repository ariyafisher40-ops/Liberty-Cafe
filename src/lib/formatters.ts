import type {
  OrderPaymentStatus,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentRecordStatus,
  ReviewStatus,
} from '../types/database';

export function formatCurrency(amount: number, currency = 'PKR'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safe);
  return `${currency} ${formatted}`;
}

export function formatDateTime(iso: string | null | undefined, timeZone = 'Asia/Karachi'): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatOrderType(type: OrderType): string {
  switch (type) {
    case 'delivery':
      return 'Home Delivery';
    case 'takeaway':
      return 'Takeaway / Pickup';
    case 'dine_in':
      return 'Dine-in';
  }
}

export function formatOrderStatus(status: OrderStatus | string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case 'cash_on_delivery':
      return 'Cash on Delivery';
    case 'cash_at_cafe':
      return 'Cash at Cafe / Counter';
    case 'jazzcash_manual':
      return 'JazzCash (Manual Transfer)';
    case 'easypaisa_manual':
      return 'Easypaisa (Manual Transfer)';
    case 'bank_transfer_manual':
      return 'Bank Transfer (Manual Transfer)';
    case 'card_online_demo':
      return 'Card / Online Payment (Demo Only — no real charge)';
  }
}

export function formatPaymentStatus(status: OrderPaymentStatus | PaymentRecordStatus): string {
  switch (status) {
    case 'unpaid':
      return 'Unpaid';
    case 'pending_verification':
      return 'Pending Verification';
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Failed';
    case 'refunded':
      return 'Refunded';
    case 'rejected':
      return 'Rejected';
  }
}

export function formatReviewStatus(status: ReviewStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'published':
      return 'Published';
    case 'rejected':
      return 'Rejected';
  }
}

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
