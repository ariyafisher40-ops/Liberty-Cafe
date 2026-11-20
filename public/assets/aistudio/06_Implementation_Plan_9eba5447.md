# Liberty Cafe — Implementation Plan for Google AI Studio

**Document:** 06_Implementation_Plan.md  
**Version:** 1.1  
**Execution mode:** One complete AI Studio build pass, followed by one compare/finalise pass using all six documents.

## 1. Instruction to Google AI Studio

For Pass 1, upload all six project documents together, enable High Thinking Mode and send exactly: `Follow the plan`.

Use all six project documents as one consistent specification. Build the complete Liberty Cafe website in **React + TypeScript + Vite**. Do not respond with only a plan or static mockup: implement the working frontend, routes, reusable components, typed models, forms, validations, demo catalogue and Supabase-ready service layer.

The exact design direction is **Luxury Black & Gold** as detailed in `04_UI_UX_Design_Brief.md`. Use the same design tokens and visual system across public pages, customer pages, checkout and admin dashboard.

Do not create a Supabase project or claim that a database exists. Do not hardcode credentials. Prepare integration points and `.env.example` as specified in `02_TRD.md` and `05_Backend_Schema.md`.

## 2. Internal Build Order (not user-facing phases)

1. Inspect and reconcile all six documents. If a naming conflict exists, use `05_Backend_Schema.md` for exact database names and `02_TRD.md` for exact routes/environment variables. Do not silently invent different names.
2. Create Vite React TypeScript project structure, reusable types, central theme tokens and shared layout.
3. Implement header, footer, responsive navigation and page shells.
4. Implement public homepage, menu/category browsing, product detail, offers, about and contact pages.
5. Implement cart state, checkout form and the three order-mode branches: delivery, takeaway and dine-in.
6. Implement customer signup/login/reset, account pages, address management, order history and tracking UI.
7. Implement the admin dashboard and CRUD screens for products, categories, add-ons, coupons, delivery zones, tables, reviews, banners and settings.
8. Implement a typed Supabase client and service layer using only the documented environment variables. Include robust unconfigured-backend and error states.
9. Implement order and payment UI against the documented service contracts. Frontend must call a trusted `place_order` operation; it must not calculate a trusted final total or directly insert order rows.
10. Add exactly 15 demo categories and 150 sample products (10 per category) using every exact name/PKR price from `01_PRD.md` Section 5; set every sample product `is_demo = true`. Do not abbreviate the catalogue or create duplicate seeds. Mark sample coupon/tables as demo if included. Do not create fake customers, testimonials or revenue.
11. Add image placeholders, alt text, loading states, empty states, validation, accessibility and restrained motion.
12. Add Cloudflare SPA fallback, npm configuration and deployment-ready scripts.
13. Run build/type checks and fix issues before reporting completion.

## 3. Required Project Structure

Use a clean, maintainable structure similar to:

```text
liberty-cafe/
  public/
    _redirects
    images/
      placeholders/
  src/
    app/
      App.tsx
      router.tsx
    components/
      layout/
      navigation/
      products/
      cart/
      checkout/
      forms/
      feedback/
      admin/
    pages/
      public/
      auth/
      account/
      admin/
    features/
      auth/
      menu/
      cart/
      orders/
      payments/
      reviews/
      admin/
    lib/
      supabase.ts
      env.ts
      formatters.ts
      validators.ts
    services/
      auth.service.ts
      menu.service.ts
      order.service.ts
      payment.service.ts
      admin.service.ts
      settings.service.ts
    types/
      database.ts
      domain.ts
    styles/
      tokens.css
      globals.css
    main.tsx
  .env.example
  .npmrc
  .gitignore
  index.html
  package.json
  package-lock.json
  tsconfig.json
  vite.config.ts
```

Adjust as needed, but preserve separation of pages, components, domain types, services and Supabase client.

## 4. Exact Data and Route Contract

- Routes must match `02_TRD.md` exactly.
- Tables, columns, enum/check values, bucket names and function names must match `05_Backend_Schema.md` exactly.
- Business rules and user capabilities must match `01_PRD.md` and `03_App_Flow.md`.
- Design tokens and responsive states must match `04_UI_UX_Design_Brief.md`.
- If a required live backend operation is not yet available, use an explicit typed interface/mock preview mode and show that live Supabase setup is pending. Never make a mock operation appear to be saved in the real database.

## 5. Demo Catalogue and Admin Product Management

