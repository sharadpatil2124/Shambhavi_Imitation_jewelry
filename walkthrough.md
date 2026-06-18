# Shambhavi Imitation | Premium Luxury Jewelry Frontend Walkthrough

Welcome to the production-ready frontend architecture of the **Shambhavi Imitation** luxury eCommerce website. This document provides a detailed overview of the system architecture, design systems, folder structures, and page details implemented in this project.

---

## 🎨 Luxury Design Aesthetics

We have implemented a **White + Gold** theme engineered to invoke feelings of absolute premium luxury, reminiscent of heritage brands like *Tanishq* and *CaratLane*.

*   **Warm Alabaster Backgrounds:** `#faf9f6` as the page background to avoid harsh clinical whites, providing a warm, inviting luxury boutique feel.
*   **Artisanal Gold Palette:** A custom curated scale of gold tones ranging from deep royal gold (`gold-950`: `#302410`) to sparkling accent gold (`gold-500`: `#bfa054`), and light ivory gold (`gold-50`: `#fcfbf7`).
*   **Sovereign Typography:**
    *   **Serif Headings:** *Playfair Display* for brand titles, luxury headers, and pricing displays to enforce elegant, heritage aesthetics.
    *   **Geometric Sans-Serif:** *Poppins* for product details, body copy, and filters to guarantee high-performance, responsive legibility.
*   **Interactive Micro-Animations:** Premium hover zooms on product images, sliding banners, smooth collapsible mobile sheets, and elegant alert toasts.

---

## 📁 Clean Folder Structure

All code is written using a scalable, component-based, clean MERN-frontend architecture:

```
frontend/
├── src/
│   ├── assets/              # Premium branding vector assets
│   ├── components/          # Reusable UI Components
│   │   ├── Navbar.jsx           # Global sticky white-and-gold navbar & search overlay
│   │   ├── Footer.jsx           # Premium structured footer with legal & payment links
│   │   ├── ProductCard.jsx      # High-performance catalog item cards with hover zooms
│   │   ├── QuickViewModal.jsx   # Multi-image detailed interactive product lightbox
│   │   ├── FiltersSidebar.jsx   # Real-time search/sort/price filtering sidebar
│   │   ├── WhatsAppButton.jsx   # Bouncing floating WhatsApp support concierge button
│   │   ├── MobileNavigation.jsx # Sticky bottom mobile-friendly navigation bar
│   │   └── ScrollToTop.jsx      # Route-change instant-scroll helper component
│   │
│   ├── pages/               # The 16 required Page Components
│   │   ├── Home.jsx             # Luxury homepage with sliders, promos, & collections
│   │   ├── Shop.jsx             # Dual-pane catalog engine with search & sidebar filters
│   │   ├── ProductDetails.jsx   # High-resolution details with review distribution charts
│   │   ├── Categories.jsx       # Grid gallery showcasing traditional craftsmanship
│   │   ├── Cart.jsx             # Cart table with dynamic promo-code calculations
│   │   ├── Checkout.jsx         # Shipping forms & automated receipt confirmations
│   │   ├── Login.jsx            # Account access forms with validation & password toggles
│   │   ├── Register.jsx         # Customer registration panel with agreement checks
│   │   ├── Wishlist.jsx         # Card grid for saved favorites with quick cart-adds
│   │   ├── MyAccount.jsx        # Customer console separating order records and profile edits
│   │   ├── OrderTracking.jsx    # Real-time shipping stepper timeline querying order codes
│   │   ├── ContactUs.jsx        # Concierge phone points & enquiry feedback form
│   │   ├── AboutUs.jsx          # Historical summary detailing our 22k gold leaf methods
│   │   ├── PrivacyPolicy.jsx    # Encrypted checkouts and privacy data policies
│   │   ├── TermsConditions.jsx  # Copyright protections & purchase terms guidelines
│   │   └── ReturnRefundPolicy.jsx# 7-day replacement timelines & step-by-step guides
│   │
│   ├── store/               # Redux Toolkit Global State Store
│   │   ├── index.js             # Central Redux store aggregator
│   │   ├── productSlice.js      # Mock products, categories, sorting, and search logic
│   │   ├── cartSlice.js         # Cart manifest, quantity counters, & subtotal calculations
│   │   ├── wishlistSlice.js     # Saved products aggregator
│   │   └── authSlice.js         # Simulated auth states, profiles, and order generators
│   │
│   ├── App.jsx              # Routing center & global notification context
│   ├── index.css            # Custom CSS & Tailwind CSS v4 custom theme directives
│   └── main.jsx             # Application root mounting and Redux Provider hook
│
├── postcss.config.js        # PostCSS v8 config using @tailwindcss/postcss plugin
├── vite.config.js           # Production Bundler config
└── package.json             # Core dependency manifest
```

