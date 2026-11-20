import {
  DEFAULT_SITE_SETTINGS,
  DEMO_ADD_ONS,
  DEMO_BANNERS,
  DEMO_CATEGORIES,
  DEMO_COUPONS,
  DEMO_DELIVERY_ZONES,
  DEMO_PRODUCTS,
  DEMO_PRODUCT_ADD_ONS,
  DEMO_REVIEWS,
  DEMO_TABLES,
  DEMO_VARIANTS,
} from '../data/demoSeed';
import type {
  AddOnRow,
  AddressRow,
  BannerRow,
  CategoryRow,
  CouponRow,
  DeliveryZoneRow,
  OrderItemAddOnRow,
  OrderItemRow,
  OrderPaymentStatus,
  OrderRow,
  OrderStatus,
  OrderStatusHistoryRow,
  PaymentRow,
  ProductAddOnRow,
  ProductRow,
  ProductVariantRow,
  ProfileRow,
  RestaurantTableRow,
  ReviewRow,
} from '../types/database';
import type {
  OrderWithDetails,
  PlaceOrderPayload,
  PlaceOrderResult,
  ProductWithDetails,
  SiteSettingsMap,
} from '../types/domain';

const STORAGE_KEY = 'liberty_cafe_preview_store_v1';
const CURRENT_SEED_VERSION = '1.1';
const DEMO_PRODUCT_ID_SET = new Set(DEMO_PRODUCTS.map((p) => p.id));

export interface PreviewState {
  seed_version: string;
  edited_demo_product_ids: string[];
  deleted_demo_product_ids: string[];
  categories: CategoryRow[];
  products: ProductRow[];
  variants: ProductVariantRow[];
  add_ons: AddOnRow[];
  product_add_ons: ProductAddOnRow[];
  coupons: CouponRow[];
  delivery_zones: DeliveryZoneRow[];
  tables: RestaurantTableRow[];
  banners: BannerRow[];
  reviews: ReviewRow[];
  orders: OrderWithDetails[];
  addresses: AddressRow[];
  settings: SiteSettingsMap;
  preview_user: ProfileRow | null;
}

function createInitialState(): PreviewState {
  return {
    seed_version: CURRENT_SEED_VERSION,
    edited_demo_product_ids: [],
    deleted_demo_product_ids: [],
    categories: [...DEMO_CATEGORIES],
    products: [...DEMO_PRODUCTS],
    variants: [...DEMO_VARIANTS],
    add_ons: [...DEMO_ADD_ONS],
    product_add_ons: [...DEMO_PRODUCT_ADD_ONS],
    coupons: [...DEMO_COUPONS],
    delivery_zones: [...DEMO_DELIVERY_ZONES],
    tables: [...DEMO_TABLES],
    banners: [...DEMO_BANNERS],
    reviews: [...DEMO_REVIEWS],
    orders: [],
    addresses: [],
    settings: structuredClone(DEFAULT_SITE_SETTINGS),
    preview_user: null,
  };
}

/**
 * Idempotently reconciles the v1.1 demo seed into an existing preview store:
 * - Never duplicates categories, products, variants, add-ons, coupons, tables, or banners.
 * - Never overwrites demo products that an admin has already edited.
 * - Never re-inserts demo products that an admin has explicitly deleted.
 * - Upgrades v1.0 legacy preview stores to the 15-category / 150-product catalogue cleanly.
 */
