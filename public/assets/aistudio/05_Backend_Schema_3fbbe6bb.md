# Liberty Cafe — Backend Schema (Supabase)

**Document:** 05_Backend_Schema.md  
**Version:** 1.1  
**Purpose:** Database design contract for the later Supabase setup. This document does **not** create a Supabase project or database.

## 1. General Conventions

- PostgreSQL via Supabase.
- UUID primary keys using `gen_random_uuid()` unless otherwise stated.
- `created_at timestamptz not null default now()` and `updated_at timestamptz not null default now()` on mutable records.
- Prices and money: `numeric(10,2)` in PKR; never use floating-point for money.
- Slugs are lowercase URL-safe text.
- Enable **Row Level Security (RLS)** on every table exposed through the API.
- Use foreign keys and indexes for common filters/joins.
- Keep historical order values as snapshots so catalogue edits do not rewrite past orders.

## 2. Roles and Authentication

Supabase Auth owns authentication identities. Public table `profiles` extends `auth.users`.

### `profiles`
- `id uuid primary key references auth.users(id) on delete cascade`
- `full_name text`
- `phone text`
- `role text not null default 'customer' check (role in ('customer','admin'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rules:
- An `on_auth_user_created` trigger creates a profile with role `customer`.
- Signup input must never set `role`.
- Users may read/update only their own allowed profile fields; users cannot update `role`.
- Admin promotion is performed only by a trusted database owner/Supabase admin process.

## 3. Catalogue Tables

### `categories`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `slug text not null unique`
- `description text`
- `image_path text`
- `sort_order integer not null default 0`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `products`
- `id uuid primary key default gen_random_uuid()`
- `category_id uuid not null references categories(id)`
- `name text not null`
- `slug text not null unique`
- `short_description text`
- `description text`
- `image_path text`
- `base_price numeric(10,2) not null check (base_price >= 0)`
- `compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0)`
- `is_featured boolean not null default false`
- `is_best_seller boolean not null default false`
- `is_available boolean not null default true`
- `is_demo boolean not null default false`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `product_variants`
- `id uuid primary key default gen_random_uuid()`
- `product_id uuid not null references products(id) on delete cascade`
- `name text not null`
- `price_delta numeric(10,2) not null default 0`
- `is_available boolean not null default true`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`

Variant price = product `base_price` + `price_delta`; backend validates the selected variant.

### `add_ons`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `description text`
- `price numeric(10,2) not null default 0 check (price >= 0)`
- `is_available boolean not null default true`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `product_add_ons`
- `product_id uuid not null references products(id) on delete cascade`
- `add_on_id uuid not null references add_ons(id) on delete cascade`
- Primary key: `(product_id, add_on_id)`

## 4. Customer Address and Delivery Tables

### `addresses`
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references profiles(id) on delete cascade`
- `label text`
- `recipient_name text not null`
- `phone text not null`
- `address_line text not null`
- `area text not null`
- `city text not null`
- `delivery_notes text`
- `is_default boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Guest addresses are not inserted into `addresses`; they are stored as a snapshot on the guest order.

### `delivery_zones`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `city text not null`
- `area_names text[] not null default '{}'`
- `delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0)`
- `min_order_amount numeric(10,2) not null default 0 check (min_order_amount >= 0)`
- `estimated_minutes integer`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

No city/area is pre-filled as real business coverage. Admin enters confirmed delivery zones before accepting live delivery orders.

## 5. Dine-in Tables

### `restaurant_tables`
- `id uuid primary key default gen_random_uuid()`
- `table_code text not null unique`
- `display_name text not null`
- `capacity integer check (capacity is null or capacity > 0)`
- `is_active boolean not null default true`
- `is_demo boolean not null default false`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Optional preview seed may create `T01`–`T08` with `is_demo = true`; the user/admin must replace the list with actual cafe tables. This is a table selection list, not a reservation calendar.

## 6. Coupons and Offers

