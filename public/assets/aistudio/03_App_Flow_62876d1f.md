# Liberty Cafe — User & Admin App Flow

**Document:** 03_App_Flow.md  
**Version:** 1.0

## 1. Navigation Structure

### Public navigation
Home · Menu · Offers · About · Contact · Cart · Account/Login

On mobile, use a compact menu and a persistent cart indicator. All public routes remain usable without login.

### Admin navigation
Dashboard · Orders · Products · Categories · Add-ons · Coupons · Delivery Zones · Tables · Reviews · Banners · Settings

Admin navigation is rendered only after the app confirms the signed-in user has the admin role. Supabase RLS independently enforces the same permission.

## 2. Visitor and Menu Flow

1. Visitor opens `/`.
2. Homepage loads active banners, categories, featured products and active offers.
3. If Supabase is not configured, show a polished setup/preview state and sample menu data; do not show a fake successful backend connection.
4. Visitor opens `/menu`, chooses a category or searches by name.
5. Visitor opens `/product/:productSlug`.
6. Product details show image, name, description, current price, availability, variant/add-ons (if any) and quantity.
7. Visitor adds the configured item to the cart.
8. Cart recalculates a display estimate; backend will revalidate all values at checkout.

### Menu states
- Loading: skeleton cards.
- Empty category: branded empty state with a link to all menu items.
- Unavailable product: visibly unavailable; prevent adding it to cart.
- Service error: friendly retry message; do not substitute random products.

## 3. Cart Flow

1. Cart shows each product snapshot, selected variant/add-ons, quantity and line estimate.
2. Customer can increment/decrement quantity or remove an item.
3. Coupon field validates format in the UI; final eligibility is checked on backend.
4. Customer chooses **Continue to Checkout**.
5. If cart is empty, checkout cannot proceed.

Guest cart may be persisted locally. Do not store private credentials, payment proofs or authoritative order totals in local storage.

## 4. Checkout Flow — Shared Steps

Database mapping for the order-mode selector must be exact: Home Delivery = `delivery`, Takeaway = `takeaway`, Dine-in = `dine_in`.

1. Select order mode: Home Delivery, Takeaway or Dine-in.
2. Enter customer name and mobile phone; email is optional.
3. Select an available payment method from current site settings.
4. Review order items and estimated totals.
5. Submit order.
6. Backend validates products, quantities, variants, add-ons, order mode, coupon, delivery zone and payment method; recalculates all amounts and creates the order atomically.
7. On success, navigate to `/order-confirmation/:orderNumber` and show the actual order number/status.
8. On failure, retain cart data and show a useful error that explains how to correct or retry.

### 4.1 Home Delivery branch
- Require a delivery address: recipient name, phone, address line, area and city.
- Let signed-in customers choose a saved address or add a new one. Guests can enter an address without saving it.
- Match city/area to an active `delivery_zones` entry.
- Show delivery fee, minimum order amount and estimated delivery window from that zone.
- If the area is not serviceable, do not accept the delivery order; offer takeaway/dine-in as alternatives.
- Save a snapshot of the address in the order so later address edits do not change the historical order.

### 4.2 Takeaway branch
- Require customer name and phone.
- Optional preferred pickup time; if cafe opening hours are configured, validate the selected time against them.
- Show configurable pickup instructions.
- On status `ready`, show a clear “Ready for pickup” update.

### 4.3 Dine-in branch
- Require customer name and phone.
- Select an active table from the admin-managed table list, or enter an allowed table code if the admin enables that approach.
- Store the table reference/code on the order.
- Show a confirmation with the table identifier.
- Do not imply that a table is reserved for a future time; reservations are outside the initial scope.

## 5. Payment Flow

Payment methods shown depend on admin settings:

- **Cash on Delivery:** select at checkout; order payment status begins `unpaid`; staff records payment received.
- **Cash at Cafe / Counter:** select at checkout; payment status begins `unpaid`; staff records receipt when collected.
- **JazzCash / Easypaisa / Bank Transfer:** show editable manual transfer instructions. Customer may enter transaction reference and upload proof to private `payment-proofs` storage. Status becomes `pending_verification`; admin verifies or rejects it.
- **Card / Online Payment Demo:** clearly display “Demo Only — no real charge”. It must not produce a false paid status. Hide or disable this choice in production until a real gateway is integrated.

