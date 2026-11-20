# Liberty Cafe — Implementation Plan for Google AI Studio

**Document:** 06_Implementation_Plan.md  
**Version:** 1.0  
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
10. Add demo categories and 12 sample products using the exact names/prices from `01_PRD.md`; set every sample product `is_demo = true`. Mark sample coupon/tables as demo if included. Do not create fake customers, testimonials or revenue.
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

## 5. Demo Catalogue

Create seven sample categories and these sample products:

| Category | Product | Price (PKR demo) |
|---|---|---:|
| Burgers | Classic Beef Burger | 699 |
| Burgers | Crispy Chicken Burger | 599 |
| Pizza | Chicken Cheese Pizza | 1,299 |
| Pizza | Margherita Pizza | 1,099 |
| Sandwiches | Chicken Club Sandwich | 649 |
| Sides | Loaded Fries | 399 |
| Coffee | Cappuccino | 449 |
| Coffee | Cafe Latte | 449 |
| Coffee | Iced Coffee | 499 |
| Shakes & Drinks | Chocolate Milkshake | 449 |
| Shakes & Drinks | Fresh Lemon Mint | 299 |
| Desserts | Chocolate Brownie | 349 |

Prices are illustrative only. Do not label them as confirmed cafe prices. Add a data flag (`is_demo`) and make demo products editable/removable from the future admin dashboard. Use local image placeholders until the separate image workflow supplies approved assets.

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
