/* Orders: list, demo tracking (advances with time), cancel (restores stock), reorder. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const STEPS = ['Processing', 'Packed', 'Shipped', 'Delivered'];
  const stepOf = (o) => (o.cancelled ? -1 : Math.min(3, Math.floor((Date.now() - new Date(o.date)) / 60000 / 2))); // demo: a step every 2 minutes
  const placed = new URLSearchParams(location.search).get('placed');
  function draw() {
    const orders = read('heroforge-orders', []), root = $('#ordersList');
    if (!orders.length) { root.innerHTML = '<div class="empty"><h3>No orders yet</h3><p>Orders you place will show up here.</p><br><a class="btn btn-red" href="shop.html">Start shopping</a></div>'; return; }
    root.innerHTML = (placed ? `<div class="placed"><b>Order ${placed} placed.</b> Thanks for suiting up! This is a demo order — nothing will be shipped or charged.</div>` : '') + orders.map((o) => {
      const s = stepOf(o), canCancel = s === 0 && !o.cancelled;
      return `<article class="order" data-id="${o.id}"><div class="order-head"><div><small>Order</small><b>${o.id}</b></div><div><small>Placed</small><b>${new Date(o.date).toLocaleString()}</b></div><div><small>Total</small><b>${money(o.total)}</b></div><div><small>Status</small><b style="color:${o.cancelled ? 'var(--red-hot)' : '#fff'}">${o.cancelled ? 'Cancelled' : STEPS[s]}</b></div></div>
        <div class="order-body"><div class="order-items">${o.items.map((i) => { const p = getProduct(i.id), ci = p ? Math.max(0, p.colors.findIndex((c) => c[0] === i.color)) : 0; return `<a href="product.html?id=${i.id}"><img src="${p ? p.thumb(ci) : ''}" alt="" width="54" height="68"><span>${i.name}<br><small style="color:var(--muted)">${i.color} · ${i.size} · ×${i.qty}</small></span></a>`; }).join('')}</div>
        ${o.cancelled ? '' : `<div class="track">${STEPS.map((n, k) => `<div class="${k <= s ? 'done' : ''}">${n}</div>`).join('')}</div>`}
        <p class="note">Ship to ${o.address.name}, ${o.address.address}, ${o.address.city} ${o.address.zip}, ${o.address.country} · ${o.shipMethod} · ${o.pay === 'cod' ? 'Pay on delivery' : 'Card (demo)'}</p>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn btn-ghost" data-reorder="${o.id}" type="button">Reorder</button>${canCancel ? `<button class="btn btn-ghost" data-cancel="${o.id}" type="button">Cancel order</button>` : ''}</div></div></article>`;
    }).join('');
  }
  $('#ordersList').addEventListener('click', (e) => {
    const orders = read('heroforge-orders', []);
    const c = e.target.closest('[data-cancel]'), r = e.target.closest('[data-reorder]');
    if (c) { const o = orders.find((x) => x.id === c.dataset.cancel); if (o && !o.cancelled) { o.cancelled = true; restoreSale(o.items); localStorage.setItem('heroforge-orders', JSON.stringify(orders)); toast('Order cancelled — stock restored'); draw(); } }
    if (r) { const o = orders.find((x) => x.id === r.dataset.reorder); let n = 0; o.items.forEach((i) => { const res = store.add(i.id, { size: i.size, color: i.color, qty: i.qty }); if (res.ok) n += res.added; }); toast(n ? `<b>${n}</b> item${n > 1 ? 's' : ''} added to your bag` : 'Those items are out of stock'); if (n) openCart(); }
  });
  addEventListener('app:ready', () => { draw(); setInterval(draw, 30000); if (!motion.reduce) gsap.from('.order, .placed', { opacity: 0, y: 24, duration: .6, stagger: .08, ease: 'power3.out', clearProps: 'transform,opacity' }); });
})();
