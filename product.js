/* Product detail: gallery (+ optional lazy 3D), variants with per-size stock, story/specs/reviews, related + recently viewed. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const id = new URLSearchParams(location.search).get('id'), p = getProduct(id);
  const root = $('#pdp');
  if (!p) {
    $('#crumbs').innerHTML = '<a href="index.html">Home</a><span>/</span><span>Not found</span>';
    root.innerHTML = '<div class="empty"><h3>Hero not found</h3><p>That product doesn\'t exist (or the link is outdated).</p><br><a class="btn btn-red" href="shop.html">Browse the shop</a></div>';
    return;
  }
  const c = CHARACTERS.find((x) => x.id === p.character), sel = { ci: 0, size: null, qty: 1, img: 0 };
  let gal = p.gallery(0), tee = null, teeMod = null, in3D = false;
  const VIEW_NAMES = ['Front', 'Back', 'On model', 'Close-up', 'Folded'];
  document.title = `${p.name} — HEROFORGE`; store.seen(p.id);
  $('#crumbs').innerHTML = `<a href="index.html">Home</a><span>/</span><a href="shop.html">Shop</a><span>/</span><a href="shop.html?char=${c.id}">${c.display}</a><span>/</span><span>${p.name}</span>`;
  const can3D = caps.webgl && !caps.reduce && !caps.lowPower;

  /* ----- sizes guide / reviews data ----- */
  const chest = { XS: 90, S: 96, M: 102, L: 108, XL: 114, XXL: 120 }, extra = p.type === 'oversized' ? 10 : 0;
  const REVS = [['Print quality is incredible', 'The graphic is sharp and the cotton feels premium. Washes well too.'], ['Fits true to size', 'Ordered my usual size and it is spot on. Great weight to the fabric.'], ['Gets compliments everywhere', 'Bold design that is easy to style. Shipping was quick.'], ['Better than expected', 'Looks even better in person. The colours are rich and the stitching is clean.']];
  const h = Art.hash(p.id), revs = [0, 1, 2].map((i) => { const r = REVS[(h + i) % REVS.length]; return `<div class="rev-item"><span class="stars">${stars(5 - (i === 2 ? 1 : 0))}</span><h5>${r[0]}</h5><p>${r[1]}</p><small>Demo reviewer · ${['A.', 'J.', 'M.', 'S.'][(h + i) % 4]} · ${['2 weeks ago', '1 month ago', '3 weeks ago'][i]}</small></div>`; }).join('');

  root.innerHTML = `<div class="pdp-grid">
    <div class="gallery" id="gallery">
      <div class="thumbs" id="thumbs">${gal.map((src, i) => `<button class="thumb ${i ? '' : 'active'}" data-i="${i}" aria-label="${VIEW_NAMES[i]} view"><img src="${src}" alt="" loading="lazy" width="78" height="98"></button>`).join('')}${can3D ? '<button class="thumb t3d" data-3d aria-label="3D view">3D</button>' : ''}</div>
      <div class="stage" id="stage"><img id="stageImg" src="${gal[0]}" alt="${p.name} — front" width="800" height="1000">
        <div class="badges">${p.badge ? `<span class="flag ${p.newArrival ? 'new' : ''}">${p.badge}</span>` : ''}</div>
        <button class="nav-a prev" aria-label="Previous image"><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button><button class="nav-a next" aria-label="Next image"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></button></div>
    </div>
    <div class="info" id="info">
      <a class="char-link" href="shop.html?char=${c.id}">${c.icon}<span>${c.display} · ${p.collection}</span></a>
      <h1 class="display">${p.name}</h1>
      <div class="rating-row"><span class="stars">${stars(p.rating)}</span><span>${p.rating} · ${p.reviewCount} reviews</span><span>· SKU ${p.sku}</span></div>
      <div class="pdp-price"><b>${money(p.price)}</b>${p.discount ? `<s>${money(p.originalPrice)}</s><span class="off">-${p.discount}%</span>` : ''}</div>
      <p class="lead">${p.description}</p>
      <div class="opt-label">Colour <span id="colorName">${p.colors[0][0]}</span></div>
      <div class="color-row" id="colors">${p.colors.map((col, i) => `<button class="color-dot ${i ? '' : 'active'}" data-ci="${i}" style="background:${col[1]}" aria-label="${col[0]}"></button>`).join('')}</div>
      <div class="opt-label">Size <a href="#sizeguide">Size guide</a></div>
      <div class="size-row" id="sizes">${p.sizes.map((s) => `<button class="size ${p.stockOf(s) <= 0 ? 'out' : ''}" data-size="${s}">${s}</button>`).join('')}</div>
      <div class="stock-line" id="stockLine"><i></i><span>Select a size to see availability</span></div>
      <div class="buy-row"><div class="qty"><button id="qMinus" aria-label="Decrease quantity">−</button><span id="qVal">1</span><button id="qPlus" aria-label="Increase quantity">+</button></div>
        <button class="btn btn-red" id="addBtn" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Sold out' : 'Add to cart'}</button></div>
      <div class="buy-row2"><button class="btn btn-white" id="buyBtn" ${p.stock <= 0 ? 'disabled' : ''}>Buy now</button><button class="btn-wish ${store.wish.includes(p.id) ? 'on' : ''}" id="wishBtnP" data-wish="${p.id}" aria-label="Toggle wishlist">${ICON.heart}</button></div>
      <div class="perks"><div>${ICON.truck}Free shipping over ${money(STORE.freeShipFrom)}</div><div>${ICON.ret}30-day returns</div><div>${ICON.shield}Original artwork</div></div>
      <div id="accs"></div>
    </div></div>`;

  /* ----- below: story + reviews | size guide + specs ----- */
  $('#pdpMore').innerHTML = `<div class="pdp-more">
    <div><h3>Product story</h3><div class="story"><div class="quote">${c.tag}</div><p>${c.story}</p><p>${p.name} comes from the <b>${p.collection}</b> line: ${p.description.split('. ')[0]}.</p><p style="color:var(--muted);font-size:.8rem">Demo collection — original artwork, not official merchandise.</p></div>
      <h3 id="reviews">Reviews</h3><div class="rev-list">${revs}</div><p class="demo-note">Sample reviews for this demo store — placeholder content, not from real customers.</p></div>
    <div><h3 id="sizeguide">Size guide</h3><table class="spec"><tr><th>Size</th><th>Chest (cm)</th><th>Length (cm)</th></tr>${p.sizes.map((s) => `<tr><td>${s}</td><td>${chest[s] + extra}</td><td>${68 + p.sizes.indexOf(s) * 2 + (p.type === 'oversized' ? 4 : 0)}</td></tr>`).join('')}</table>
      <p class="note">Measurements are flat-lay body widths. ${p.type === 'oversized' ? 'This tee is cut oversized — size down for a closer fit.' : 'Between sizes? Size up for a relaxed fit.'}</p>
      <h3 style="margin-top:28px">Specs</h3><table class="spec"><tr><th>Character</th><td>${c.display}</td></tr><tr><th>Category</th><td>${p.category}</td></tr><tr><th>Collection</th><td>${p.collection}</td></tr><tr><th>Colours</th><td>${p.colors.map((x) => x[0]).join(', ')}</td></tr><tr><th>Stock</th><td>${p.stock > 0 ? p.stock + ' units' : 'Sold out'}</td></tr></table></div></div>`;
  const ACC = [['Details', `<ul>${p.details.map((d) => `<li>${d}</li>`).join('')}</ul>`, true], ['Material', `<p>${p.material}</p>`], ['Care instructions', '<ul><li>Machine wash cold, inside out</li><li>Do not bleach</li><li>Tumble dry low or hang dry</li><li>Iron inside out, avoid the print</li></ul>'],
    ['Shipping', `<p>Orders ship within 24 hours. Standard delivery 3–5 working days (${money(STORE.shipping)}, free over ${money(STORE.freeShipFrom)}). Express available at checkout.</p>`], ['Returns', '<p>Free returns within 30 days of delivery on unworn items with tags. Refunds go to your original payment method.</p>']];
  $('#accs').innerHTML = ACC.map(([t, b, open]) => `<div class="acc ${open ? 'open' : ''}"><button class="acc-btn" type="button">${t}<i></i></button><div class="acc-panel"><div>${b}</div></div></div>`).join('');
  $$('.acc').forEach((a) => { const panel = $('.acc-panel', a); if (a.classList.contains('open')) panel.style.height = 'auto';
    $('.acc-btn', a).addEventListener('click', () => { const open = a.classList.toggle('open'); panel.style.height = panel.scrollHeight + 'px'; if (open) setTimeout(() => (panel.style.height = 'auto'), 520); else requestAnimationFrame(() => requestAnimationFrame(() => (panel.style.height = '0px'))); setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 560); }); });

  /* ----- gallery ----- */
  const stage = $('#stage'), stageImg = $('#stageImg');
  gal.forEach((s) => { new Image().src = s; });
  function setImage(i, instant) {
    i = (i + gal.length) % gal.length; if (in3D) leave3D();
    if (i === sel.img && !instant) return; sel.img = i;
    $$('.thumb[data-i]').forEach((t) => t.classList.toggle('active', +t.dataset.i === i));
    const src = gal[i];
    $$('img.xf', stage).forEach((n) => { gsap.killTweensOf(n); n.remove(); });
    if (motion.reduce || instant) { stageImg.src = src; stageImg.alt = `${p.name} — ${VIEW_NAMES[i]}`; return; }
    const next = stageImg.cloneNode(); next.removeAttribute('id'); next.className = 'xf'; next.alt = ''; next.src = src; stage.insertBefore(next, $('.badges', stage));
    gsap.fromTo(next, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: .38, ease: 'power2.out', onComplete: () => { stageImg.src = src; stageImg.alt = `${p.name} — ${VIEW_NAMES[i]}`; next.remove(); } });
  }
  $('#thumbs').addEventListener('click', (e) => { const t = e.target.closest('.thumb'); if (!t) return; if (t.dataset['3d'] !== undefined) enter3D(); else setImage(+t.dataset.i); });
  $('.nav-a.prev', stage).addEventListener('click', (e) => { e.stopPropagation(); setImage(sel.img - 1); });
  $('.nav-a.next', stage).addEventListener('click', (e) => { e.stopPropagation(); setImage(sel.img + 1); });
  stage.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && !in3D && stage.classList.add('zoom'));
  stage.addEventListener('mouseleave', () => { stage.classList.remove('zoom'); stageImg.style.transformOrigin = 'center'; });
  stage.addEventListener('mousemove', (e) => { const r = stage.getBoundingClientRect(); stageImg.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; });
  async function enter3D() {
    if (in3D) return; in3D = true; stage.classList.remove('zoom'); stage.classList.add('is3d'); $$('.thumb').forEach((t) => t.classList.toggle('active', t.dataset['3d'] !== undefined));
    const host = document.createElement('div'); host.className = 'stage3d'; host.innerHTML = '<div class="hint">Drag to rotate</div>'; stage.appendChild(host);
    try { teeMod = teeMod || await import('./three-scenes.js'); if (!in3D) return host.remove(); tee = await teeMod.mountTee(host, p, { ci: sel.ci }); } catch (err) { console.warn('3D unavailable', err); leave3D(); toast('3D view isn\'t available on this device'); }
  }
  function leave3D() { in3D = false; stage.classList.remove('is3d'); if (tee) { tee.destroy(); tee = null; } $$('.stage3d', stage).forEach((n) => n.remove()); $$('.thumb').forEach((t) => t.classList.toggle('active', t.dataset.i !== undefined && +t.dataset.i === sel.img)); }

  /* ----- variants ----- */
  function stockText() {
    const el = $('#stockLine'), s = sel.size; el.className = 'stock-line';
    if (!s) { const t = p.stock; el.innerHTML = t > 0 ? `<i></i><span>${t > 25 ? 'In stock' : `Only ${t} left in total`} — select a size</span>` : '<i></i><span>Sold out</span>'; if (t <= 0) el.classList.add('out'); return; }
    const left = p.stockOf(s) - store.inCart(p.id, s);
    if (p.stockOf(s) <= 0) { el.classList.add('out'); el.innerHTML = `<i></i><span>Size ${s} is sold out</span>`; }
    else if (left <= 0) { el.classList.add('low'); el.innerHTML = `<i></i><span>All ${p.stockOf(s)} in size ${s} are in your bag</span>`; }
    else { if (left <= 5) el.classList.add('low'); el.innerHTML = `<i></i><span>${left <= 5 ? `Only ${left} left` : 'In stock'} in size ${s}</span>`; }
  }
  $('#colors').addEventListener('click', (e) => {
    const b = e.target.closest('.color-dot'); if (!b) return; sel.ci = +b.dataset.ci; $('#colorName').textContent = p.colors[sel.ci][0];
    $$('.color-dot').forEach((d) => d.classList.toggle('active', d === b));
    gal = p.gallery(sel.ci); gal.forEach((s) => { new Image().src = s; }); $$('.thumb[data-i] img').forEach((im, k) => { im.src = gal[k]; });
    if (in3D && tee) tee.setColor(sel.ci); else { sel.img = -1; setImage(0); }
  });
  $('#sizes').addEventListener('click', (e) => { const b = e.target.closest('.size'); if (!b || b.classList.contains('out')) return; sel.size = b.dataset.size; $$('.size').forEach((x) => x.classList.toggle('active', x === b)); sel.qty = 1; $('#qVal').textContent = 1; stockText(); });
  const maxQty = () => (sel.size ? Math.max(1, p.stockOf(sel.size) - store.inCart(p.id, sel.size)) : 99);
  const setQty = (n) => { sel.qty = Math.min(maxQty(), Math.max(1, n)); $('#qVal').textContent = sel.qty; if (!motion.reduce) gsap.fromTo('#qVal', { y: -5, opacity: .3 }, { y: 0, opacity: 1, duration: .25, ease: 'power2.out', overwrite: true }); };
  $('#qMinus').addEventListener('click', () => setQty(sel.qty - 1)); $('#qPlus').addEventListener('click', () => setQty(sel.qty + 1));
  function add() {
    if (!sel.size) { $$('.size').forEach((s) => { s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }); toast('Please select a <b>size</b>'); return false; }
    const r = store.add(p.id, { size: sel.size, color: p.colors[sel.ci][0], qty: sel.qty });
    if (!r.ok) { toast(r.msg); stockText(); return false; }
    toast(`<b>Added</b> ${p.name} (${sel.size}, ${p.colors[sel.ci][0]})${r.msg ? '<br>' + r.msg : ''}`); stockText(); setQty(1); return true;
  }
  $('#addBtn').addEventListener('click', () => { if (add()) addedFeedback($('#addBtn')); });
  $('#buyBtn').addEventListener('click', () => { if (add()) location.href = 'checkout.html'; });
  if (p.sizes.length === 1 && p.stockOf(p.sizes[0]) > 0) { sel.size = p.sizes[0]; $('.size').classList.add('active'); }
  stockText();

  /* ----- related + recently viewed (real queries; never the current product) ----- */
  const rel = queryProducts({ chars: [p.character] }).filter((x) => x.id !== p.id);
  if (rel.length) { $('#relName').textContent = c.display; $('#related').innerHTML = rel.slice(0, 10).map(cardHTML).join(''); $('#relWrap').hidden = false; }
  const rec = store.recent.filter((x) => x !== p.id).map(getProduct).filter(Boolean);
  if (rec.length) { $('#recent').innerHTML = rec.slice(0, 8).map(cardHTML).join(''); $('#recWrap').hidden = false; }

  /* ----- entrance ----- */
  addEventListener('app:ready', () => {
    if (!motion.reduce) {
      const d = motion.dist() * .6, tl = gsap.timeline({ defaults: { ease: 'power3.out' } }), from = (t, v, at) => tl.from(t, { opacity: 0, clearProps: 'transform,opacity', ...v }, at);
      from('.gallery', { y: d, scale: .985, duration: .7 }, 0);
      from('.info > *', { y: d * .5, duration: .5, stagger: .05 }, .1);
      from('.pdp-more > div', { y: d * .6, duration: .6, stagger: .1 }, .25);
    }
    revealAll(); ScrollTrigger.refresh();
  });
  addEventListener('pagehide', () => { tee && tee.destroy(); });
})();
