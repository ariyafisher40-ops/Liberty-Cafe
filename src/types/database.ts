/**
 * Database types matching 05_Backend_Schema.md exactly.
 * Used across the typed Supabase client and all services.
 */

export type UserRole = 'customer' | 'admin';

export type OrderType = 'delivery' | 'takeaway' | 'dine_in';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'cash_at_cafe'
  | 'jazzcash_manual'
  | 'easypaisa_manual'
  | 'bank_transfer_manual'
  | 'card_online_demo';

export type OrderPaymentStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentRecordStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'rejected';

export type DiscountType = 'percentage' | 'fixed';

export type ReviewStatus = 'pending' | 'published' | 'rejected';

export type BannerPlacement = 'home_hero' | 'home_promo';

export type StorageBucket =
  | 'product-images'
  | 'category-images'
  | 'banner-images'
  | 'payment-proofs';

export interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_path: string | null;
  base_price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  is_best_seller: boolean;
  is_available: boolean;
  is_demo: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface AddOnRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductAddOnRow {
  product_id: string;
  add_on_id: string;
}

export interface AddressRow {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  address_line: string;
  area: string;
  city: string;
  delivery_notes: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZoneRow {
  id: string;
  name: string;
  city: string;
  area_names: string[];
  delivery_fee: number;
  min_order_amount: number;
  estimated_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTableRow {
  id: string;
  table_code: string;
  display_name: string;
  capacity: number | null;
  is_active: boolean;
  is_demo: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  per_user_limit: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemptionRow {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id: string | null;
  discount_amount: number;
  redeemed_at: string;
}

export interface DeliveryAddressSnapshot {
  label?: string | null;
  recipient_name: string;
  phone: string;
  address_line: string;
  area: string;
  city: string;
  delivery_notes?: string | null;
}

export interface OrderRow {
  id: string;
  order_number: string;
  tracking_token_hash: string | null;
  user_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address_id: string | null;
  delivery_address_snapshot: DeliveryAddressSnapshot | null;
  delivery_zone_id: string | null;
  table_id: string | null;
  table_code_snapshot: string | null;
  pickup_time: string | null;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  tax_total: number;
  grand_total: number;
  coupon_id: string | null;
  payment_method: PaymentMethod;
  payment_status: OrderPaymentStatus;
  customer_note: string | null;
  admin_note: string | null;
  placed_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  product_image_snapshot: string | null;
  variant_name_snapshot: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  special_instructions: string | null;
  created_at: string;
}

export interface OrderItemAddOnRow {
  id: string;
  order_item_id: string;
  add_on_name_snapshot: string;
  unit_price: number;
  quantity: number;
}

export interface PaymentRow {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentRecordStatus;
  transaction_reference: string | null;
  proof_object_path: string | null;
  verified_by: string | null;
  verified_at: string | null;
  gateway_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistoryRow {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface BannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  image_path: string | null;
  cta_label: string | null;
  cta_path: string | null;
  placement: BannerPlacement;
  sort_order: number;
  is_active: boolean;
  is_demo: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingRow {
  id: string;
  key: string;
  value: Record<string, unknown> | string | number | boolean | null;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
}
