import { env } from '../lib/env';
import { supabase } from '../lib/supabase';
import type { CouponRow, OrderItemAddOnRow, OrderItemRow, OrderRow, OrderStatusHistoryRow, PaymentRow, ReviewRow } from '../types/database';
import type { OrderWithDetails, PlaceOrderPayload, PlaceOrderResult } from '../types/domain';
import { previewStore } from './previewStore';

export interface CouponPreviewEstimate {
  coupon: CouponRow;
  estimatedDiscount: number;
}

export async function validateCouponEstimate(
  code: string,
  subtotal: number
): Promise<CouponPreviewEstimate> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    throw new Error('Enter a coupon code.');
  }

  let coupon: CouponRow | null = null;

  if (!env.isSupabaseConfigured || !supabase) {
    coupon =
      previewStore
        .getState()
        .coupons.find((c) => c.code.toUpperCase() === normalized && c.is_active) ?? null;
  } else {
    const { data, error } = await supabase
      .from('coupons')
      .select('id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, expires_at, usage_limit, per_user_limit, is_active, is_demo, created_at, updated_at')
      .eq('code', normalized)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new Error('Unable to validate coupon right now.');
    coupon = (data as CouponRow | null) ?? null;
  }

  if (!coupon) {
    throw new Error(`Coupon "${normalized}" was not found or is inactive.`);
  }

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    throw new Error(`Coupon "${normalized}" is not active yet.`);
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    throw new Error(`Coupon "${normalized}" has expired.`);
  }
  if (subtotal < Number(coupon.min_order_amount)) {
    throw new Error(
      `Minimum subtotal of PKR ${coupon.min_order_amount} is required for "${normalized}".`
    );
  }

  let discount =
    coupon.discount_type === 'percentage'
      ? (subtotal * Number(coupon.discount_value)) / 100
      : Number(coupon.discount_value);

  if (coupon.max_discount_amount !== null) {
    discount = Math.min(discount, Number(coupon.max_discount_amount));
  }
  discount = Number(Math.min(discount, subtotal).toFixed(2));

  return { coupon, estimatedDiscount: discount };
}

/**
 * Trusted order creation boundary:
 * Never inserts directly into orders/order_items from the browser.
 * Calls Supabase RPC `place_order` when configured; otherwise uses previewStore validation.
 */
export async function placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  if (!env.isSupabaseConfigured || !supabase) {
    return previewStore.placePreviewOrder(payload);
  }

  const { data, error } = await supabase.rpc('place_order', {
    p_payload: payload,
  });

  if (error) {
    throw new Error(error.message || 'Order could not be placed. Please review your details.');
  }

  const result = data as {
    order_id: string;
    order_number: string;
    tracking_token?: string | null;
  } | null;

  if (!result?.order_number) {
    throw new Error('Unexpected response from order service.');
  }

  const order = await getOrderForConfirmation(result.order_number, result.tracking_token ?? null);
  if (!order) {
    throw new Error('Order created, but confirmation details could not be loaded.');
  }

  return {
    order_id: result.order_id,
    order_number: result.order_number,
    tracking_token: result.tracking_token ?? null,
    order,
    is_preview: false,
  };
}

export async function getOrderForConfirmation(
  orderNumber: string,
  trackingToken: string | null
): Promise<OrderWithDetails | null> {
  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    const order = state.orders.find((o) => o.order_number === orderNumber);
    if (!order) return null;
    const isSignedInOwner = state.preview_user && order.user_id === state.preview_user.id;
    const isAdmin = state.preview_user?.role === 'admin';
    const tokenMatches = trackingToken && order.tracking_token_hash === trackingToken;
    if (isSignedInOwner || isAdmin || tokenMatches) {
      return order;
    }
    return null;
  }

  if (trackingToken) {
    const { data, error } = await supabase.rpc('track_guest_order', {
      p_order_number: orderNumber,
      p_verification: trackingToken,
    });
    if (!error && data) {
      return data as OrderWithDetails;
    }
  }

  return getCustomerOrderByNumber(orderNumber);
}

export async function trackGuestOrder(
  orderNumber: string,
  verification: string
): Promise<OrderWithDetails> {
  const cleanOrder = orderNumber.trim().toUpperCase();
  const cleanVerify = verification.trim();
  if (!cleanOrder || !cleanVerify) {
    throw new Error('Both order number and tracking token or phone number are required.');
  }

  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    const match = state.orders.find((o) => {
      if (o.order_number.toUpperCase() !== cleanOrder) return false;
      const tokenMatch = o.tracking_token_hash === cleanVerify;
      const phoneClean = o.customer_phone.replace(/\D/g, '');
      const verifyDigits = cleanVerify.replace(/\D/g, '');
      const phoneMatch = verifyDigits.length >= 7 && phoneClean === verifyDigits;
      return tokenMatch || phoneMatch;
    });
    if (!match) {
      throw new Error('No matching order found. Check your order number and phone or tracking token.');
    }
    return match;
  }

  const { data, error } = await supabase.rpc('track_guest_order', {
    p_order_number: cleanOrder,
    p_verification: cleanVerify,
  });

  if (error || !data) {
    throw new Error('Order not found or verification details did not match.');
  }

  return data as OrderWithDetails;
}