function reconcileSeedIntoState(state: PreviewState, isUpgradeFromLegacy: boolean): PreviewState {
  const deletedProductSet = new Set(state.deleted_demo_product_ids);
  const editedProductSet = new Set(state.edited_demo_product_ids);

  let categories = [...state.categories];
  let products = [...state.products];
  let variants = [...state.variants];
  let productAddOns = [...state.product_add_ons];

  if (isUpgradeFromLegacy) {
    // Remove superseded v1.0 slug-based sample rows if untouched while keeping any custom items & orders
    const legacyV1CategoryIds = new Set(['cat-sandwiches', 'cat-sides', 'cat-shakes-drinks']);
    const legacyV1ProductPrefixIds = new Set([
      'prod-classic-beef-burger',
      'prod-crispy-chicken-burger',
      'prod-chicken-cheese-pizza',
      'prod-margherita-pizza',
      'prod-chicken-club-sandwich',
      'prod-loaded-fries',
      'prod-cappuccino',
      'prod-cafe-latte',
      'prod-iced-coffee',
      'prod-chocolate-milkshake',
      'prod-fresh-lemon-mint',
      'prod-chocolate-brownie',
    ]);
    categories = categories.filter((c) => !legacyV1CategoryIds.has(c.id));
    products = products.filter((p) => !legacyV1ProductPrefixIds.has(p.id));
    variants = variants.filter((v) => !legacyV1ProductPrefixIds.has(v.product_id));
    productAddOns = productAddOns.filter((l) => !legacyV1ProductPrefixIds.has(l.product_id));
  }

  const existingCategoryIds = new Set(categories.map((c) => c.id));
  for (const cat of DEMO_CATEGORIES) {
    if (!existingCategoryIds.has(cat.id)) {
      categories.push(cat);
      existingCategoryIds.add(cat.id);
    }
  }
  categories.sort((a, b) => a.sort_order - b.sort_order);

  const existingProductIds = new Set(products.map((p) => p.id));
  const existingProductSlugs = new Set(products.map((p) => p.slug));
  for (const prod of DEMO_PRODUCTS) {
    if (deletedProductSet.has(prod.id) || editedProductSet.has(prod.id)) {
      continue;
    }
    if (!existingProductIds.has(prod.id) && !existingProductSlugs.has(prod.slug)) {
      products.push(prod);
      existingProductIds.add(prod.id);
      existingProductSlugs.add(prod.slug);
    }
  }
  products.sort((a, b) => a.sort_order - b.sort_order);

  const existingVariantIds = new Set(variants.map((v) => v.id));
  for (const variant of DEMO_VARIANTS) {
    if (
      !deletedProductSet.has(variant.product_id) &&
      !editedProductSet.has(variant.product_id) &&
      !existingVariantIds.has(variant.id)
    ) {
      variants.push(variant);
      existingVariantIds.add(variant.id);
    }
  }

  const existingAddOnIds = new Set(state.add_ons.map((a) => a.id));
  const addOns = [...state.add_ons];
  for (const addOn of DEMO_ADD_ONS) {
    if (!existingAddOnIds.has(addOn.id)) {
      addOns.push(addOn);
      existingAddOnIds.add(addOn.id);
    }
  }

  const linkKeys = new Set(productAddOns.map((l) => `${l.product_id}:${l.add_on_id}`));
  for (const link of DEMO_PRODUCT_ADD_ONS) {
    const key = `${link.product_id}:${link.add_on_id}`;
    if (
      !deletedProductSet.has(link.product_id) &&
      !editedProductSet.has(link.product_id) &&
      !linkKeys.has(key)
    ) {
      productAddOns.push(link);
      linkKeys.add(key);
    }
  }

  return {
    ...state,
    seed_version: CURRENT_SEED_VERSION,
    categories,
    products,
    variants,
    add_ons: addOns,
    product_add_ons: productAddOns,
  };
}

function loadState(): PreviewState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<PreviewState>;
    const base = createInitialState();
    const merged: PreviewState = {
      ...base,
      ...parsed,
      seed_version: parsed.seed_version ?? '1.0',
      edited_demo_product_ids: parsed.edited_demo_product_ids ?? [],
      deleted_demo_product_ids: parsed.deleted_demo_product_ids ?? [],
      settings: {
        ...base.settings,
        ...(parsed.settings ?? {}),
        payment_methods: {
          ...base.settings.payment_methods,
          ...(parsed.settings?.payment_methods ?? {}),
        },
        manual_payment_instructions: {
          ...base.settings.manual_payment_instructions,
          ...(parsed.settings?.manual_payment_instructions ?? {}),
        },
        social_links: {
          ...base.settings.social_links,
          ...(parsed.settings?.social_links ?? {}),
        },
      },
    };

    if (merged.seed_version !== CURRENT_SEED_VERSION) {
      const upgraded = reconcileSeedIntoState(merged, true);
      saveState(upgraded);
      return upgraded;
    }

    return merged;
  } catch {
    return createInitialState();
  }
}

