import { env } from '../lib/env';
import { supabase } from '../lib/supabase';
import { validateImageFile } from '../lib/validators';
import type {
  AddOnRow,
  BannerRow,
  CategoryRow,
  CouponRow,
  DeliveryZoneRow,
  OrderPaymentStatus,
  OrderRow,
  OrderStatus,
  ProductRow,
  ProductVariantRow,
  RestaurantTableRow,
  ReviewRow,
  ReviewStatus,
  StorageBucket,
} from '../types/database';
import type {
  AdminMetrics,
  OrderWithDetails,
  ProductWithDetails,
  ReviewWithDetails,
} from '../types/domain';
import { hydrateOrdersFromSupabase } from './order.service';
import { previewStore } from './previewStore';

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    const todayOrders = state.orders.filter((o) => o.placed_at >= todayIso);
    const salesToday = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + Number(o.grand_total), 0);
    const pendingOrders = state.orders.filter(
      (o) => !['delivered', 'completed', 'cancelled'].includes(o.status)
    ).length;

    return {
      orders_today: todayOrders.length,
      sales_today: Number(salesToday.toFixed(2)),
      pending_orders: pendingOrders,
      active_products: state.products.filter((p) => p.is_available).length,
      customers_count: 0,
      is_preview: true,
    };
  }

  const [todayOrdersRes, pendingRes, productsRes, customersRes] = await Promise.all([
    supabase
      .from('orders')
      .select('grand_total, status')
      .gte('placed_at', todayIso),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_available', true),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer'),
  ]);

  const todayRows = (todayOrdersRes.data ?? []) as Array<{ grand_total: number; status: OrderStatus }>;
  const salesToday = todayRows
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + Number(o.grand_total), 0);

  return {
    orders_today: todayRows.length,
    sales_today: Number(salesToday.toFixed(2)),
    pending_orders: pendingRes.count ?? 0,
    active_products: productsRes.count ?? 0,
    customers_count: customersRes.count ?? 0,
    is_preview: false,
  };
}

export async function adminListOrders(): Promise<OrderWithDetails[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return [...previewStore.getState().orders].sort((a, b) =>
      b.placed_at.localeCompare(a.placed_at)
    );
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, tracking_token_hash, user_id, order_type, status, customer_name, customer_phone, customer_email, address_id, delivery_address_snapshot, delivery_zone_id, table_id, table_code_snapshot, pickup_time, subtotal, discount_total, delivery_fee, tax_total, grand_total, coupon_id, payment_method, payment_status, customer_note, admin_note, placed_at, updated_at, cancelled_at')
    .order('placed_at', { ascending: false })
    .limit(200);

  if (error) throw new Error('Unable to load orders.');
  return hydrateOrdersFromSupabase((data ?? []) as OrderRow[]);
}

export async function adminGetOrderById(orderId: string): Promise<OrderWithDetails | null> {
  if (!env.isSupabaseConfigured || !supabase) {
    return previewStore.getState().orders.find((o) => o.id === orderId) ?? null;
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, tracking_token_hash, user_id, order_type, status, customer_name, customer_phone, customer_email, address_id, delivery_address_snapshot, delivery_zone_id, table_id, table_code_snapshot, pickup_time, subtotal, discount_total, delivery_fee, tax_total, grand_total, coupon_id, payment_method, payment_status, customer_note, admin_note, placed_at, updated_at, cancelled_at')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw new Error('Unable to load order.');
  if (!data) return null;
  const [hydrated] = await hydrateOrdersFromSupabase([data as OrderRow]);
  return hydrated ?? null;
}

export async function adminUpdateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
  adminNote?: string
): Promise<void> {
  const now = new Date().toISOString();

  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const historyEntry = {
          id: `osh-${Date.now()}`,
          order_id: orderId,
          old_status: o.status,
          new_status: newStatus,
          note: note?.trim() || null,
          changed_by: s.preview_user?.id ?? null,
          created_at: now,
        };
        return {
          ...o,
          status: newStatus,
          admin_note: adminNote !== undefined ? adminNote : o.admin_note,
          cancelled_at: newStatus === 'cancelled' ? now : o.cancelled_at,
          updated_at: now,
          status_history: [...o.status_history, historyEntry],
        };
      }),
    }));
    return;
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      admin_note: adminNote,
      cancelled_at: newStatus === 'cancelled' ? now : undefined,
      updated_at: now,
    })
    .eq('id', orderId);

  if (error) throw new Error('Failed to update order status.');

  if (note?.trim()) {
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      new_status: newStatus,
      note: note.trim(),
    });
  }
}

