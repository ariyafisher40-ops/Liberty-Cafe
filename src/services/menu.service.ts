import { env } from '../lib/env';
import { supabase } from '../lib/supabase';
import type {
  AddOnRow,
  BannerRow,
  CategoryRow,
  CouponRow,
  DeliveryZoneRow,
  ProductRow,
  ProductVariantRow,
  RestaurantTableRow,
  ReviewRow,
} from '../types/database';
import type { HomePageData, ProductWithDetails, ReviewWithDetails } from '../types/domain';
import { previewStore } from './previewStore';

export type MenuSortOption = 'featured' | 'price_asc' | 'price_desc' | 'name_asc';

export interface MenuQueryParams {
  categorySlug?: string;
  search?: string;
  includeUnavailable?: boolean;
  sort?: MenuSortOption;
}

export async function getHomePageData(): Promise<HomePageData> {
  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    const activeCategories = state.categories
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
    const activeCategoryIds = new Set(activeCategories.map((c) => c.id));
    const activeProducts = state.products.filter((p) => activeCategoryIds.has(p.category_id));
    const categoryCounts: Record<string, number> = {};
    for (const prod of activeProducts) {
      categoryCounts[prod.category_id] = (categoryCounts[prod.category_id] ?? 0) + 1;
    }

    const availableProducts = activeProducts
      .filter((p) => p.is_available)
      .map((p) => previewStore.hydrateProduct(p, state));

    return {
      hero_banners: state.banners
        .filter((b) => b.is_active && b.placement === 'home_hero')
        .sort((a, b) => a.sort_order - b.sort_order),
      promo_banners: state.banners
        .filter((b) => b.is_active && b.placement === 'home_promo')
        .sort((a, b) => a.sort_order - b.sort_order),
      categories: activeCategories,
      category_counts: categoryCounts,
      featured_products: availableProducts.filter((p) => p.is_featured).slice(0, 6),
      best_sellers: availableProducts.filter((p) => p.is_best_seller).slice(0, 6),
      active_coupons: state.coupons.filter((c) => c.is_active),
    };
  }

  const [bannersRes, categoriesRes, productsRes, variantsRes, linksRes, addOnsRes, couponsRes] =
    await Promise.all([
      supabase
        .from('banners')
        .select('id, title, subtitle, image_path, cta_label, cta_path, placement, sort_order, is_active, is_demo, starts_at, ends_at, created_at, updated_at')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('categories')
        .select('id, name, slug, description, image_path, sort_order, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('products')
        .select('id, category_id, name, slug, short_description, description, image_path, base_price, compare_at_price, is_featured, is_best_seller, is_available, is_demo, sort_order, created_at, updated_at')
        .eq('is_available', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('product_variants')
        .select('id, product_id, name, price_delta, is_available, sort_order, created_at')
        .eq('is_available', true),
      supabase.from('product_add_ons').select('product_id, add_on_id'),
      supabase
        .from('add_ons')
        .select('id, name, description, price, is_available, sort_order, created_at, updated_at')
        .eq('is_available', true),
      supabase
        .from('coupons')
        .select('id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, expires_at, usage_limit, per_user_limit, is_active, is_demo, created_at, updated_at')
        .eq('is_active', true),
    ]);

  if (categoriesRes.error || productsRes.error) {
    throw new Error('Unable to load menu catalogue from Supabase.');
  }

  const categories = (categoriesRes.data ?? []) as CategoryRow[];
  const products = (productsRes.data ?? []) as ProductRow[];
  const variants = (variantsRes.data ?? []) as ProductVariantRow[];
  const links = (linksRes.data ?? []) as Array<{ product_id: string; add_on_id: string }>;
  const addOns = (addOnsRes.data ?? []) as AddOnRow[];
  const banners = (bannersRes.data ?? []) as BannerRow[];
  const coupons = (couponsRes.data ?? []) as CouponRow[];

  const hydrated = hydrateProducts(products, categories, variants, links, addOns);
  const categoryCounts: Record<string, number> = {};
  for (const prod of hydrated) {
    categoryCounts[prod.category_id] = (categoryCounts[prod.category_id] ?? 0) + 1;
  }

  return {
    hero_banners: banners.filter((b) => b.placement === 'home_hero'),
    promo_banners: banners.filter((b) => b.placement === 'home_promo'),
    categories,
    category_counts: categoryCounts,
    featured_products: hydrated.filter((p) => p.is_featured).slice(0, 6),
    best_sellers: hydrated.filter((p) => p.is_best_seller).slice(0, 6),
    active_coupons: coupons,
  };
}

export async function listActiveCategories(): Promise<CategoryRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return previewStore
      .getState()
      .categories.filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_path, sort_order, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error('Unable to load categories.');
  return (data ?? []) as CategoryRow[];
}