function saveState(state: PreviewState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

function randomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generatePreviewOrderNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `LC-${num}`;
}

function generateTrackingToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const previewStore = {
  getState(): PreviewState {
    return loadState();
  },

  updateState(updater: (current: PreviewState) => PreviewState): PreviewState {
    const next = updater(loadState());
    saveState(next);
    return next;
  },

  reset(): void {
    saveState(createInitialState());
  },

  rerunSeedIdempotent(): PreviewState {
    const next = reconcileSeedIntoState(loadState(), false);
    saveState(next);
    return next;
  },

  isSeededDemoId(productId: string): boolean {
    return DEMO_PRODUCT_ID_SET.has(productId);
  },

  hydrateProduct(product: ProductRow, state = loadState()): ProductWithDetails {
    const category = state.categories.find((c) => c.id === product.category_id) ?? null;
    const variants = state.variants
      .filter((v) => v.product_id === product.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const linkedIds = new Set(
      state.product_add_ons.filter((pa) => pa.product_id === product.id).map((pa) => pa.add_on_id)
    );
    const add_ons = state.add_ons
      .filter((a) => linkedIds.has(a.id))
      .sort((a, b) => a.sort_order - b.sort_order);
    return {
      ...product,
      category,
      variants,
      add_ons,
    };
  },

  placePreviewOrder(payload: PlaceOrderPayload): PlaceOrderResult {
    const state = loadState();
    const now = new Date().toISOString();

    if (!payload.customer_name.trim()) {
      throw new Error('Customer name is required.');
    }
    if (!payload.customer_phone.trim()) {
      throw new Error('Mobile phone number is required.');
    }
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Your cart is empty.');
    }

    if (payload.order_type === 'delivery' && !state.settings.delivery_enabled) {
      throw new Error('Home delivery is currently disabled.');
    }
    if (payload.order_type === 'takeaway' && !state.settings.takeaway_enabled) {
      throw new Error('Takeaway is currently disabled.');
    }
    if (payload.order_type === 'dine_in' && !state.settings.dine_in_enabled) {
      throw new Error('Dine-in ordering is currently disabled.');
    }

    if (!state.settings.payment_methods[payload.payment_method]) {
      throw new Error('Selected payment method is not enabled.');
    }

    const orderId = randomId('ord');
    const orderItems: OrderWithDetails['items'] = [];
    let subtotal = 0;

    for (const reqItem of payload.items) {
      if (!Number.isInteger(reqItem.quantity) || reqItem.quantity <= 0 || reqItem.quantity > 50) {
        throw new Error('Invalid item quantity.');
      }
      const product = state.products.find((p) => p.id === reqItem.product_id);
      const category = product ? state.categories.find((c) => c.id === product.category_id) : null;
      if (!product || !product.is_available || !category || !category.is_active) {
        throw new Error(
          product
            ? `"${product.name}" is currently unavailable.`
            : 'One of the selected items is no longer available.'
        );
      }

      let variantName: string | null = null;
      let variantDelta = 0;
      if (reqItem.variant_id) {
        const variant = state.variants.find(
          (v) => v.id === reqItem.variant_id && v.product_id === product.id && v.is_available
        );
        if (!variant) {
          throw new Error(`Selected option for "${product.name}" is unavailable.`);
        }
        variantName = variant.name;
        variantDelta = Number(variant.price_delta);
      }

      const linkedAddOnIds = new Set(
        state.product_add_ons.filter((pa) => pa.product_id === product.id).map((pa) => pa.add_on_id)
      );
      const orderItemId = randomId('oi');
      const itemAddOns: OrderItemAddOnRow[] = [];
      let addOnsTotalPerUnit = 0;

      for (const addOnId of reqItem.add_on_ids ?? []) {
        const addOn = state.add_ons.find(
          (a) => a.id === addOnId && a.is_available && linkedAddOnIds.has(a.id)
        );
        if (!addOn) {
          throw new Error(`An add-on selected for "${product.name}" is unavailable.`);
        }
        addOnsTotalPerUnit += Number(addOn.price);
        itemAddOns.push({
          id: randomId('oia'),
          order_item_id: orderItemId,
          add_on_name_snapshot: addOn.name,
          unit_price: Number(addOn.price),
          quantity: 1,
        });
      }

      const unitPrice = Number(product.base_price) + variantDelta + addOnsTotalPerUnit;
      const lineTotal = Number((unitPrice * reqItem.quantity).toFixed(2));
      subtotal += lineTotal;

      const itemRow: OrderItemRow = {
        id: orderItemId,
        order_id: orderId,
        product_id: product.id,
        product_name_snapshot: product.name,
        product_image_snapshot: product.image_path,
        variant_name_snapshot: variantName,
        quantity: reqItem.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        special_instructions: reqItem.special_instructions?.trim() || null,
        created_at: now,
      };
      orderItems.push({ ...itemRow, add_ons: itemAddOns });
    }

    subtotal = Number(subtotal.toFixed(2));

    let deliveryFee = 0;
    let deliveryZone: DeliveryZoneRow | null = null;
    if (payload.order_type === 'delivery') {
      if (!payload.delivery_address) {
        throw new Error('Delivery address is required for home delivery.');
      }
      const { recipient_name, phone, address_line, area, city } = payload.delivery_address;
      if (!recipient_name.trim() || !phone.trim() || !address_line.trim() || !area.trim() || !city.trim()) {
        throw new Error('Complete delivery address (name, phone, street, area, city) is required.');
      }
      const matchedZone = state.delivery_zones.find((z) => {
        if (!z.is_active) return false;
        if (payload.delivery_zone_id && z.id === payload.delivery_zone_id) return true;
        const cityMatch = z.city.trim().toLowerCase() === city.trim().toLowerCase();
        const areaMatch = z.area_names.some((a) => a.trim().toLowerCase() === area.trim().toLowerCase());
        return cityMatch && areaMatch;
      });
      if (!matchedZone) {
        throw new Error(
          'Your selected delivery area is not currently serviceable. Please choose Takeaway or Dine-in, or configure delivery zones in Admin.'
        );
      }
      if (subtotal < Number(matchedZone.min_order_amount)) {
        throw new Error(
          `Minimum order for ${matchedZone.name} is PKR ${matchedZone.min_order_amount}.`
        );
      }
      deliveryZone = matchedZone;
      deliveryFee = Number(matchedZone.delivery_fee);
    }

    let table: RestaurantTableRow | null = null;
    let tableCodeSnapshot: string | null = null;
    if (payload.order_type === 'dine_in') {
      if (payload.table_id) {
        table = state.tables.find((t) => t.id === payload.table_id && t.is_active) ?? null;
      } else if (payload.table_code) {
        table =
          state.tables.find(
            (t) =>
              t.table_code.toLowerCase() === payload.table_code!.trim().toLowerCase() &&
              t.is_active
          ) ?? null;
      }
      if (!table) {
        throw new Error('Please select a valid active dine-in table.');
      }
      tableCodeSnapshot = table.table_code;
    }

    let discountTotal = 0;
    let couponId: string | null = null;
    if (payload.coupon_code && payload.coupon_code.trim()) {
      const code = payload.coupon_code.trim().toUpperCase();
      const coupon = state.coupons.find((c) => c.code.toUpperCase() === code && c.is_active);
      if (!coupon) {
        throw new Error(`Coupon "${code}" is invalid or inactive.`);
      }
      const nowMs = Date.now();
      if (coupon.starts_at && new Date(coupon.starts_at).getTime() > nowMs) {
        throw new Error(`Coupon "${code}" is not active yet.`);
      }
      if (coupon.expires_at && new Date(coupon.expires_at).getTime() < nowMs) {
        throw new Error(`Coupon "${code}" has expired.`);
      }
      if (subtotal < Number(coupon.min_order_amount)) {
        throw new Error(
          `Coupon "${code}" requires a minimum order of PKR ${coupon.min_order_amount}.`
        );
      }
      if (coupon.discount_type === 'percentage') {
        discountTotal = (subtotal * Number(coupon.discount_value)) / 100;
        if (coupon.max_discount_amount !== null) {
          discountTotal = Math.min(discountTotal, Number(coupon.max_discount_amount));
        }
      } else {
        discountTotal = Number(coupon.discount_value);
      }
      discountTotal = Number(Math.min(discountTotal, subtotal).toFixed(2));
      couponId = coupon.id;
    }

    const taxRate = Number(state.settings.tax_rate) || 0;
    const taxableAmount = Math.max(0, subtotal - discountTotal);
    const taxTotal = Number(((taxableAmount * taxRate) / 100).toFixed(2));
    const grandTotal = Number((taxableAmount + deliveryFee + taxTotal).toFixed(2));

    const isManualTransfer =
      payload.payment_method === 'jazzcash_manual' ||
      payload.payment_method === 'easypaisa_manual' ||
      payload.payment_method === 'bank_transfer_manual';
    const hasRef = Boolean(payload.transaction_reference && payload.transaction_reference.trim());
    const initialPaymentStatus: OrderPaymentStatus =
      isManualTransfer && hasRef ? 'pending_verification' : 'unpaid';

    const orderNumber = generatePreviewOrderNumber();
    const trackingToken = generateTrackingToken();

    const orderRow: OrderRow = {
      id: orderId,
      order_number: orderNumber,
      tracking_token_hash: trackingToken,
      user_id: state.preview_user?.id ?? null,
      order_type: payload.order_type,
      status: 'pending',
      customer_name: payload.customer_name.trim(),
      customer_phone: payload.customer_phone.trim(),
      customer_email: payload.customer_email?.trim() || null,
      address_id: payload.address_id ?? null,
      delivery_address_snapshot: payload.order_type === 'delivery' ? payload.delivery_address ?? null : null,
      delivery_zone_id: deliveryZone?.id ?? null,
      table_id: table?.id ?? null,
      table_code_snapshot: tableCodeSnapshot,
      pickup_time: payload.order_type === 'takeaway' ? payload.pickup_time ?? null : null,
      subtotal,
      discount_total: discountTotal,
      delivery_fee: deliveryFee,
      tax_total: taxTotal,
      grand_total: grandTotal,
      coupon_id: couponId,
      payment_method: payload.payment_method,
      payment_status: initialPaymentStatus,
      customer_note: payload.customer_note?.trim() || null,
      admin_note: null,
      placed_at: now,
      updated_at: now,
      cancelled_at: null,
    };

    const paymentRow: PaymentRow = {
      id: randomId('pay'),
      order_id: orderId,
      method: payload.payment_method,
      amount: grandTotal,
      status: initialPaymentStatus,
      transaction_reference: payload.transaction_reference?.trim() || null,
      proof_object_path: null,
      verified_by: null,
      verified_at: null,
      gateway_reference: null,
      created_at: now,
      updated_at: now,
    };

    const historyRow: OrderStatusHistoryRow = {
      id: randomId('osh'),
      order_id: orderId,
      old_status: null,
      new_status: 'pending' as OrderStatus,
      note: 'Order placed (Local Preview Mode)',
      changed_by: state.preview_user?.id ?? null,
      created_at: now,
    };

    const fullOrder: OrderWithDetails = {
      ...orderRow,
      items: orderItems,
      payments: [paymentRow],
      status_history: [historyRow],
      delivery_zone: deliveryZone,
      table,
    };

    this.updateState((s) => ({
      ...s,
      orders: [fullOrder, ...s.orders],
    }));

    return {
      order_id: orderId,
      order_number: orderNumber,
      tracking_token: trackingToken,
      order: fullOrder,
      is_preview: true,
    };
  },
};