export async function adminUpdatePaymentStatus(
  orderId: string,
  paymentId: string | null,
  decision: 'paid' | 'rejected' | 'unpaid'
): Promise<void> {
  const now = new Date().toISOString();
  const orderPaymentStatus: OrderPaymentStatus =
    decision === 'paid' ? 'paid' : decision === 'rejected' ? 'failed' : 'unpaid';

  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          payment_status: orderPaymentStatus,
          updated_at: now,
          payments: o.payments.map((p) =>
            !paymentId || p.id === paymentId
              ? {
                  ...p,
                  status: decision,
                  verified_by: s.preview_user?.id ?? null,
                  verified_at: now,
                  updated_at: now,
                }
              : p
          ),
        };
      }),
    }));
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: orderErr } = await supabase
    .from('orders')
    .update({ payment_status: orderPaymentStatus, updated_at: now })
    .eq('id', orderId);

  if (orderErr) throw new Error('Unable to update order payment status.');

  if (paymentId) {
    const { error: payErr } = await supabase
      .from('payments')
      .update({
        status: decision,
        verified_by: user?.id ?? null,
        verified_at: now,
        updated_at: now,
      })
      .eq('id', paymentId);
    if (payErr) throw new Error('Unable to update payment verification record.');
  }
}

export async function adminListAllProducts(): Promise<ProductWithDetails[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    return state.products
      .map((p) => previewStore.hydrateProduct(p, state))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const [catRes, prodRes, varRes, linkRes, addRes] = await Promise.all([
    supabase.from('categories').select('id, name, slug, description, image_path, sort_order, is_active, created_at, updated_at'),
    supabase
      .from('products')
      .select('id, category_id, name, slug, short_description, description, image_path, base_price, compare_at_price, is_featured, is_best_seller, is_available, is_demo, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase.from('product_variants').select('id, product_id, name, price_delta, is_available, sort_order, created_at'),
    supabase.from('product_add_ons').select('product_id, add_on_id'),
    supabase.from('add_ons').select('id, name, description, price, is_available, sort_order, created_at, updated_at'),
  ]);

  if (prodRes.error) throw new Error('Unable to load products.');
  const cats = new Map(((catRes.data ?? []) as CategoryRow[]).map((c) => [c.id, c]));
  const vars = (varRes.data ?? []) as ProductVariantRow[];
  const links = (linkRes.data ?? []) as Array<{ product_id: string; add_on_id: string }>;
  const addOns = new Map(((addRes.data ?? []) as AddOnRow[]).map((a) => [a.id, a]));

  return ((prodRes.data ?? []) as ProductRow[]).map((p) => ({
    ...p,
    category: cats.get(p.category_id) ?? null,
    variants: vars.filter((v) => v.product_id === p.id).sort((a, b) => a.sort_order - b.sort_order),
    add_ons: links
      .filter((l) => l.product_id === p.id)
      .map((l) => addOns.get(l.add_on_id))
      .filter((a): a is AddOnRow => Boolean(a)),
  }));
}

export async function adminGetProductById(productId: string): Promise<ProductWithDetails | null> {
  const all = await adminListAllProducts();
  return all.find((p) => p.id === productId) ?? null;
}

export interface SaveProductInput {
  id?: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  image_path: string | null;
  base_price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  is_best_seller: boolean;
  is_available: boolean;
  is_demo: boolean;
  sort_order: number;
  variants: Array<{
    id?: string;
    name: string;
    price_delta: number;
    is_available: boolean;
    sort_order: number;
  }>;
  add_on_ids: string[];
}

export async function adminSaveProduct(input: SaveProductInput): Promise<ProductRow> {
  const now = new Date().toISOString();
  const normalizedSlug = input.slug.trim().toLowerCase();

  if (!normalizedSlug) {
    throw new Error('A valid URL slug is required.');
  }

  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    const productId = input.id ?? `prod-${Date.now()}`;
    const existing = state.products.find((p) => p.id === productId);
    const slugConflict = state.products.find(
      (p) => p.slug.toLowerCase() === normalizedSlug && p.id !== productId
    );
    if (slugConflict) {
      throw new Error(`URL slug "${normalizedSlug}" is already in use by "${slugConflict.name}".`);
    }

    const nextProd: ProductRow = {
      id: productId,
      category_id: input.category_id,
      name: input.name.trim(),
      slug: normalizedSlug,
      short_description: input.short_description.trim() || null,
      description: input.description.trim() || null,
      image_path: input.image_path,
      base_price: Number(input.base_price),
      compare_at_price:
        input.compare_at_price !== null && input.compare_at_price > 0
          ? Number(input.compare_at_price)
          : null,
      is_featured: input.is_featured,
      is_best_seller: input.is_best_seller,
      is_available: input.is_available,
      is_demo: input.is_demo,
      sort_order: Number(input.sort_order) || 0,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };

    const nextVariants: ProductVariantRow[] = input.variants
      .filter((v) => v.name.trim().length > 0)
      .map((v, idx) => ({
        id: v.id ?? `var-${productId}-${idx}-${Date.now()}`,
        product_id: productId,
        name: v.name.trim(),
        price_delta: Number(v.price_delta) || 0,
        is_available: v.is_available,
        sort_order: idx + 1,
        created_at: now,
      }));

    const nextLinks = input.add_on_ids.map((addOnId) => ({
      product_id: productId,
      add_on_id: addOnId,
    }));

    previewStore.updateState((s) => {
      const editedIds = previewStore.isSeededDemoId(productId)
        ? Array.from(new Set([...s.edited_demo_product_ids, productId]))
        : s.edited_demo_product_ids;
      return {
        ...s,
        edited_demo_product_ids: editedIds,
        products: existing
          ? s.products.map((p) => (p.id === productId ? nextProd : p))
          : [...s.products, nextProd],
        variants: [...s.variants.filter((v) => v.product_id !== productId), ...nextVariants],
        product_add_ons: [
          ...s.product_add_ons.filter((l) => l.product_id !== productId),
          ...nextLinks,
        ],
      };
    });

    return nextProd;
  }

  const payload = {
    category_id: input.category_id,
    name: input.name.trim(),
    slug: normalizedSlug,
    short_description: input.short_description.trim() || null,
    description: input.description.trim() || null,
    image_path: input.image_path,
    base_price: Number(input.base_price),
    compare_at_price:
      input.compare_at_price !== null && input.compare_at_price > 0
        ? Number(input.compare_at_price)
        : null,
    is_featured: input.is_featured,
    is_best_seller: input.is_best_seller,
    is_available: input.is_available,
    is_demo: input.is_demo,
    sort_order: Number(input.sort_order) || 0,
    updated_at: now,
  };

  let savedProduct: ProductRow;
  if (input.id) {
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', input.id)
      .select('id, category_id, name, slug, short_description, description, image_path, base_price, compare_at_price, is_featured, is_best_seller, is_available, is_demo, sort_order, created_at, updated_at')
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new Error(`URL slug "${normalizedSlug}" is already used by another product.`);
      }
      throw new Error(error.message || 'Unable to update product.');
    }
    savedProduct = data as ProductRow;
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select('id, category_id, name, slug, short_description, description, image_path, base_price, compare_at_price, is_featured, is_best_seller, is_available, is_demo, sort_order, created_at, updated_at')
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new Error(`URL slug "${normalizedSlug}" is already used by another product.`);
      }
      throw new Error(error.message || 'Unable to create product.');
    }
    savedProduct = data as ProductRow;
  }

  await supabase.from('product_variants').delete().eq('product_id', savedProduct.id);
  const validVariants = input.variants.filter((v) => v.name.trim().length > 0);
  if (validVariants.length > 0) {
    await supabase.from('product_variants').insert(
      validVariants.map((v, idx) => ({
        product_id: savedProduct.id,
        name: v.name.trim(),
        price_delta: Number(v.price_delta) || 0,
        is_available: v.is_available,
        sort_order: idx + 1,
      }))
    );
  }

  await supabase.from('product_add_ons').delete().eq('product_id', savedProduct.id);
  if (input.add_on_ids.length > 0) {
    await supabase.from('product_add_ons').insert(
      input.add_on_ids.map((addOnId) => ({
        product_id: savedProduct.id,
        add_on_id: addOnId,
      }))
    );
  }

  return savedProduct;
}

