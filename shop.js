/* Shop page: every control feeds queryProducts() — filters, search and sort all run on the real product data. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PAGE = 24, params = new URLSearchParams(location.search);
  const list = (k) => (params.get(k) ? params.get(k).split(',') : []);
  const state = { scope: SCOPES[params.get('s')] ? params.get('s') : 'all', q: params.get('q') || '', chars: list('char'), cats: list('cat'), collections: list('coll'), sizes: list('size'), colors: list('color'), min: +params.get('min') || 0, max: params.get('max') ? +params.get('max') : Infinity, avail: list('avail'), sort: params.get('sort') || 'default', shown: PAGE };
  const F = facets(PRODUCTS), CATS = [...new Set(PRODUCTS.map((p) => p.category))], COLLS = [...new Set(PRODUCTS.map((p) => p.collection))];
  const DESC = { all: 'Every hero, every style — filter by character, size, colour, price and more.', tshirts: 'Regular and oversized tees, from minimal emblems to full cinematic prints.', new: 'The latest drops, newest first.', best: 'The tees our crew keeps coming back for, most popular first.', featured: 'Hand-picked by the HEROFORGE design team.', sale: 'Select heroes, marked down while stock lasts.' };

  /* ----- filter panel ----- */
  const count = (arr, k) => (arr.find(([x]) => x === k) || [0, 0])[1];
  const checks = (key, items, labelOf, counts) => items.map((v) => `<label class="opt"><input type="checkbox" data-f="${key}" value="${v}" ${state[key].includes(v) ? 'checked' : ''}><span>${labelOf(v)}</span><em>${count(counts, v)}</em></label>`).join('');
  function drawFilters() {
    $('#filters').innerHTML = `<div class="f-head"><h4>Filters</h4><button class="f-clear" id="fClear" type="button">Clear all</button><button class="icon-btn filters-close" id="fClose" type="button" aria-label="Close filters">${ICON.close}</button></div>
      <div class="fgroup"><button type="button">Character<i></i></button><div class="fbody">${checks('chars', CHARACTERS.map((c) => c.id), (id) => getCharacter(id) && CHARACTERS.find((c) => c.id === id).display, F.chars)}</div></div>
      <div class="fgroup"><button type="button">Category<i></i></button><div class="fbody">${checks('cats', CATS, (v) => v, F.cats)}</div></div>
      <div class="fgroup"><button type="button">Collection<i></i></button><div class="fbody">${checks('collections', COLLS, (v) => v, F.collections)}</div></div>
      <div class="fgroup"><button type="button">Size<i></i></button><div class="fbody"><div class="sizes-f">${F.sizes.map((s) => `<button type="button" class="size-b ${state.sizes.includes(s) ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}</div></div></div>
      <div class="fgroup"><button type="button">Colour<i></i></button><div class="fbody"><div class="colors-f">${F.colors.map(([c]) => `<button type="button" class="col-b ${state.colors.includes(c) ? 'active' : ''}" data-color="${c}" style="background:${COLOR_SWATCH[c] || '#888'}" title="${c}" aria-label="${c}"></button>`).join('')}</div></div></div>
      <div class="fgroup"><button type="button">Price<i></i></button><div class="fbody"><div class="price-f"><input id="pMin" type="number" min="0" placeholder="Min $" value="${state.min || ''}" aria-label="Minimum price"><span>–</span><input id="pMax" type="number" min="0" placeholder="Max $" value="${isFinite(state.max) ? state.max : ''}" aria-label="Maximum price"></div></div></div>
      <div class="fgroup"><button type="button">Availability<i></i></button><div class="fbody">${[['in', 'In stock'], ['sale', 'On sale'], ['new', 'New arrivals']].map(([v, l]) => `<label class="opt"><input type="checkbox" data-f="avail" value="${v}" ${state.avail.includes(v) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>`;
  }
  const toggle = (arr, v) => { const i = arr.indexOf(v); i > -1 ? arr.splice(i, 1) : arr.push(v); };
  $('#filters').addEventListener('click', (e) => {
    const g = e.target.closest('.fgroup > button'); if (g) { g.parentElement.classList.toggle('closed'); return; }
    if (e.target.closest('#fClear')) return clearAll();
    if (e.target.closest('#fClose')) return closeAll();
    const sz = e.target.closest('[data-size]'); if (sz) { toggle(state.sizes, sz.dataset.size); sz.classList.toggle('active'); return apply(); }
    const co = e.target.closest('[data-color]'); if (co) { toggle(state.colors, co.dataset.color); co.classList.toggle('active'); return apply(); }
  });
  $('#filters').addEventListener('change', (e) => { const c = e.target.closest('[data-f]'); if (c) { toggle(state[c.dataset.f], c.value); apply(); } });
  let pt; $('#filters').addEventListener('input', (e) => { if (e.target.id === 'pMin' || e.target.id === 'pMax') { clearTimeout(pt); pt = setTimeout(() => { state.min = +$('#pMin').value || 0; state.max = $('#pMax').value ? +$('#pMax').value : Infinity; apply(); }, 250); } });
  function clearAll() { Object.assign(state, { q: '', chars: [], cats: [], collections: [], sizes: [], colors: [], min: 0, max: Infinity, avail: [] }); $('#shopSearch').value = ''; drawFilters(); apply(); }
  $('#emptyClear').addEventListener('click', clearAll);
  $('#filterToggle').addEventListener('click', () => { $('#filters').classList.add('open'); $('#filtersOv').classList.add('open'); });
  $('#filtersOv').addEventListener('click', closeAll);

  /* ----- toolbar ----- */
  $('#sort').value = state.sort; $('#shopSearch').value = state.q;
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; apply(); });
  let st; $('#shopSearch').addEventListener('input', (e) => { clearTimeout(st); st = setTimeout(() => { state.q = e.target.value.trim(); apply(); }, 180); });
  $('#more').addEventListener('click', () => { state.shown += PAGE; render({ append: true }); });
  $('#scopeChips').innerHTML = Object.entries(SCOPES).map(([k, v]) => `<button class="chip" data-scope="${k}">${v.label}</button>`).join('');
  $('#scopeChips').addEventListener('click', (e) => { const b = e.target.closest('[data-scope]'); if (b) { state.scope = b.dataset.scope; apply(); } });

  /* ----- render ----- */
  const grid = $('#grid'); let firstRender = true;
  const labelFor = { chars: (v) => CHARACTERS.find((c) => c.id === v).display, cats: (v) => v, collections: (v) => v, sizes: (v) => 'Size ' + v, colors: (v) => v, avail: (v) => ({ in: 'In stock', sale: 'On sale', new: 'New' }[v]) };
  function chips() {
    const out = [];
    Object.keys(labelFor).forEach((k) => state[k].forEach((v) => out.push(`<button type="button" data-rm="${k}|${v}">${labelFor[k](v)} ✕</button>`)));
    if (state.q) out.push(`<button type="button" data-rm="q|">“${state.q.replace(/</g, '&lt;')}” ✕</button>`);
    if (state.min || isFinite(state.max)) out.push(`<button type="button" data-rm="price|">${money(state.min)} – ${isFinite(state.max) ? money(state.max) : '∞'} ✕</button>`);
    $('#activeChips').innerHTML = out.join('');
  }
  $('#activeChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]'); if (!b) return; const [k, v] = b.dataset.rm.split('|');
    if (k === 'q') { state.q = ''; $('#shopSearch').value = ''; } else if (k === 'price') { state.min = 0; state.max = Infinity; } else toggle(state[k], v);
    drawFilters(); apply();
  });
  function sync() {
    const u = new URLSearchParams();
    if (state.scope !== 'all') u.set('s', state.scope); if (state.q) u.set('q', state.q);
    [['char', 'chars'], ['cat', 'cats'], ['coll', 'collections'], ['size', 'sizes'], ['color', 'colors'], ['avail', 'avail']].forEach(([k, s]) => state[s].length && u.set(k, state[s].join(',')));
    if (state.min) u.set('min', state.min); if (isFinite(state.max)) u.set('max', state.max); if (state.sort !== 'default') u.set('sort', state.sort);
    history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
  }
  function heading() {
    const one = state.chars.length === 1 ? CHARACTERS.find((c) => c.id === state.chars[0]) : null, title = one ? one.display : SCOPES[state.scope].label;
    $('#shopTitle').textContent = state.q && !one && state.scope === 'all' ? `Results` : title; $('#crumb').textContent = title; document.title = `${title} — HEROFORGE`;
    $('#shopDesc').textContent = one ? one.tag : state.q ? `Search results for “${state.q}”` : DESC[state.scope];
    $$('#scopeChips .chip').forEach((c) => c.classList.toggle('active', c.dataset.scope === state.scope));
    $('#charBanner').innerHTML = one ? `<div class="char-banner">${one.icon}<div><h2>${one.display}</h2><p>${one.story}</p></div></div>` : '';
  }
  function render({ append = false } = {}) {
    const q = { scope: state.scope, q: state.q, chars: state.chars, cats: state.cats, collections: state.collections, sizes: state.sizes, colors: state.colors, min: state.min, max: state.max, avail: state.avail, sort: state.sort };
    const res = queryProducts(q), vis = res.slice(0, state.shown);
    if (append) { const have = grid.children.length; grid.insertAdjacentHTML('beforeend', vis.slice(have).map(cardHTML).join('')); animateIn($$('.card', grid).slice(have)); }
    else { grid.innerHTML = vis.map(cardHTML).join(''); firstRender ? revealAll(grid) : animateIn($$('.card', grid)); }
    firstRender = false;
    $('#count').innerHTML = `<b>${res.length}</b> ${res.length === 1 ? 'product' : 'products'}`;
    $('#empty').hidden = !!res.length; $('#moreWrap').hidden = vis.length >= res.length; grid.hidden = !res.length;
    chips(); heading(); sync();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  function animateIn(cards) {
    if (typeof gsap === 'undefined' || motion.reduce || !cards.length) return; cards.forEach((c) => c.dataset.done = 1);
    gsap.fromTo(cards, { opacity: 0, y: motion.dist() * .5, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'power3.out', stagger: .04, clearProps: 'transform' });
  }
  function apply() { state.shown = PAGE; render(); }
  addEventListener('app:ready', () => { drawFilters(); render(); });
})();