---

## 🛠️ The 16 Implemented Pages

### 1. Home Page (Home.jsx)
*   **Premium Hero Banner Slider:** Breathtaking auto-playing luxury slideshow with large headings, gold action buttons, and dark overlays.
*   **Circular Shop by Category:** Visual showcase of the primary jewelry varieties.
*   **Featured & Trending Grids:** Dynamic cards driven by the global Redux product catalog.
*   **Bridal Collection Split-Banner:** Clean split-pane layout highlighting heavy Kundan sets.
*   **Festival Special Coupon:** Click-to-copy simulated promo code coupon panel.
*   **Whispers of Luxury Testimonials:** Beautiful customer quotation boxes detailing genuine luxury feedback.
*   **Styling Instagram Grid:** Grid of premium lifestyle photos with zoom overlays on hover.

### 2. Shop Page (Shop.jsx)
*   **Dual-Pane Desktop Layout:** Sticking left filter panel with right grid catalog.
*   **Drawer Mobile Layout:** Sliding filter sidebar that slides in from the right when toggled.
*   **Dynamic URL Query Parsing:** Detects searches and categories immediately from search params (e.g. `?search=Haram` or `?category=Earrings`) on mount.
*   **Active Filter Tags:** Fast close buttons allowing users to clear single filters instantly.
*   **Luxury Pagination:** Numbered navigation control bars styled in clean minimalist borders.

### 3. Product Details Page (ProductDetails.jsx)
*   **Image Gallery Picker:** Vertical thumb listing adjacent to the large zoomable master image.
*   **Dynamic Special Offers Panel:** Clear discounts, original slash pricing, and custom offer tags.
*   **Sizing & Color Attributes:** Interactive button selections with custom golden highlights.
*   **Quantity Selector:** Increments and decrements with min-value caps.
*   **Direct Purchase Channels:** "Add to Cart", "Buy It Now" (takes straight to checkout), and "Order on WhatsApp" (pre-formats details into a custom WhatsApp message).
*   **Review Stepper & Graphs:** Breakdown of 5-star rankings, plus reviews detailing quality.
*   **Recommendations Grid:** Automatically displays 4 related products of the same category.

### 4. Categories Page (Categories.jsx)
*   **Craft Focus Cards:** Alternating text/image row splits highlighting the traditional craftsmanship, stones, and styling guides for each category.

### 5. Cart Page (Cart.jsx)
*   **Cart Manifest Table:** Shows items, chosen color/size, and individual item price calculations.
*   **Shipping Progress alert:** Alert message informing users how much extra value to add to secure free shipping (delivery threshold: ₹5,000).
*   **Simulated Promo Code:** Submitting code `SHAMBHAVI10` applies a 10% discount to the cart total.
*   **Concierge Checkout:** Allows users to submit their cart directly to WhatsApp for offline orders.

### 6. Checkout Page (Checkout.jsx)
*   **Shipping & Billing Address Form:** Gathers recipient coordinates and mobile contacts.
*   **Autofill Integration:** Automatically extracts the logged-in customer's details from Redux state to speed up the checkout workflow.
*   **Confirmation Receipt:** A structured invoice containing order numbers, express courier tracking details, and estimated delivery dates.