export async function adminDeleteProduct(productId: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => {
      const deletedIds = previewStore.isSeededDemoId(productId)
        ? Array.from(new Set([...s.deleted_demo_product_ids, productId]))
        : s.deleted_demo_product_ids;
      return {
        ...s,
        deleted_demo_product_ids: deletedIds,
        edited_demo_product_ids: s.edited_demo_product_ids.filter((id) => id !== productId),
        products: s.products.filter((p) => p.id !== productId),
        variants: s.variants.filter((v) => v.product_id !== productId),
        product_add_ons: s.product_add_ons.filter((pa) => pa.product_id !== productId),
        // Preserve historical order-item snapshots while setting product_id to null (ON DELETE SET NULL)
        orders: s.orders.map((order) => ({
          ...order,
          items: order.items.map((item) =>
            item.product_id === productId ? { ...item, product_id: null } : item
          ),
        })),
      };
    });
    return;
  }

  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) {
    throw new Error(
      'Unable to delete this product due to a database reference constraint. You can mark it unavailable instead.'
    );
  }
}

export async function adminListCategories(): Promise<CategoryRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return [...previewStore.getState().categories].sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_path, sort_order, is_active, created_at, updated_at')
    .order('sort_order', { ascending: true });
  if (error) throw new Error('Unable to load categories.');
  return (data ?? []) as CategoryRow[];
}