export async function getCustomerOrders(): Promise<OrderWithDetails[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    if (!state.preview_user) return [];
    return state.orders
      .filter((o) => o.user_id === state.preview_user!.id)
      .sort((a, b) => b.placed_at.localeCompare(a.placed_at));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, tracking_token_hash, user_id, order_type, status, customer_name, customer_phone, customer_email, address_id, delivery_address_snapshot, delivery_zone_id, table_id, table_code_snapshot, pickup_time, subtotal, discount_total, delivery_fee, tax_total, grand_total, coupon_id, payment_method, payment_status, customer_note, admin_note, placed_at, updated_at, cancelled_at')
    .eq('user_id', user.id)
    .order('placed_at', { ascending: false });

  if (error) throw new Error('Unable to load your orders.');
  const orderRows = (orders ?? []) as OrderRow[];
  return hydrateOrdersFromSupabase(orderRows);
}

export async function getCustomerOrderByNumber(orderNumber: string): Promise<OrderWithDetails | null> {
  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    if (!state.preview_user) return null;
    return (
      state.orders.find(
        (o) => o.order_number === orderNumber && o.user_id === state.preview_user!.id
      ) ?? null
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, tracking_token_hash, user_id, order_type, status, customer_name, customer_phone, customer_email, address_id, delivery_address_snapshot, delivery_zone_id, table_id, table_code_snapshot, pickup_time, subtotal, discount_total, delivery_fee, tax_total, grand_total, coupon_id, payment_method, payment_status, customer_note, admin_note, placed_at, updated_at, cancelled_at')
    .eq('order_number', orderNumber)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error('Unable to load order details.');
  if (!data) return null;
  const [hydrated] = await hydrateOrdersFromSupabase([data as OrderRow]);
  return hydrated ?? null;
}

export async function submitOrderProductReview(input: {
  order_id: string;
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
}): Promise<ReviewRow> {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error('Please choose a rating between 1 and 5.');
  }

  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    if (!state.preview_user) throw new Error('Sign in to submit a review.');
    const order = state.orders.find(
      (o) =>
        o.id === input.order_id &&
        o.user_id === state.preview_user!.id &&
        (o.status === 'completed' || o.status === 'delivered')
    );
    if (!order) {
      throw new Error('Reviews are available once your order is delivered or completed.');
    }
    const now = new Date().toISOString();
    const row: ReviewRow = {
      id: `rev-${Date.now()}`,
      user_id: state.preview_user.id,
      product_id: input.product_id,
      order_id: input.order_id,
      rating: input.rating,
      title: input.title?.trim() || null,
      comment: input.comment?.trim() || null,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };
    previewStore.updateState((s) => ({
      ...s,
      reviews: [row, ...s.reviews],
    }));
    return row;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required to submit a review.');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      product_id: input.product_id,
      order_id: input.order_id,
      rating: input.rating,
      title: input.title?.trim() || null,
      comment: input.comment?.trim() || null,
    })
    .select('id, user_id, product_id, order_id, rating, title, comment, status, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(error.message || 'Unable to submit review.');
  }
  return data as ReviewRow;
}

export async function hydrateOrdersFromSupabase(orderRows: OrderRow[]): Promise<OrderWithDetails[]> {
  if (!supabase || orderRows.length === 0) return [];
  const orderIds = orderRows.map((o) => o.id);

  const [itemsRes, paymentsRes, historyRes] = await Promise.all([
    supabase
      .from('order_items')
      .select('id, order_id, product_id, product_name_snapshot, product_image_snapshot, variant_name_snapshot, quantity, unit_price, line_total, special_instructions, created_at')
      .in('order_id', orderIds),
    supabase
      .from('payments')
      .select('id, order_id, method, amount, status, transaction_reference, proof_object_path, verified_by, verified_at, gateway_reference, created_at, updated_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('order_status_history')
      .select('id, order_id, old_status, new_status, note, changed_by, created_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: true }),
  ]);

  const items = (itemsRes.data ?? []) as OrderItemRow[];
  const itemIds = items.map((i) => i.id);
  let addOns: OrderItemAddOnRow[] = [];
  if (itemIds.length > 0) {
    const { data: addOnRows } = await supabase
      .from('order_item_add_ons')
      .select('id, order_item_id, add_on_name_snapshot, unit_price, quantity')
      .in('order_item_id', itemIds);
    addOns = (addOnRows ?? []) as OrderItemAddOnRow[];
  }

  const payments = (paymentsRes.data ?? []) as PaymentRow[];
  const histories = (historyRes.data ?? []) as OrderStatusHistoryRow[];

  return orderRows.map((order) => ({
    ...order,
    items: items
      .filter((i) => i.order_id === order.id)
      .map((item) => ({
        ...item,
        add_ons: addOns.filter((a) => a.order_item_id === item.id),
      })),
    payments: payments.filter((p) => p.order_id === order.id),
    status_history: histories.filter((h) => h.order_id === order.id),
  }));
}