Payment proof states: Not submitted · Pending verification · Verified · Rejected. Customers may see only their own proof/status. Admins may access proof for the related order.

## 6. Authentication Flow

### Signup
1. User enters name, email and password; phone is optional at account creation.
2. Supabase Auth creates the account.
3. Database trigger creates `profiles` row with role `customer`.
4. User sees email confirmation or signed-in state according to Auth configuration.

### Login / Logout / Reset
- Login uses Supabase Auth.
- Password reset uses configured Supabase redirect URLs.
- Logout clears the client session and returns to public home.
- No form or client payload can set the user's role.

### Guest checkout
- A visitor may order without registering.
- Collect name and phone, plus order-mode-specific fields.
- Guest order confirmation/tracking must use an unguessable tracking token or additional verification; order number alone is not sufficient to disclose private order details.

## 7. Customer Account Flow

- `/account`: profile overview and recent orders.
- `/account/profile`: view/update own profile fields.
- `/account/addresses`: add/edit/delete own saved addresses and set default.
- `/account/orders`: list own orders, newest first.
- `/account/orders/:orderNumber`: item snapshots, totals, payment status and status history.
- Review form appears only when review eligibility is satisfied; review remains pending moderation if moderation is enabled.

Unauthenticated visitors are redirected to login for account pages, then returned to the requested page after successful login.

## 8. Order Status Flow

Status values (database enum/text check values):

`pending` → `confirmed` → `preparing` → `ready` → `completed`

Delivery may use:

`pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`

Any allowed path may move to `cancelled` according to admin/cancellation rules. Admin status changes create an `order_status_history` row with timestamp, old status, new status, actor and optional note. Customer sees a read-only timeline.

## 9. Admin Flow

1. Admin signs in through the standard login page.
2. Frontend checks profile role; non-admin users are denied access and redirected.
3. Supabase RLS independently rejects non-admin data requests.
4. Dashboard loads actual order, sales, customer and product metrics.
5. Admin opens an order, inspects customer/order snapshots and updates status.
6. Admin can verify or reject manual payment proof and record a note.
7. Admin can create/edit/deactivate products and categories, manage variants/add-ons, upload images, configure offers and maintain delivery zones/tables.
8. Admin changes cafe contact information, opening hours, delivery/pickup settings and payment instructions in settings.

### Admin CRUD interaction states
- Create: validate required fields, save, show success toast and refreshed list.
- Edit: load current data, validate updates, handle conflicts.
- Delete: confirm destructive action; prefer deactivate/archive where records may be referenced by past orders.
- Upload: show progress and clear error for invalid file type/size.
- No records: show an empty state with a relevant “Add” action.

## 10. Error, Empty and Loading States

All network-backed screens must provide:
- Loading skeleton or progress indicator.
- Empty state with a helpful next action.
- Validation errors adjacent to the relevant fields.
- Recoverable network error with retry.
- Permission error without leaking restricted details.
- Success confirmation after a completed action.

Do not silently discard a user's cart or form data after a recoverable error.

## 11. Permission Matrix

| Resource / action | Visitor | Customer | Admin |
|---|---:|---:|---:|
| Read active menu/categories | Yes | Yes | Yes |
| Read own profile/addresses | No | Yes | Yes (admin support access only where needed) |
| Edit own profile/addresses | No | Yes | Yes |
| Place order | Guest flow | Yes | Yes (for testing/support only) |
| Read own order | Verified guest token | Yes | Yes |
| Read all orders | No | No | Yes |
| Manage products/categories | No | No | Yes |
| Manage delivery zones/tables/settings | No | No | Yes |
| Verify payments | No | No | Yes |
| Submit review | No/optional guest policy | Eligible customer | Yes (moderation only) |
| Moderate reviews | No | No | Yes |

Database RLS and trusted functions must enforce this matrix; the UI matrix is not a substitute for backend security.