export async function adminSaveCategory(
  input: Omit<CategoryRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<void> {
  const now = new Date().toISOString();
  if (!env.isSupabaseConfigured || !supabase) {
    const id = input.id ?? `cat-${Date.now()}`;
    previewStore.updateState((s) => {
      const existing = s.categories.find((c) => c.id === id);
      const next: CategoryRow = {
        ...input,
        id,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      return {
        ...s,
        categories: existing
          ? s.categories.map((c) => (c.id === id ? next : c))
          : [...s.categories, next],
      };
    });
    return;
  }

  const payload = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description,
    image_path: input.image_path,
    sort_order: input.sort_order,
    is_active: input.is_active,
    updated_at: now,
  };
  const { error } = input.id
    ? await supabase.from('categories').update(payload).eq('id', input.id)
    : await supabase.from('categories').insert(payload);
  if (error) throw new Error(error.message || 'Unable to save category.');
}

export async function adminDeleteCategory(id: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    const hasProducts = previewStore.getState().products.some((p) => p.category_id === id);
    if (hasProducts) {
      throw new Error('Move or remove products in this category first, or deactivate the category instead.');
    }
    previewStore.updateState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
    }));
    return;
  }
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error('Unable to delete category with linked products. Deactivate it instead.');
}

export async function adminListAddOns(): Promise<AddOnRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return [...previewStore.getState().add_ons].sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await supabase
    .from('add_ons')
    .select('id, name, description, price, is_available, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });
  if (error) throw new Error('Unable to load add-ons.');
  return (data ?? []) as AddOnRow[];
}

export async function adminSaveAddOn(
  input: Omit<AddOnRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<void> {
  const now = new Date().toISOString();
  if (!env.isSupabaseConfigured || !supabase) {
    const id = input.id ?? `addon-${Date.now()}`;
    previewStore.updateState((s) => {
      const existing = s.add_ons.find((a) => a.id === id);
      const next: AddOnRow = {
        ...input,
        id,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      return {
        ...s,
        add_ons: existing ? s.add_ons.map((a) => (a.id === id ? next : a)) : [...s.add_ons, next],
      };
    });
    return;
  }

  const payload = {
    name: input.name.trim(),
    description: input.description,
    price: Number(input.price),
    is_available: input.is_available,
    sort_order: input.sort_order,
    updated_at: now,
  };
  const { error } = input.id
    ? await supabase.from('add_ons').update(payload).eq('id', input.id)
    : await supabase.from('add_ons').insert(payload);
  if (error) throw new Error('Unable to save add-on.');
}

export async function adminDeleteAddOn(id: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      add_ons: s.add_ons.filter((a) => a.id !== id),
      product_add_ons: s.product_add_ons.filter((l) => l.add_on_id !== id),
    }));
    return;
  }
  const { error } = await supabase.from('add_ons').delete().eq('id', id);
  if (error) throw new Error('Unable to delete add-on.');
}