export async function listMenuProducts(params: MenuQueryParams = {}): Promise<ProductWithDetails[]> {
  let products: ProductWithDetails[] = [];

  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    const activeCatIds = new Set(state.categories.filter((c) => c.is_active).map((c) => c.id));
    products = state.products
      .filter((p) => activeCatIds.has(p.category_id))
      .map((p) => previewStore.hydrateProduct(p, state));
  } else {
    const [catRes, prodRes, varRes, linkRes, addRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, description, image_path, sort_order, is_active, created_at, updated_at')
        .eq('is_active', true),
      supabase
        .from('products')
        .select('id, category_id, name, slug, short_description, description, image_path, base_price, compare_at_price, is_featured, is_best_seller, is_available, is_demo, sort_order, created_at, updated_at')
        .order('sort_order', { ascending: true }),
      supabase
        .from('product_variants')
        .select('id, product_id, name, price_delta, is_available, sort_order, created_at')
        .eq('is_available', true),
      supabase.from('product_add_ons').select('product_id, add_on_id'),
      supabase
        .from('add_ons')
        .select('id, name, description, price, is_available, sort_order, created_at, updated_at')
        .eq('is_available', true),
    ]);

    if (catRes.error || prodRes.error) {
      throw new Error('Unable to load menu items.');
    }
    products = hydrateProducts(
      (prodRes.data ?? []) as ProductRow[],
      (catRes.data ?? []) as CategoryRow[],
      (varRes.data ?? []) as ProductVariantRow[],
      (linkRes.data ?? []) as Array<{ product_id: string; add_on_id: string }>,
      (addRes.data ?? []) as AddOnRow[]
    );
  }

  if (params.categorySlug) {
    products = products.filter((p) => p.category?.slug === params.categorySlug);
  }
  if (params.includeUnavailable === false) {
    products = products.filter((p) => p.is_available);
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.short_description ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.category?.name ?? '').toLowerCase().includes(q)
    );
  }

  switch (params.sort) {
    case 'price_asc':
      products.sort((a, b) => Number(a.base_price) - Number(b.base_price));
      break;
    case 'price_desc':
      products.sort((a, b) => Number(b.base_price) - Number(a.base_price));
      break;
    case 'name_asc':
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      products.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return a.sort_order - b.sort_order;
      });
  }

  return products;
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  if (!env.isSupabaseConfigured || !supabase) {
    const state = previewStore.getState();
    const product = state.products.find((p) => p.slug === slug);
    if (!product) return null;
    return previewStore.hydrateProduct(product, state);
  }

  const { data: prod, error } = await supabase
    .from('products')
    .select('id, category_id, name, slug, short_description, description, image_path, base_price, compare_at_price, is_featured, is_best_seller, is_available, is_demo, sort_order, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error('Unable to load product details.');
  if (!prod) return null;

  const product = prod as ProductRow;

  const [catRes, varRes, linkRes, addRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description, image_path, sort_order, is_active, created_at, updated_at')
      .eq('id', product.category_id)
      .maybeSingle(),
    supabase
      .from('product_variants')
      .select('id, product_id, name, price_delta, is_available, sort_order, created_at')
      .eq('product_id', product.id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true }),
    supabase.from('product_add_ons').select('product_id, add_on_id').eq('product_id', product.id),
    supabase
      .from('add_ons')
      .select('id, name, description, price, is_available, sort_order, created_at, updated_at')
      .eq('is_available', true)
      .order('sort_order', { ascending: true }),
  ]);

  const linkedIds = new Set(
    ((linkRes.data ?? []) as Array<{ add_on_id: string }>).map((l) => l.add_on_id)
  );

  return {
    ...product,
    category: (catRes.data as CategoryRow | null) ?? null,
    variants: (varRes.data ?? []) as ProductVariantRow[],
    add_ons: ((addRes.data ?? []) as AddOnRow[]).filter((a) => linkedIds.has(a.id)),
  };
}

export async function listActiveCoupons(): Promise<CouponRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return previewStore.getState().coupons.filter((c) => c.is_active);
  }

  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, expires_at, usage_limit, per_user_limit, is_active, is_demo, created_at, updated_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Unable to load active offers.');
  return (data ?? []) as CouponRow[];
}

export async function listActiveDeliveryZones(): Promise<DeliveryZoneRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return previewStore.getState().delivery_zones.filter((z) => z.is_active);
  }

  const { data, error } = await supabase
    .from('delivery_zones')
    .select('id, name, city, area_names, delivery_fee, min_order_amount, estimated_minutes, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('city', { ascending: true });

  if (error) throw new Error('Unable to load delivery zones.');
  return (data ?? []) as DeliveryZoneRow[];
}

export async function listActiveTables(): Promise<RestaurantTableRow[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return previewStore
      .getState()
      .tables.filter((t) => t.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('id, table_code, display_name, capacity, is_active, is_demo, sort_order, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error('Unable to load dine-in tables.');
  return (data ?? []) as RestaurantTableRow[];
}

export async function listPublishedProductReviews(productId: string): Promise<ReviewWithDetails[]> {
  if (!env.isSupabaseConfigured || !supabase) {
    return previewStore
      .getState()
      .reviews.filter((r) => r.product_id === productId && r.status === 'published')
      .map((r) => ({ ...r, customer_name: 'Verified Guest' }));
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, product_id, order_id, rating, title, comment, status, created_at, updated_at')
    .eq('product_id', productId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Unable to load product reviews.');
  return ((data ?? []) as ReviewRow[]).map((r) => ({ ...r }));
}

function hydrateProducts(
  products: ProductRow[],
  categories: CategoryRow[],
  variants: ProductVariantRow[],
  links: Array<{ product_id: string; add_on_id: string }>,
  addOns: AddOnRow[]
): ProductWithDetails[] {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const addOnMap = new Map(addOns.map((a) => [a.id, a]));

  return products
    .filter((p) => catMap.has(p.category_id))
    .map((product) => {
      const prodVariants = variants
        .filter((v) => v.product_id === product.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const prodAddOns = links
        .filter((l) => l.product_id === product.id)
        .map((l) => addOnMap.get(l.add_on_id))
        .filter((a): a is AddOnRow => Boolean(a))
        .sort((a, b) => a.sort_order - b.sort_order);
      return {
        ...product,
        category: catMap.get(product.category_id) ?? null,
        variants: prodVariants,
        add_ons: prodAddOns,
      };
    });
}