### `coupons`
- `id uuid primary key default gen_random_uuid()`
- `code text not null unique`
- `description text`
- `discount_type text not null check (discount_type in ('percentage','fixed'))`
- `discount_value numeric(10,2) not null check (discount_value > 0)`
- `min_order_amount numeric(10,2) not null default 0`
- `max_discount_amount numeric(10,2)`
- `starts_at timestamptz`
- `expires_at timestamptz`
- `usage_limit integer`
- `per_user_limit integer not null default 1`
- `is_active boolean not null default true`
- `is_demo boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `coupon_redemptions`
Create this table **after `orders`** in the migration sequence because it has a foreign key to `orders(id)`.
- `id uuid primary key default gen_random_uuid()`
- `coupon_id uuid not null references coupons(id)`
- `order_id uuid not null unique references orders(id)`
- `user_id uuid references profiles(id)`
- `discount_amount numeric(10,2) not null check (discount_amount >= 0)`
- `redeemed_at timestamptz not null default now()`

Coupon usage and per-user limits must be checked atomically during `place_order`.

## 7. Orders and Order Items

### `orders`
- `id uuid primary key default gen_random_uuid()`
- `order_number text not null unique` (generated server-side)
- `tracking_token_hash text` (store a hash, not the raw guest tracking token)
- `user_id uuid references profiles(id)` (null for guest orders)
- `order_type text not null check (order_type in ('delivery','takeaway','dine_in'))`
- `status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','out_for_delivery','delivered','completed','cancelled'))`
- `customer_name text not null`
- `customer_phone text not null`
- `customer_email text`
- `address_id uuid references addresses(id) on delete set null`
- `delivery_address_snapshot jsonb`
- `delivery_zone_id uuid references delivery_zones(id)`
- `table_id uuid references restaurant_tables(id)`
- `table_code_snapshot text`
- `pickup_time timestamptz`
- `subtotal numeric(10,2) not null check (subtotal >= 0)`
- `discount_total numeric(10,2) not null default 0 check (discount_total >= 0)`
- `delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0)`
- `tax_total numeric(10,2) not null default 0 check (tax_total >= 0)`
- `grand_total numeric(10,2) not null check (grand_total >= 0)`
- `coupon_id uuid references coupons(id) on delete set null`
- `payment_method text not null check (payment_method in ('cash_on_delivery','cash_at_cafe','jazzcash_manual','easypaisa_manual','bank_transfer_manual','card_online_demo'))`
- `payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending_verification','paid','failed','refunded'))`
- `customer_note text`
- `admin_note text`
- `placed_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `cancelled_at timestamptz`

Order-mode validation:
- `delivery`: require delivery address snapshot and active delivery zone; no table required.
- `takeaway`: no delivery zone/address required; pickup time optional.
- `dine_in`: require active table/table code; no delivery address required.

### `order_items`
- `id uuid primary key default gen_random_uuid()`
- `order_id uuid not null references orders(id) on delete cascade`
- `product_id uuid references products(id) on delete set null`
- `product_name_snapshot text not null`
- `product_image_snapshot text`
- `variant_name_snapshot text`
- `quantity integer not null check (quantity > 0)`
- `unit_price numeric(10,2) not null check (unit_price >= 0)`
- `line_total numeric(10,2) not null check (line_total >= 0)`
- `special_instructions text`
- `created_at timestamptz not null default now()`

### `order_item_add_ons`
- `id uuid primary key default gen_random_uuid()`
- `order_item_id uuid not null references order_items(id) on delete cascade`
- `add_on_name_snapshot text not null`
- `unit_price numeric(10,2) not null check (unit_price >= 0)`
- `quantity integer not null default 1 check (quantity > 0)`

## 8. Payments and Status History

### `payments`
- `id uuid primary key default gen_random_uuid()`
- `order_id uuid not null references orders(id) on delete cascade`
- `method text not null check (method in ('cash_on_delivery','cash_at_cafe','jazzcash_manual','easypaisa_manual','bank_transfer_manual','card_online_demo'))`
- `amount numeric(10,2) not null check (amount >= 0)`
- `status text not null default 'unpaid' check (status in ('unpaid','pending_verification','paid','failed','refunded','rejected'))`
- `transaction_reference text`
- `proof_object_path text`
- `verified_by uuid references profiles(id)`
- `verified_at timestamptz`
- `gateway_reference text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Never store full card number, CVV or raw card credentials. `card_online_demo` must never be marked paid by a demo simulation.