export async function adminListCoupons(): Promise<CouponRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return [...previewStore.getState().coupons];
  }
  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, expires_at, usage_limit, per_user_limit, is_active, is_demo, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load coupons.');
  return (data ?? []) as CouponRow[];
}

export async function adminSaveCoupon(
  input: Omit<CouponRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<void> {
  const now = new Date().toISOString();
  if (!env.isSupabaseConfigured || !supabase) {
    const id = input.id ?? `coupon-${Date.now()}`;
    previewStore.updateState((s) => {
      const existing = s.coupons.find((c) => c.id === id);
      const next: CouponRow = {
        ...input,
        id,
        code: input.code.trim().toUpperCase(),
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      return {
        ...s,
        coupons: existing ? s.coupons.map((c) => (c.id === id ? next : c)) : [next, ...s.coupons],
      };
    });
    return;
  }

  const payload = {
    code: input.code.trim().toUpperCase(),
    description: input.description,
    discount_type: input.discount_type,
    discount_value: Number(input.discount_value),
    min_order_amount: Number(input.min_order_amount) || 0,
    max_discount_amount: input.max_discount_amount !== null ? Number(input.max_discount_amount) : null,
    starts_at: input.starts_at,
    expires_at: input.expires_at,
    usage_limit: input.usage_limit,
    per_user_limit: Number(input.per_user_limit) || 1,
    is_active: input.is_active,
    is_demo: input.is_demo,
    updated_at: now,
  };
  const { error } = input.id
    ? await supabase.from('coupons').update(payload).eq('id', input.id)
    : await supabase.from('coupons').insert(payload);
  if (error) throw new Error(error.message || 'Unable to save coupon.');
}

export async function adminDeleteCoupon(id: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      coupons: s.coupons.filter((c) => c.id !== id),
    }));
    return;
  }
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw new Error('Unable to delete coupon.');
}

export async function adminListDeliveryZones(): Promise<DeliveryZoneRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return [...previewStore.getState().delivery_zones];
  }
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('id, name, city, area_names, delivery_fee, min_order_amount, estimated_minutes, is_active, created_at, updated_at')
    .order('city', { ascending: true });
  if (error) throw new Error('Unable to load delivery zones.');
  return (data ?? []) as DeliveryZoneRow[];
}

export async function adminSaveDeliveryZone(
  input: Omit<DeliveryZoneRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<void> {
  const now = new Date().toISOString();
  if (!env.isSupabaseConfigured || !supabase) {
    const id = input.id ?? `zone-${Date.now()}`;
    previewStore.updateState((s) => {
      const existing = s.delivery_zones.find((z) => z.id === id);
      const next: DeliveryZoneRow = {
        ...input,
        id,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      return {
        ...s,
        delivery_zones: existing
          ? s.delivery_zones.map((z) => (z.id === id ? next : z))
          : [...s.delivery_zones, next],
      };
    });
    return;
  }

  const payload = {
    name: input.name.trim(),
    city: input.city.trim(),
    area_names: input.area_names,
    delivery_fee: Number(input.delivery_fee) || 0,
    min_order_amount: Number(input.min_order_amount) || 0,
    estimated_minutes: input.estimated_minutes,
    is_active: input.is_active,
    updated_at: now,
  };
  const { error } = input.id
    ? await supabase.from('delivery_zones').update(payload).eq('id', input.id)
    : await supabase.from('delivery_zones').insert(payload);
  if (error) throw new Error('Unable to save delivery zone.');
}

export async function adminDeleteDeliveryZone(id: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      delivery_zones: s.delivery_zones.filter((z) => z.id !== id),
    }));
    return;
  }
  const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
  if (error) throw new Error('Unable to delete delivery zone.');
}

export async function adminListTables(): Promise<RestaurantTableRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return [...previewStore.getState().tables].sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('id, table_code, display_name, capacity, is_active, is_demo, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });
  if (error) throw new Error('Unable to load tables.');
  return (data ?? []) as RestaurantTableRow[];
}