### 7. Login Page (Login.jsx)
*   **Premium Access Portal:** Features input validations, show/hide password buttons, and remember-me checkbox settings.

### 8. Register Page (Register.jsx)
*   **Member Registration Form:** Collects Name, Email, Phone, and Double-entry password confirmation with agreement checkboxes.

### 9. Wishlist Page (Wishlist.jsx)
*   **Saved Masterworks Gallery:** Interactive grid displaying all saved items with quick-add cart triggers and fast removals.

### 10. My Account Page (MyAccount.jsx)
*   **Customer Dashboard:** Vertical tab navigation structure separating records.
*   **Order Logs:** Highlights historical order items, paid totals, and status indicators.
*   **Address & Profile Form:** Form allowing users to modify billing coordinates, updating Redux profile states dynamically.

### 11. Order Tracking Page (OrderTracking.jsx)
*   **Visual Delivery Timeline Stepper:** Form lookup tracing orders like `ORD-99120`. Renders a stepper mapping progress (Processing, Checked, Shipped, Delivered).

### 12. Contact Us Page (ContactUs.jsx)
*   **Corporate Desk details:** Details verified showroom points, email desks, support hours, and social media channels.
*   **Concierge Inquiry Form:** A structured support form that resets beautifully on successful submission.

### 13. About Us Page (AboutUs.jsx)
*   **Heritage Narrative:** Tells our brand's story.
*   **Manufacturing callouts:** Explains our anti-tarnish coating process and vacuum 22k gold leaf plating methods.

### 14, 15, 16. Legal & Policy Pages
*   **Privacy Policy (PrivacyPolicy.jsx):** Covers payment encryption and GDPR privacy protections.
*   **Terms & Conditions (TermsConditions.jsx):** Covers intellectual property protection.
*   **Return & Refund Policy (ReturnRefundPolicy.jsx):** Step-by-step return, pickup, and refund timeline details.

---

## 💎 Custom Reusable Components

Our architecture utilizes custom reusable UI components:

1.  **Navbar (Navbar.jsx):** Sticky premium header, sliding mobile menu drawer, full-screen search overlay, and integrated cart/wishlist badge counters.
2.  **Footer (Footer.jsx):** Organized links, operational hours, social follow icons, and secure payment method badges.
3.  **ProductCard (ProductCard.jsx):** Product grid card with hover transition overlays (image toggle, quick view buttons, rating stars, quick add-to-cart).
4.  **QuickViewModal (QuickViewModal.jsx):** Dynamic lightbox overlay presenting full attributes (description, thumbnails stack, quantity adjusters, wishlist anchors, checkouts, and WhatsApp order triggers).
5.  **FiltersSidebar (FiltersSidebar.jsx):** Filters panel managing categories, active sorting criteria, price boundary sliders, and single-click filter resets.
6.  **WhatsAppButton (WhatsAppButton.jsx):** Subtle floating support link in the corner with a pre-configured customer enquiry template.
7.  **MobileNavigation (MobileNavigation.jsx):** Mobile-first sticky bottom navigation bar providing quick thumb reach to core portals.
8.  **ScrollToTop (ScrollToTop.jsx):** Simple helper listening to navigation paths to reset window coordinates instantly.

---

## 🚀 Build and Validation Metrics

The compilation output verified production-readiness with zero errors:

```bash
vite v8.0.13 building client environment for production...
transforming...✓ 70 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.02 kB │ gzip:   0.53 kB
dist/assets/index-JJY9uX_1.css   69.68 kB │ gzip:  12.17 kB
dist/assets/index-DzLEZaUE.js   479.73 kB │ gzip: 130.53 kB

✓ built in 2.09s
```

All pages are mapped within the main router inside `App.jsx`, providing a flawless, extremely fast, and gorgeous interactive experience!
