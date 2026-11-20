import type {
  AddOnRow,
  BannerRow,
  CategoryRow,
  CouponRow,
  DeliveryAddressSnapshot,
  DeliveryZoneRow,
  OrderItemAddOnRow,
  OrderItemRow,
  OrderRow,
  OrderStatusHistoryRow,
  OrderType,
  PaymentMethod,
  PaymentRow,
  ProductRow,
  ProductVariantRow,
  RestaurantTableRow,
  ReviewRow,
} from './database';

export interface ProductWithDetails extends ProductRow {
  category?: CategoryRow | null;
  variants: ProductVariantRow[];
  add_ons: AddOnRow[];
}

export interface CartAddOnSelection {
  add_on_id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cart_item_id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  image_path: string | null;
  variant_id: string | null;
  variant_name: string | null;
  base_price: number;
  variant_price_delta: number;
  add_ons: CartAddOnSelection[];
  quantity: number;
  special_instructions: string;
  is_demo: boolean;
}

export interface SiteSettingsMap {
  restaurant_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  opening_hours: string;
  currency: string;
  timezone: string;
  tax_rate: number;
  delivery_enabled: boolean;
  takeaway_enabled: boolean;
  dine_in_enabled: boolean;
  pickup_instructions: string;
  minimum_order_amount: number;
  payment_methods: Record<PaymentMethod, boolean>;
  manual_payment_instructions: {
    jazzcash_manual: string;
    easypaisa_manual: string;
    bank_transfer_manual: string;
  };
  social_links: {
    instagram: string;
    facebook: string;
  };
}

export interface OrderItemWithAddOns extends OrderItemRow {
  add_ons: OrderItemAddOnRow[];
}

export interface OrderWithDetails extends OrderRow {
  items: OrderItemWithAddOns[];
  payments: PaymentRow[];
  status_history: OrderStatusHistoryRow[];
  delivery_zone?: DeliveryZoneRow | null;
  table?: RestaurantTableRow | null;
}

export interface PlaceOrderPayload {
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_note?: string | null;
  payment_method: PaymentMethod;
  coupon_code?: string | null;
  address_id?: string | null;
  delivery_address?: DeliveryAddressSnapshot | null;
  delivery_zone_id?: string | null;
  pickup_time?: string | null;
  table_id?: string | null;
  table_code?: string | null;
  transaction_reference?: string | null;
  items: Array<{
    product_id: string;
    variant_id: string | null;
    add_on_ids: string[];
    quantity: number;
    special_instructions?: string | null;
  }>;
}

export interface PlaceOrderResult {
  order_id: string;
  order_number: string;
  tracking_token: string | null;
  order: OrderWithDetails;
  is_preview: boolean;
}

export interface ReviewWithDetails extends ReviewRow {
  product_name?: string;
  customer_name?: string;
}

export interface AdminMetrics {
  orders_today: number;
  sales_today: number;
  pending_orders: number;
  active_products: number;
  customers_count: number;
  is_preview: boolean;
}

export interface HomePageData {
  hero_banners: BannerRow[];
  promo_banners: BannerRow[];
  categories: CategoryRow[];
  category_counts: Record<string, number>;
  featured_products: ProductWithDetails[];
  best_sellers: ProductWithDetails[];
  active_coupons: CouponRow[];
}