export async function adminSaveTable(
  input: Omit<RestaurantTableRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<void> {
  const now = new Date().toISOString();
  if (!env.isSupabaseConfigured || !supabase) {
    const id = input.id ?? `table-${Date.now()}`;
    previewStore.updateState((s) => {
      const existing = s.tables.find((t) => t.id === id);
      const next: RestaurantTableRow = {
        ...input,
        id,
        table_code: input.table_code.trim().toUpperCase(),
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      return {
        ...s,
        tables: existing ? s.tables.map((t) => (t.id === id ? next : t)) : [...s.tables, next],
      };
    });
    return;
  }

  const payload = {
    table_code: input.table_code.trim().toUpperCase(),
    display_name: input.display_name.trim(),
    capacity: input.capacity,
    is_active: input.is_active,
    is_demo: input.is_demo,
    sort_order: input.sort_order,
    updated_at: now,
  };
  const { error } = input.id
    ? await supabase.from('restaurant_tables').update(payload).eq('id', input.id)
    : await supabase.from('restaurant_tables').insert(payload);
  if (error) throw new Error('Unable to save table.');
}

export async function adminDeleteTable(id: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      tables: s.tables.filter((t) => t.id !== id),
    }));
    return;
  }
  const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
  if (error) throw new Error('Unable to delete table.');
}

export async function adminListReviews(): Promise<ReviewWithDetails[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    const prodMap = new Map(state.products.map((p) => [p.id, p.name]));
    return state.reviews.map((r) => ({
      ...r,
      product_name: prodMap.get(r.product_id) ?? 'Menu Item',
    }));
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, product_id, order_id, rating, title, comment, status, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load reviews.');
  return (data ?? []) as ReviewRow[];
}

export async function adminUpdateReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  const now = new Date().toISOString();
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      reviews: s.reviews.map((r) => (r.id === id ? { ...r, status, updated_at: now } : r)),
    }));
    return;
  }
  const { error } = await supabase
    .from('reviews')
    .update({ status, updated_at: now })
    .eq('id', id);
  if (error) throw new Error('Unable to moderate review.');
}

export async function adminListBanners(): Promise<BannerRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return [...previewStore.getState().banners].sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await supabase
    .from('banners')
    .select('id, title, subtitle, image_path, cta_label, cta_path, placement, sort_order, is_active, is_demo, starts_at, ends_at, created_at, updated_at')
    .order('sort_order', { ascending: true });
  if (error) throw new Error('Unable to load banners.');
  return (data ?? []) as BannerRow[];
}

export async function adminSaveBanner(
  input: Omit<BannerRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<void> {
  const now = new Date().toISOString();
  if (!env.isSupabaseConfigured || !supabase) {
    const id = input.id ?? `banner-${Date.now()}`;
    previewStore.updateState((s) => {
      const existing = s.banners.find((b) => b.id === id);
      const next: BannerRow = {
        ...input,
        id,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      return {
        ...s,
        banners: existing ? s.banners.map((b) => (b.id === id ? next : b)) : [...s.banners, next],
      };
    });
    return;
  }

  const payload = {
    title: input.title.trim(),
    subtitle: input.subtitle,
    image_path: input.image_path,
    cta_label: input.cta_label,
    cta_path: input.cta_path,
    placement: input.placement,
    sort_order: input.sort_order,
    is_active: input.is_active,
    is_demo: input.is_demo,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    updated_at: now,
  };
  const { error } = input.id
    ? await supabase.from('banners').update(payload).eq('id', input.id)
    : await supabase.from('banners').insert(payload);
  if (error) throw new Error('Unable to save banner.');
}

export async function adminDeleteBanner(id: string): Promise<void> {
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      banners: s.banners.filter((b) => b.id !== id),
    }));
    return;
  }
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw new Error('Unable to delete banner.');
}

export async function uploadPublicAsset(
  bucket: Exclude<StorageBucket, 'payment-proofs'>,
  entityId: string,
  file: File
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  if (!env.isSupabaseConfigured || !supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Could not read selected image file.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read selected image file.'));
      reader.readAsDataURL(file);
    });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${entityId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (error) throw new Error('Image upload failed. Check storage bucket policies.');
  return path;
}