Create exactly 15 demo categories and all 150 products listed in `01_PRD.md` Section 5 (10 products per category). Do not substitute a shorter list. The categories are: Burgers; Pizza; Fried Chicken; Shawarma & Wraps; Sandwiches & Subs; Rolls & Paratha; Pasta; Fries & Sides; Wings & Nuggets; Hot Dogs & Snacks; Deals & Combos; Coffee; Shakes & Smoothies; Cold Drinks; Desserts. Every product must have `is_demo = true`, a unique stable ID/slug, an illustrative PKR base price, category, availability state and sort order.

The complete item-by-item catalogue and price list is intentionally maintained in `01_PRD.md` Section 5 as the single source of truth.

The protected admin product manager must allow an authorised admin to:
- View the full product list and product count.
- Search by product name and filter by category.
- Add a new product with name, slug, category, description, PKR price and optional image.
- Edit existing product details and price.
- Enable/disable availability, and mark featured/bestseller.
- Delete a product only after a confirmation dialog. Preserve existing order-item snapshots if the product is deleted; the product reference may become null. Offer disabling availability as a non-destructive alternative.

Prices are illustrative only. Do not label them as confirmed cafe prices. Use local image placeholders until the separate image workflow supplies approved assets. Preview-mode CRUD must be clearly identified as local preview storage; live persistence requires Supabase and the RLS policies in `05_Backend_Schema.md`.

## 6. Payment and Order Safety

- Show all configurable demo payment methods from the PRD.
- Manual JazzCash/Easypaisa/Bank Transfer are instruction + proof submission flows, not automatic payment confirmations.
- Card/online option must visibly say “Demo Only — no real charge” and must never set `payment_status = paid`.
- Cash payment status starts unpaid until staff records receipt.
- Submit order with item IDs, quantity, selected option IDs and customer/order-mode details. Backend re-reads prices and calculates all totals.
- Never trust client-side totals, coupon discount, delivery fee or payment status.
- Never expose service-role/payment secrets.

## 7. Cloudflare / GitHub Readiness

- `package.json` has `"build": "vite build"`.
- Vite output is `dist`.
- Create `public/_redirects` containing `/* /index.html 200` for SPA fallback, or a verified equivalent.
- Root `.npmrc` contains exactly `legacy-peer-deps=true`.
- Keep `package-lock.json`; do not keep `bun.lock` or `bun.lockb` in final npm repo.
- Include `.env.example` with the exact variables from `02_TRD.md` and placeholder values only.
- Add no secrets to GitHub.

## 8. Quality Assurance Before Reporting

Confirm exactly 150 unique demo products and 15 categories are loaded, with 10 products per category; all seeded products have `is_demo = true`, and a newly added product appears in the public menu and admin list. Verify edit, availability toggle, delete confirmation and historical-order delete protection.

Test and fix:
- Every route opens directly and works after page refresh.
- Desktop/tablet/mobile layouts at 360px, 768px, 1024px and 1440px.
- Menu search, category filters, product detail, variants/add-ons and cart quantity/removal.
- Checkout branches for delivery, takeaway and dine-in.
- Missing required fields, unavailable product and unserviceable delivery area.
- Demo payment wording and payment status safety.
- Auth loading/error/empty states and protected customer/admin routes.
- Admin CRUD form validation and destructive-action confirmations.
- Accessible keyboard navigation, labels, focus states and reduced-motion handling.
- Supabase-missing configuration state and network error handling.
- `npm run build` and TypeScript checks.

Do not report a test as passed unless it was actually run. Clearly separate completed frontend work from backend work that still requires the later Supabase setup.

## 9. Required Final Report from AI Studio

At the end, report:
1. Pages/routes implemented.
2. Components/features implemented.
3. Demo categories/products added and confirmation that each is flagged as demo.
4. Supabase integration files and exact expected environment variable names.
5. Backend-dependent features that are UI-ready but await actual Supabase setup.
6. Build result and any warnings/errors.
7. Cloudflare files/settings readiness.
8. Remaining known issues; do not conceal incomplete work.

## 10. Pass 2 Compare/Finalise Instructions

When the same six files are supplied again, compare the existing project against every requirement in all six documents. Fix missing or incomplete items, correct mismatches, preserve working features and avoid unnecessary rewrites. Confirm exact route/table/column/env names, responsive behaviour, demo data flags, payment safety, RLS assumptions in the client integration, npm lockfile and Cloudflare SPA configuration. Provide a concise change report and test report. Do not create a separate phase-wise prompt or rebuild the project from scratch unless the user explicitly asks for that.
