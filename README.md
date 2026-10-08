# HEROFORGE — superhero-inspired tee store (demo)

Plain HTML/CSS/JS, no build step. Serve the folder and open it:

    python -m http.server 5173      # then http://localhost:5173/

Pages: `index.html` (home) · `shop.html` (filters/search/sort) · `product.html?id=…` · `checkout.html` · `orders.html` · `wishlist.html`

## Licensing — read this
No licensed Marvel assets are available, so this is a **demo catalogue of original superhero-inspired designs with original hero names**.
It is not official merchandise and is labelled as such (header ribbon, footer, product copy). Do not sell it as Marvel product.
Each hero in `js/data.js` has an `official` name for the day you hold a licence; `STORE.licensed = true` switches the displayed names,
but you must also replace the artwork with licensed assets first.

## Code map
- `js/art.js` — draws and composites realistic studio apparel views from each product's spec (front/back/on-model/close-up/folded), with clean studio backdrops and 3D textures.
- `js/data.js` — catalogue, schema, `queryProducts()` (all filters/search/sort), per-size stock, realistic photographic image mapping (`p.images`), integrity check.
- `assets/products/` — optional local product asset overrides (`[slug]/front.jpg`, `back.jpg`, `model.jpg`, `detail.jpg`, `folded.jpg`).
- `js/app.js` — header/nav/search/cart/wishlist/quick view, GSAP motion, capability detection.
- `js/three-scenes.js` — Three.js hero scene + 3D tee viewer (lazy-loaded; skipped on phones, low-power devices and reduced motion).
- `js/home.js` `shop.js` `product.js` `checkout.js` `orders.js` `wishlist.js` — page logic.

## Adding a product
Add a row to `ROSTER` in `js/data.js` (`[name, style, motif, shirt, title, sub]`). Run the checks below — they fail if an id, name,
image or SKU is duplicated or an image doesn't belong to its product.

## Checks (dev server must be running for the browser ones; Chrome required)
    node tools/check-catalog.js   # ids, images, section/character counts, filters
    node tools/e2e.js             # 55 browser checks: hover mapping, filters, cart, stock, checkout, orders, mobile, console
    node tools/perf.js            # LCP / layout shift / what loads, reduced-motion behaviour
