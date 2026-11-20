# Liberty Cafe — UI/UX Design Brief

**Document:** 04_UI_UX_Design_Brief.md  
**Version:** 1.1

## 1. Design Direction

Create Liberty Cafe as a **Luxury Black & Gold** cafe/restaurant brand, matching the dark premium reference direction discussed with the user. The overall feel should be elegant, modern, warm and appetising—not cluttered or overly flashy.

Use the same design system across every public, customer and admin page. Do not allow the admin area or checkout pages to drift into a different visual theme.

## 2. Colour Tokens

Use CSS variables so the palette can be adjusted centrally:

| Token | Suggested value | Use |
|---|---|---|
| `--color-bg` | `#0B0B0D` | Main page background |
| `--color-surface` | `#151518` | Cards and panels |
| `--color-surface-raised` | `#1D1D21` | Dialogs, dropdowns, elevated cards |
| `--color-gold` | `#D4AF37` | Primary accent, icons and key highlights |
| `--color-gold-soft` | `#E7CB78` | Hover/highlight accent |
| `--color-text` | `#F7F5EF` | Main text |
| `--color-muted` | `#AAA69C` | Secondary text |
| `--color-border` | `#343238` | Subtle separators |
| `--color-success` | `#4CAF78` | Success state only |
| `--color-danger` | `#E06A6A` | Error/destructive state only |

Gold is an accent, not a fill for every element. Keep text contrast readable. Avoid large neon glows, excessive gradients and heavy glass effects.

## 3. Typography

- Headings: elegant display serif such as Playfair Display or Cormorant Garamond.
- Body and UI: clean sans-serif such as Manrope or Inter.
- Use a clear hierarchy: strong large hero heading, compact section headings, readable product names and accessible form labels.
- Include robust system fallbacks if an external font cannot load.

## 4. Layout and Components

### Header
- Brand wordmark “LIBERTY CAFE”.
- Primary links: Home, Menu, Offers, About, Contact.
- Cart icon/count and Account/Login action.
- Sticky header may become slightly opaque on scroll.
- Mobile navigation must be keyboard accessible.

### Homepage
1. Premium hero with dark cafe/food image, subtle gold treatment, headline, short supporting copy and “Explore Menu” CTA.
2. Category strip/grid.
3. Featured products.
4. Best sellers.
5. Promotional offer/banner.
6. Short about section.
7. Opening-hours/contact/location block (only configured data; placeholders in setup preview).
8. Footer with navigation, social links and contact details.

### Menu
- Page heading and short description.
- Search field and category filter chips.
- Responsive product grid that supports the complete 150-product demo catalogue. Include result count, search, category chips/dropdown, availability filter and pagination or Load More.
- Product cards: image area, category/availability, name, concise description, price and Add button.
- Featured/best-seller labels should be subtle and consistent.

### Product Details
- Large product image and product information.
- Variant/add-on controls where available.
- Quantity selector and add-to-cart CTA.
- Clear sold-out state.

### Cart and Checkout
- Clear order summary and totals.
- Order-mode selector with three equally understandable options: Home Delivery, Takeaway, Dine-in.
- Only show fields required by the selected mode.
- Group payment choices and mark all demo-only methods honestly.
- On mobile, keep the final total and primary CTA easy to find without covering fields.

### Customer Pages
- Consistent account sidebar/tabs on desktop and stacked navigation on mobile.
- Order history cards and readable order status timeline.

### Admin Dashboard
- Same dark palette with a more information-dense layout.
- Sidebar navigation, compact top bar and responsive mobile drawer.
- Metric cards, order table, filters, forms and detail drawers/modals.
- Products management page with a visible product count, searchable/filterable table, clear Add Product button and per-row Edit, availability toggle and Delete actions.
- Product editor form with required category, name, unique URL slug, PKR base price, optional sale/comparison price, description, image upload/preview, availability, featured/bestseller flags, variants and add-ons.
- Delete confirmation dialog must explain that the live menu item will be removed while historical order name/price snapshots remain intact; also offer “Mark unavailable” as a non-destructive alternative.
- Use real database values only; clear empty states before the first real order.

## 5. Imagery and Icon Direction

- Use high-quality, appetising, realistic food photography with consistent warm lighting and coherent crops.
- Product images should use a consistent aspect ratio, ideally 4:3 or 1:1 depending on card layout.
- Hero image should be wide (16:9 or similar) with negative space for text.
- Do not use unrelated stock images, watermarked images, random URLs or repeated imagery as if it were the actual product.
- Until approved assets are supplied, use elegant local placeholders and mark them as placeholders in admin.
- Follow the user's supplied v5 asset workflow after Pass 2: create a full image/icon inventory with unique IDs, exact pixel dimensions and ready-to-use image prompts/asset notes. Icons should be a cohesive image/SVG asset set as specified by that workflow.
- Add descriptive alt text; decorative images use empty alt text where appropriate.

## 6. Motion and Interaction

- Smooth, restrained transitions (roughly 160–250ms for common UI changes).
- Subtle card lift/scale on hover, gentle gold underline/edge highlight and soft reveal transitions.
- Hero animation may use a light parallax or tasteful 3D depth effect only if it does not harm performance or accessibility.
- Respect `prefers-reduced-motion`.
- Avoid motion on every element; keep the food and content as the focus.
- Buttons need clear hover, pressed, focus, disabled and loading states.

## 7. Responsive Behaviour

Test and design at:
- 360px mobile
- 390–430px larger mobile
- 768px tablet
- 1024px small desktop/tablet landscape
- 1440px desktop

Requirements:
- No horizontal overflow.
- Product grid adapts from 1–2 columns on narrow screens to 3–4 columns on wide screens.
- Checkout form and order summary stack on mobile.
- Admin tables become card/list views or scroll within a bounded container on small screens.
- Touch targets should be comfortably tappable.

## 8. Accessibility and Usability

- Semantic heading hierarchy and landmarks.
- Keyboard-operable navigation, dialogs, filters and forms.
- Visible focus indicators in gold/white with enough contrast.
- Every input has a persistent label; placeholders are not labels.
- Validation errors are announced and linked to fields.
- Status is not communicated by colour alone; include text labels/icons.
- Provide meaningful alt text and accessible names for icon-only controls.
- Check colour contrast for body text and buttons.

## 9. Content Tone

- Warm, welcoming, premium and concise.
- Use “Liberty Cafe” consistently.
- Do not invent location, opening hours, phone, social links, staff names or claims such as “best in town”. Use editable setup placeholders until confirmed.
- Demo product names/prices are illustrative. Admin must be able to replace them before launch.

## 10. Design Acceptance Checklist

- Every route uses the same black/gold design tokens.
- Public site, checkout, customer account and admin dashboard look like one product.
- Product imagery has consistent dimensions and crop behaviour.
- Mobile navigation and checkout are usable at 360px width.
- Focus states, errors, loading and empty states are designed.
- Motion respects reduced-motion settings.
- No fake contact details or unapproved restaurant claims appear.