### `order_status_history`
- `id uuid primary key default gen_random_uuid()`
- `order_id uuid not null references orders(id) on delete cascade`
- `old_status text`
- `new_status text not null`
- `note text`
- `changed_by uuid references profiles(id)`
- `created_at timestamptz not null default now()`

Add a database trigger to append status history whenever `orders.status` changes. Prevent customers from directly changing order status.

## 9. Reviews, Banners and Settings

### `reviews`
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references profiles(id) on delete cascade`
- `product_id uuid not null references products(id) on delete cascade`
- `order_id uuid not null references orders(id) on delete cascade`
- `rating integer not null check (rating between 1 and 5)`
- `title text`
- `comment text`
- `status text not null default 'pending' check (status in ('pending','published','rejected'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Only an authenticated customer with an eligible completed order containing that product may submit a review. Admin moderates publication. No fabricated sample reviews should be seeded.

### `banners`
- `id uuid primary key default gen_random_uuid()`
- `title text not null`
- `subtitle text`
- `image_path text`
- `cta_label text`
- `cta_path text`
- `placement text not null default 'home_hero' check (placement in ('home_hero','home_promo'))`
- `sort_order integer not null default 0`
- `is_active boolean not null default true`
- `is_demo boolean not null default false`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `site_settings`
- `id uuid primary key default gen_random_uuid()`
- `key text not null unique`
- `value jsonb not null default '{}'::jsonb`
- `is_public boolean not null default false`
- `updated_by uuid references profiles(id)`
- `updated_at timestamptz not null default now()`

Suggested keys (values are placeholders until supplied): `restaurant_name`, `phone`, `whatsapp`, `address`, `city`, `opening_hours`, `currency`, `timezone`, `tax_rate`, `delivery_enabled`, `takeaway_enabled`, `dine_in_enabled`, `pickup_instructions`, `payment_methods`, `manual_payment_instructions`, `social_links`, `minimum_order_amount`.

## 10. Indexes and Constraints

Create indexes at minimum:
- `products(category_id, is_available, sort_order)`
- `products(is_featured, is_available)`
- `categories(is_active, sort_order)`
- `addresses(user_id)`
- `orders(user_id, placed_at desc)`
- `orders(status, placed_at desc)`
- `orders(order_number)` unique index (provided by unique constraint)
- `orders(delivery_zone_id)`
- `order_items(order_id)`
- `payments(order_id, created_at desc)`
- `order_status_history(order_id, created_at)`
- `reviews(product_id, status, created_at desc)`
- `delivery_zones(city, is_active)`
- `coupons(code, is_active)` unique on code

Use check constraints for non-negative money, valid quantity, rating range and allowed status/type values. Use transaction/locking logic for coupon usage limits.

## 11. Required Database Functions and Triggers

1. `set_updated_at()` — updates `updated_at` for mutable tables.
2. `handle_new_user()` — creates a customer profile after signup; ignores client-supplied role metadata.
3. `is_admin()` — safe helper for RLS checks; avoid recursive profile policy evaluation.
4. `generate_order_number()` — generates unique human-readable order numbers server-side.
5. `place_order(...)` — secure atomic order creation. Revalidates current product/variant/add-on prices, availability, order mode, delivery zone, coupon and payment selection; calculates totals; creates order and item snapshots; creates initial status history/payment record; returns only the necessary confirmation fields and a guest tracking token where applicable.
6. `log_order_status_change()` — inserts a status-history event whenever order status changes.

For any `SECURITY DEFINER` function: set a fixed safe `search_path`, validate all inputs, keep privileges minimal and grant execution only to the required roles. Do not trust client-submitted totals or user IDs.

## 12. Row Level Security (RLS) Policy Matrix

Enable RLS on all tables. Implement policies equivalent to the following:

| Table | Public/anon | Authenticated customer | Admin |
|---|---|---|---|
| `categories` | Select active only | Select active only | Full CRUD |
| `products` | Select available products in active categories | Same | Full CRUD |
| `product_variants` | Select available variants for public products | Same | Full CRUD |
| `add_ons` | Select available add-ons only when linked to public products | Same | Full CRUD |
| `product_add_ons` | Select links for public products | Same | Full CRUD |
| `profiles` | No access | Own row; no role update | Admin access as needed |
| `addresses` | No access | Own rows only | Admin support access only if explicitly required |
| `delivery_zones` | Select active zones and public delivery values | Same | Full CRUD |
| `restaurant_tables` | Select active table labels only if needed for dine-in | Same | Full CRUD |
| `coupons` | Select active, currently valid public coupon fields only | Same | Full CRUD |
| `coupon_redemptions` | No direct access | Own redemption summary only if needed | Read/manage |
| `orders` | No direct select/insert/update; create through secure function | Own orders read-only for status/payment fields | Read/update operational fields |
| `order_items` | No direct access | Read items belonging to own orders | Read/manage |
| `payments` | No direct access | Read own payment status; submit proof through secure flow | Read/update/verify |
| `order_status_history` | No direct access | Read history for own orders | Read/insert through trusted admin operations |
| `reviews` | Select published only | Read published; insert/update own eligible review | Moderate/manage |
| `banners` | Select active public banners | Same | Full CRUD |
| `site_settings` | Select rows where `is_public = true` | Same | Full CRUD |

Additional security notes:
- The `place_order` function is the only supported public order-creation path; do not expose direct insert into `orders` or `order_items` to anon users.
- Guest order status/detail retrieval must verify a hashed high-entropy tracking token or an equivalent second factor.
- Profile policies must prevent customers from changing `role`.
- Admin authority is checked server-side for every admin mutation.
- Policies must be tested using anon, customer A, customer B and admin accounts.

## 13. Storage Buckets and Policies

| Bucket | Access | Rules |
|---|---|---|
| `product-images` | Public read | Admin-only upload/update/delete |
| `category-images` | Public read | Admin-only upload/update/delete |
| `banner-images` | Public read | Admin-only upload/update/delete |
| `payment-proofs` | Private | Order owner and admin only; validate ownership and object path |

Suggested object path patterns:
- `product-images/{product_id}/{unique-file-name}`
- `category-images/{category_id}/{unique-file-name}`
- `banner-images/{banner_id}/{unique-file-name}`
- `payment-proofs/{order_id}/{user-or-guest-token-scope}/{unique-file-name}`

For guest payment proof, use a trusted upload flow that verifies the guest order token; do not grant broad anonymous read access to the private bucket.

## 14. Demo Seed Data

The initial catalogue seed must create exactly **150 demo products in 15 categories (10 products per category)** using the exact names and illustrative PKR prices in `01_PRD.md` Section 5. Every sample product must have `is_demo = true`, a stable unique slug, category foreign key and `is_available = true` by default. Use idempotent seed/upsert logic; never duplicate seed rows or overwrite an admin-edited product on each app load. The admin may create, update, mark unavailable or delete products. The `order_items.product_id` foreign key uses `ON DELETE SET NULL`; historical item name/price/description snapshots remain available after the catalogue item is removed.


Seed only clearly identified sample data:
- 15 categories and exactly 150 sample products listed in `01_PRD.md` Section 5, with 10 products per category and all with `is_demo = true`.
- Optional sample coupon `LIBERTY10` with `is_demo = true` and limited preview rules.
- Optional demo tables `T01`–`T08` with `is_demo = true`; admin must confirm actual table codes.
- Product image paths may be null until approved image assets are supplied; UI uses a local placeholder.

Do not seed real-looking customer accounts, fake testimonials, completed orders or fake sales totals.

## 15. Setup and Acceptance Checks

- Create a new Supabase project only after the user follows the GitHub + ChatGPT + Supabase stage in their workflow.
- Apply schema through reviewed SQL migrations.
- Verify foreign keys, indexes, constraints, triggers, functions and RLS.
- Test that customer A cannot read customer B's profile, addresses, order, payment or proof.
- Test non-admin cannot mutate admin resources.
- Verify exactly 150 unique demo products and 15 categories are seeded; test admin add, edit, availability toggle and delete actions.
- Verify deleting a catalogue item preserves historical order-item snapshots while setting `order_items.product_id` to null.
- Test anon cannot query private order/customer/payment tables.
- Test order totals are recalculated server-side and price manipulation is rejected.
- Test all three order modes and all demo payment states.
- Verify all public storage buckets expose only intended images; payment proofs remain private.
