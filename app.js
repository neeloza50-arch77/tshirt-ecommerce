/* HEROFORGE shared core: page chrome, cart, wishlist, search, quick view, GSAP motion, capability detection. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hasGSAP = typeof gsap !== 'undefined';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => matchMedia('(max-width: 768px)').matches;
  const HOVER_MQ = '(hover: hover) and (min-width: 721px) and (prefers-reduced-motion: no-preference)';
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };

  /* ---------- Capabilities: decide once whether heavy 3D is appropriate ---------- */
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  const lowPower = !!((navigator.connection && navigator.connection.saveData) || (navigator.hardwareConcurrency || 8) < 4 || (navigator.deviceMemory || 8) < 4);
  window.caps = { reduce, webgl, lowPower, three: webgl && !reduce && !lowPower, autoThree: () => window.caps.three && !isMobile() };
  window.motion = { reduce, dist: () => (isMobile() ? 18 : 40) };

  const ICON = {
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg>',
    ret: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 1 3 6.2M4 19v-5h5"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
  };
  const LOGO = '<svg viewBox="0 0 28 32" aria-hidden="true"><path d="M2 3h24v11c0 8-5 13-12 15C7 27 2 22 2 14z" fill="#e62429"/><path d="M8 8h12v3H8zM8 14h12v3H8zM12 20h4v3h-4z" fill="#fff"/></svg>';
  const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

  /* ---------- Store: cart, wishlist, recently viewed (localStorage) ---------- */
  const store = {
    cart: read('heroforge-cart', []), wish: read('heroforge-wish', []), recent: read('heroforge-recent', []),
    save() { write('heroforge-cart', this.cart); write('heroforge-wish', this.wish); write('heroforge-recent', this.recent); },
    count: () => store.cart.reduce((n, i) => n + i.qty, 0),
    subtotal: () => store.cart.reduce((n, i) => n + getProduct(i.id).price * i.qty, 0),
    inCart: (id, size) => store.cart.filter((i) => i.id === id && i.size === size).reduce((n, i) => n + i.qty, 0),
    // stock-aware add; returns {ok, msg}
    add(id, { size, color, qty = 1 } = {}) {
      const p = getProduct(id); if (!p) return { ok: false, msg: 'Product not found' };
      if (!size) return { ok: false, msg: 'Please select a size' };
      if (p.stockOf(size) <= 0) return { ok: false, msg: `Size ${size} is sold out` };
      const left = p.stockOf(size) - store.inCart(id, size);
      if (left <= 0) return { ok: false, msg: `You already have all ${p.stockOf(size)} available in your bag` };
      const q = Math.min(qty, left), c = color || p.colors[0][0];
      const hit = this.cart.find((i) => i.id === id && i.size === size && i.color === c);
      hit ? (hit.qty += q) : this.cart.push({ id, size, color: c, qty: q });
      this.save(); renderCart(true);
      return { ok: true, msg: q < qty ? `Only ${q} added — that's all we have in size ${size}` : null, added: q };
    },
    toggleWish(id) { const i = this.wish.indexOf(id); i > -1 ? this.wish.splice(i, 1) : this.wish.push(id); this.save(); updateCounts(); return i === -1; },
    clearCart() { this.cart = []; this.save(); renderCart(); },
    seen(id) { this.recent = [id, ...this.recent.filter((x) => x !== id)].slice(0, 12); this.save(); },
  };
  window.store = store; window.ICON = ICON; window.stars = stars;

  /* ---------- Chrome ---------- */
  const NAV = [['Home', 'index.html'], ['Shop', 'shop.html'], ['T-Shirts', 'shop.html?s=tshirts'], ['New Arrivals', 'shop.html?s=new'], ['Best Sellers', 'shop.html?s=best']];
  function mountChrome() {
    const chars = CHARACTERS.map((c) => `<a href="shop.html?char=${c.id}">${c.icon}<span>${c.display}<small>${c.tag}</small></span></a>`).join('');
    const assembly = CHARACTERS.find((c) => c.id === 'assembly');
    const nav = `${NAV.map(([t, h]) => `<a href="${h}" data-nav="${h}">${t}</a>`).join('')}
      <div class="has-menu"><a href="shop.html" data-nav="chars">Characters</a><div class="mega">${chars}</div></div>
      <a href="shop.html?char=assembly" data-nav="shop.html?char=assembly">${assembly.display}</a>
      <a class="sale" href="shop.html?s=sale" data-nav="shop.html?s=sale">Sale</a>`;
    document.body.insertAdjacentHTML('afterbegin', `
      <div class="ribbon"><span class="long">DEMO STORE · Original superhero-inspired designs · Not official Marvel merchandise</span><span class="short">DEMO STORE · Not official Marvel merchandise</span></div>
      <header class="header"><div class="container">
        <a href="index.html" class="logo" aria-label="${STORE.name} home">${LOGO}<span>HERO<b>FORGE</b></span></a>
        <nav class="nav" aria-label="Primary">${nav}</nav>
        <div class="actions">
          <button class="icon-btn" id="searchBtn" aria-label="Search products">${ICON.search}</button>
          <a class="icon-btn hide-sm" href="orders.html" aria-label="My orders">${ICON.box}</a>
          <a class="icon-btn" href="wishlist.html" id="wishBtn" aria-label="Wishlist">${ICON.heart}<span class="badge-count" id="wishCount">0</span></a>
          <button class="icon-btn" id="cartBtn" aria-label="Open cart">${ICON.bag}<span class="badge-count" id="cartCount">0</span></button>
          <button class="icon-btn burger" id="burger" aria-label="Open menu">${ICON.menu}</button>
        </div></div></header>
      <div class="mobile-menu" id="mobileMenu"><div class="top"><a href="index.html" class="logo">${LOGO}<span>HERO<b>FORGE</b></span></a><button class="icon-btn" data-close-menu aria-label="Close menu">${ICON.close}</button></div>
        ${NAV.concat([['The Assembly', 'shop.html?char=assembly'], ['Sale', 'shop.html?s=sale'], ['My Orders', 'orders.html'], ['Wishlist', 'wishlist.html']]).map(([t, h]) => `<a class="big" href="${h}">${t}</a>`).join('')}
        <h6>CHARACTERS</h6><div class="chars">${CHARACTERS.map((c) => `<a href="shop.html?char=${c.id}">${c.display}</a>`).join('')}</div></div>
      <div class="search-ov" id="searchOv" role="dialog" aria-label="Search"><div class="search-box">
        <div class="field-s"><input id="searchInput" type="search" placeholder="Search heroes, styles, colours…" autocomplete="off" aria-label="Search products"><button class="icon-btn" data-close-search aria-label="Close search">${ICON.close}</button></div>
        <div class="search-res" id="searchRes"></div>
        <div class="search-hint" id="searchHint">Try: ${['web', 'helmet', 'comic', 'oversized', 'cinematic', 'noir'].map((t) => `<a href="#" data-sq="${t}">${t}</a>`).join('')}</div></div></div>
      <div class="overlay" id="overlay"></div>
      <aside class="drawer" id="drawer" aria-label="Shopping cart"><div class="drawer-head"><h3>Your Bag</h3><button class="icon-btn" id="drawerClose" aria-label="Close cart">${ICON.close}</button></div>
        <div class="drawer-body" id="drawerBody"></div><div class="drawer-foot" id="drawerFoot"></div></aside>
      <div class="modal" id="quickView" role="dialog" aria-label="Quick view"></div>
      <div class="toast" id="toast" role="status"></div>`);
    document.body.insertAdjacentHTML('beforeend', `
      <footer class="footer"><div class="container"><div class="footer-grid">
        <div><a href="index.html" class="logo">${LOGO}<span>HERO<b>FORGE</b></span></a><p>Premium superhero-inspired tees. Bold original graphics, heavyweight cotton, built to be worn on repeat.</p></div>
        <div><h5>Shop</h5><ul><li><a href="shop.html">All products</a></li><li><a href="shop.html?s=tshirts">T-Shirts</a></li><li><a href="shop.html?s=new">New Arrivals</a></li><li><a href="shop.html?s=best">Best Sellers</a></li><li><a href="shop.html?s=sale">Sale</a></li></ul></div>
        <div><h5>Characters</h5><ul>${CHARACTERS.slice(0, 6).map((c) => `<li><a href="shop.html?char=${c.id}">${c.display}</a></li>`).join('')}</ul></div>
        <div><h5>Account</h5><ul><li><a href="orders.html">My orders</a></li><li><a href="wishlist.html">Wishlist</a></li><li><a href="checkout.html">Checkout</a></li><li><a href="index.html#newsletter">Newsletter</a></li></ul></div>
      </div></div><div class="footer-word" aria-hidden="true">HEROFORGE</div>
      <div class="container"><div class="disclaimer"><span><b>Demo storefront.</b> All artwork is original superhero-inspired design. HEROFORGE is not affiliated with, endorsed by, or licensed by Marvel, Disney or any comic publisher or studio, and these are not official merchandise.</span><span>© 2026 HEROFORGE · Demo store — no real orders are fulfilled.</span></div></div></footer>`);
    const here = location.pathname.split('/').pop() || 'index.html', q = location.search;
    $$('.nav a[data-nav]').forEach((a) => { const h = a.dataset.nav; if ((h === here && !q) || (h.includes('?') && here + q === h)) a.classList.add('active'); });
  }
  function updateCounts() {
    const c = store.count(), w = store.wish.length;
    $('#cartCount').textContent = c; $('#cartCount').style.display = c ? 'grid' : 'none';
    $('#wishCount').textContent = w; $('#wishCount').style.display = w ? 'grid' : 'none';
  }

  /* ---------- Product card ---------- */
  const heart = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z"/></svg>';
  window.cardHTML = (p) => {
    const out = p.stock <= 0;
    return `<article class="card" data-reveal data-id="${p.id}">
      <div class="card-top">
        <a class="card-media" href="product.html?id=${p.id}" aria-label="${p.name}">
          <img class="main" src="${p.primaryImage}" alt="${p.name}" loading="lazy" decoding="async" width="400" height="500">
          <img class="alt" src="${p.secondaryImage || p.primaryImage}" alt="" loading="lazy" decoding="async" width="400" height="500">
        </a>
        <span class="tag">${p.characterName}</span>
        ${p.badge && !out ? `<span class="flag ${p.newArrival ? 'new' : ''}">${p.badge}</span>` : ''}
        <button class="wish ${store.wish.includes(p.id) ? 'on' : ''}" data-wish="${p.id}" aria-label="Toggle wishlist for ${p.name}">${heart}</button>
        ${out ? '<div class="sold">SOLD OUT</div>' : ''}
        <div class="card-actions"><button data-quick="${p.id}">Quick view</button><button class="add" data-add="${p.id}" ${out ? 'disabled' : ''}>Add to cart</button></div>
      </div>
      <div class="card-body">
        <p class="card-char">${p.collection}</p>
        <h3 class="card-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="meta"><span class="stars" aria-label="Rated ${p.rating} out of 5">${stars(p.rating)}</span><span>${p.rating} (${p.reviewCount})</span><span class="sw-row">${p.colors.map((c) => `<i class="sw" style="background:${c[1]}" title="${c[0]}"></i>`).join('')}</span></div>
        <div class="price">${money(p.price)}${p.discount ? `<s>${money(p.originalPrice)}</s><span class="off">-${p.discount}%</span>` : ''}</div>
      </div></article>`;
  };

  /* ---------- Toast / overlays ---------- */
  function toast(msg, link) {
    const t = $('#toast'); t.innerHTML = msg + (link ? ` <a href="${link[1]}">${link[0]}</a>` : ''); t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200);
  }
  window.toast = toast;
  const lock = (on) => { if (window.lenis) (on ? lenis.stop() : lenis.start()); document.body.style.overflow = on ? 'hidden' : ''; };
  function openOverlay() { $('#overlay').classList.add('open'); lock(true); }
  function closeAll() {
    ['#drawer', '#quickView', '#overlay', '#mobileMenu', '#searchOv'].forEach((s) => $(s).classList.remove('open'));
    const f = $('#filters'); if (f) { f.classList.remove('open'); $('#filtersOv').classList.remove('open'); }
    lock(false);
  }
  window.closeAll = closeAll;

  /* ---------- Cart drawer ---------- */
  function openCart() {
    $('#drawer').classList.add('open'); openOverlay();
    if (hasGSAP && !reduce) gsap.fromTo('#drawerBody .cart-item, #drawerBody .cart-empty, #drawerFoot', { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: .4, ease: 'power2.out', stagger: .05, delay: .15, clearProps: 'transform,opacity' });
  }
  window.openCart = openCart;
  function renderCart(bump) {
    updateCounts();
    if (bump && hasGSAP && !reduce) {
      gsap.fromTo('#cartCount', { scale: 1.7 }, { scale: 1, duration: .45, ease: 'back.out(2)', overwrite: true });
      gsap.fromTo('#cartBtn svg', { y: -3 }, { y: 0, duration: .4, ease: 'power2.out', overwrite: true });
    }
    const body = $('#drawerBody'), foot = $('#drawerFoot');
    if (!store.cart.length) { body.innerHTML = '<div class="cart-empty"><p class="display">Your bag is empty</p><p>Suit up — find your hero.</p><br><a class="btn btn-red" href="shop.html">Start shopping</a></div>'; foot.hidden = true; return; }
    foot.hidden = false;
    body.innerHTML = store.cart.map((it, i) => {
      const p = getProduct(it.id), ci = Math.max(0, p.colors.findIndex((c) => c[0] === it.color)), left = p.stockOf(it.size) - it.qty;
      return `<div class="cart-item"><a href="product.html?id=${p.id}"><img src="${p.thumb(ci)}" alt="${p.name}" width="78" height="98"></a>
        <div><h4>${p.name}</h4><small>${it.color} · Size ${it.size}</small>
          <div class="qty"><button data-q="-1" data-i="${i}" aria-label="Decrease quantity">−</button><span>${it.qty}</span><button data-q="1" data-i="${i}" aria-label="Increase quantity" ${left <= 0 ? 'disabled' : ''}>+</button></div>
          ${left <= 0 ? `<div class="warn">Max available (${p.stockOf(it.size)})</div>` : ''}<button class="rm" data-rm="${i}">Remove</button></div>
        <strong>${money(p.price * it.qty)}</strong></div>`;
    }).join('');
    const sub = store.subtotal(), left = Math.max(0, STORE.freeShipFrom - sub);
    foot.innerHTML = `<small style="color:var(--muted)">${left ? `You're <b style="color:#fff">${money(left)}</b> away from free shipping` : 'Free shipping unlocked'}</small><div class="ship-bar"><i style="width:${Math.min(100, sub / STORE.freeShipFrom * 100)}%"></i></div>
      <div class="row"><span>Subtotal</span><span>${money(sub)}</span></div><div class="row total"><span>Total</span><span>${money(sub + (left ? STORE.shipping : 0))}</span></div>
      <p class="note" style="margin:0 0 12px">${left ? `Includes ${money(STORE.shipping)} standard shipping.` : 'Free standard shipping applied.'}</p><a class="btn btn-red btn-block" href="checkout.html">Checkout ${ICON.arrow}</a>`;
  }
  window.renderCart = renderCart;

  /* ---------- Feedback micro-interactions ---------- */
  window.addedFeedback = (btn, label = 'Added ✓') => {
    if (!btn) return;
    btn.dataset.label = btn.dataset.label || btn.textContent;
    btn.textContent = label; clearTimeout(btn._t); btn._t = setTimeout(() => (btn.textContent = btn.dataset.label), 1300);
    if (hasGSAP && !reduce) gsap.fromTo(btn, { scale: .96 }, { scale: 1, duration: .4, ease: 'power2.out', overwrite: 'auto' });
  };
  window.popWish = (btn, on) => {
    const id = btn && btn.dataset.wish;
    $$(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle('on', on));
    if (btn && hasGSAP && !reduce) gsap.fromTo($('svg', btn), { scale: on ? .5 : 1.2 }, { scale: 1, duration: on ? .5 : .3, ease: on ? 'back.out(2.4)' : 'power2.out', overwrite: true });
    if (hasGSAP && !reduce) gsap.fromTo('#wishBtn svg', { scale: 1.25 }, { scale: 1, duration: .4, ease: 'power2.out', overwrite: true });
  };
  const defaultSize = (p) => ['M', 'L', 'S', 'XL', 'XS', 'XXL'].find((s) => p.sizes.includes(s) && p.stockOf(s) - store.inCart(p.id, s) > 0);

  /* ---------- Quick view ---------- */
  function openQuick(id) {
    const p = getProduct(id), qv = $('#quickView'); let size = null, ci = 0;
    const draw = () => {
      qv.innerHTML = `<button class="icon-btn close" data-close-modal aria-label="Close">${ICON.close}</button><div class="qv"><div class="qv-img"><img src="${p.gallery(ci)[0]}" alt="${p.name}"></div>
        <div class="qv-info"><span class="card-char">${p.characterName} · ${p.collection}</span><h3>${p.name}</h3><div class="meta"><span class="stars">${stars(p.rating)}</span><span>${p.rating} (${p.reviewCount})</span></div>
        <div class="price" style="font-size:1.8rem">${money(p.price)}${p.discount ? `<s>${money(p.originalPrice)}</s><span class="off">-${p.discount}%</span>` : ''}</div><p style="color:var(--silver);margin:10px 0 16px;font-size:.92rem">${p.description}</p>
        <div class="opt-label">Colour <span>${p.colors[ci][0]}</span></div><div class="color-row">${p.colors.map((c, i) => `<button class="color-dot ${i === ci ? 'active' : ''}" style="background:${c[1]}" data-qc="${i}" aria-label="${c[0]}"></button>`).join('')}</div>
        <div class="opt-label">Size</div><div class="size-row">${p.sizes.map((s) => `<button class="size ${s === size ? 'active' : ''} ${p.stockOf(s) <= 0 ? 'out' : ''}" data-qs="${s}">${s}</button>`).join('')}</div>
        <div class="buy-row2" style="margin-top:14px"><button class="btn btn-red" data-qadd>Add to cart</button><a class="btn btn-ghost" href="product.html?id=${p.id}">Full details</a></div></div></div>`;
    };
    draw(); qv.classList.add('open'); openOverlay();
    qv.onclick = (e) => {
      const c = e.target.closest('[data-qc]'), s = e.target.closest('[data-qs]');
      if (c) { ci = +c.dataset.qc; draw(); } else if (s) { size = s.dataset.qs; draw(); }
      else if (e.target.closest('[data-qadd]')) {
        const r = store.add(p.id, { size, color: p.colors[ci][0] });
        if (!r.ok) return toast(r.msg);
        toast(`<b>Added</b> ${p.name} (${size})`); closeAll(); setTimeout(openCart, 250);
      }
    };
  }

  /* ---------- Search overlay ---------- */
  function openSearch() { $('#searchOv').classList.add('open'); lock(true); setTimeout(() => $('#searchInput').focus(), 80); }
  let st;
  function runSearch(q) {
    const res = $('#searchRes'), term = q.trim(), list = term.length > 1 ? queryProducts({ q: term }) : [];
    $('#searchHint').hidden = term.length > 1;
    if (term.length > 1 && !list.length) { res.innerHTML = `<p class="search-hint">No heroes match “${term.replace(/</g, '&lt;')}”. Try a style (comic, noir) or a character.</p>`; return; }
    res.innerHTML = list.slice(0, 7).map((p) => `<a href="product.html?id=${p.id}"><img src="${p.thumb(0)}" alt="" width="56" height="70"><span><b>${p.name}</b><small>${p.characterName} · ${p.collection}</small></span><strong>${money(p.price)}</strong></a>`).join('')
      + (list.length > 7 ? `<a href="shop.html?q=${encodeURIComponent(term)}" style="grid-template-columns:1fr"><b style="color:var(--red-hot)">See all ${list.length} results →</b></a>` : '');
  }

  /* ---------- Global events ---------- */
  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('#cartBtn')) return openCart();
      if (t.closest('#drawerClose') || t.closest('#overlay') || t.closest('[data-close-modal]') || t.closest('[data-close-search]')) return closeAll();
      if (t.closest('#searchBtn')) return openSearch();
      if (t.closest('#burger')) { $('#mobileMenu').classList.add('open'); return lock(true); }
      if (t.closest('[data-close-menu]') || t.closest('#mobileMenu a')) { $('#mobileMenu').classList.remove('open'); lock(false); }
      const sq = t.closest('[data-sq]');
      if (sq) { e.preventDefault(); $('#searchInput').value = sq.dataset.sq; return runSearch(sq.dataset.sq); }
      if (t.closest('#searchRes a')) closeAll();
      const add = t.closest('[data-add]');
      if (add) {
        const p = getProduct(add.dataset.add), size = defaultSize(p), r = size ? store.add(p.id, { size }) : { ok: false, msg: 'Sold out' };
        if (!r.ok) return toast(r.msg);
        toast(`<b>Added</b> ${p.name} · size ${size}`); addedFeedback(add);
      }
      if (t.closest('a[href="#cart"]')) { e.preventDefault(); return openCart(); }
      const quick = t.closest('[data-quick]'); if (quick) return openQuick(quick.dataset.quick);
      const wish = t.closest('[data-wish]');
      if (wish) { e.preventDefault(); const on = store.toggleWish(wish.dataset.wish); popWish(wish, on); toast(on ? '<b>Saved</b> to your wishlist' : 'Removed from wishlist', on ? ['View', 'wishlist.html'] : null); }
      const q = t.closest('[data-q]');
      if (q) { const it = store.cart[+q.dataset.i], p = getProduct(it.id); if (+q.dataset.q > 0 && p.stockOf(it.size) - it.qty <= 0) return; it.qty += +q.dataset.q; if (it.qty < 1) store.cart.splice(+q.dataset.i, 1); store.save(); renderCart(); }
      const rm = t.closest('[data-rm]'); if (rm) { store.cart.splice(+rm.dataset.rm, 1); store.save(); renderCart(); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
    $('#searchInput').addEventListener('input', (e) => { clearTimeout(st); st = setTimeout(() => runSearch(e.target.value), 120); });
    $('#searchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.value.trim()) location.href = `shop.html?q=${encodeURIComponent(e.target.value.trim())}`; });
    addEventListener('storage', () => { store.cart = read('heroforge-cart', []); store.wish = read('heroforge-wish', []); renderCart(); });
    const header = $('.header'); let last = 0;
    addEventListener('scroll', () => { const y = scrollY; header.classList.toggle('hide', y > last && y > 400); last = y; }, { passive: true });
  }

  /* ---------- GSAP: card hover (fine pointers only), reveals, transitions ---------- */
  function initCardHover() {
    if (!hasGSAP) return;
    gsap.matchMedia().add(HOVER_MQ, () => {
      const hover = (card, on) => {
        const main = $('.main', card), alt = $('.alt', card), act = $('.card-actions', card), top = $('.card-top', card);
        if (!main || !alt || !act) return;
        gsap.to(card, { y: on ? -5 : 0, duration: .4, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(main, { scale: on ? 1.03 : 1, duration: .7, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(alt, { opacity: on ? 1 : 0, scale: on ? 1 : 1.05, duration: .5, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(act, { y: on ? 0 : top.offsetHeight * 0.2 + 70, duration: .45, ease: 'power3.out', overwrite: 'auto' });
      };
      const h = (on) => (e) => { const c = e.target.closest && e.target.closest('.card'); if (c && !(e.relatedTarget && c.contains(e.relatedTarget))) hover(c, on); };
      const ev = [['mouseover', h(true)], ['mouseout', h(false)], ['focusin', h(true)], ['focusout', h(false)]];
      ev.forEach(([t, f]) => document.addEventListener(t, f));
      return () => { ev.forEach(([t, f]) => document.removeEventListener(t, f)); gsap.set('.card, .card .main, .card .alt, .card .card-actions', { clearProps: 'transform,opacity' }); };
    });
  }
  window.revealAll = (root = document) => {
    if (!hasGSAP || !window.ScrollTrigger || reduce) return;
    const els = $$('[data-reveal]', root).filter((el) => !el.dataset.done);
    els.forEach((el) => el.dataset.done = 1);
    if (!els.length) return;
    const d = motion.dist();
    ScrollTrigger.batch(els, { start: 'top 92%', once: true, batchMax: 4,
      onEnter: (b) => gsap.fromTo(b, { opacity: 0, y: d, scale: (i, t) => (t.classList.contains('card') ? .96 : .99) }, { opacity: 1, y: 0, scale: 1, duration: .8, ease: 'power3.out', stagger: .07, clearProps: 'transform' }) });
  };
  window.animateLines = (root = document) => {
    if (reduce || !hasGSAP) return;
    $$('[data-lines]', root).forEach((h) => {
      const lines = h.innerHTML.split(/<br\s*\/?>/i);
      h.innerHTML = lines.map((l) => `<span class="mask"><span>${l}</span></span>`).join('');
      const inner = $$('.mask > span', h); gsap.set(inner, { yPercent: 110 });
      const run = () => gsap.to(inner, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: .1 });
      h.hasAttribute('data-now') ? (h._run = run) : ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: run });
    });
  };
  function smoothScroll() {
    if (typeof Lenis === 'undefined' || reduce || isMobile()) return;
    window.lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (hasGSAP && window.ScrollTrigger) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="#"]'); if (!a || a.getAttribute('href') === '#cart') return;
      const u = new URL(a.href, location.href); if (u.pathname === location.pathname && u.hash.length > 1 && $(u.hash)) { e.preventDefault(); lenis.scrollTo(u.hash, { offset: -90, duration: 1.4 }); }
    });
  }
  function pageTransitions() {
    if (!hasGSAP || reduce) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search) || !/(\.html?|\/)$/.test(u.pathname)) return;
      e.preventDefault(); let gone = false; const go = () => { if (!gone) { gone = true; location.href = u.href; } };
      gsap.to('main', { opacity: 0, y: -8, duration: .16, ease: 'power1.in', onComplete: go }); setTimeout(go, 380);
    });
    addEventListener('pageshow', (ev) => { if (ev.persisted) gsap.set('main', { clearProps: 'opacity,transform' }); });
  }
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG' && !e.target.dataset.fb) { e.target.dataset.fb = 1; e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="100%" height="100%" fill="#16161a"/></svg>'); } }, true);

  /* ---------- Boot ---------- */
  function boot() {
    mountChrome(); bindGlobal(); renderCart();
    if (hasGSAP) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); if (!reduce) document.documentElement.classList.add('js-ready'); }
    smoothScroll(); initCardHover(); pageTransitions();
    const bad = validateCatalog(); if (bad.length) console.error('Catalogue problems:\n' + bad.slice(0, 12).join('\n'));
    window.dispatchEvent(new Event('app:ready'));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
