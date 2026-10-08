/* Checkout: validates stock again, creates the order, reduces stock, clears the bag. Demo only — no payment data is collected. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#coForm'), sum = $('#coSum'), read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const state = { ship: 'standard', pay: 'cod' };

  function reconcile() { // drop/trim anything that has gone out of stock since it was added
    let changed = false;
    store.cart = store.cart.filter((it) => { const p = getProduct(it.id); if (!p) { changed = true; return false; } const max = p.stockOf(it.size); if (max <= 0) { changed = true; return false; } if (it.qty > max) { it.qty = max; changed = true; } return true; });
    if (changed) { store.save(); renderCart(); toast('Some items were adjusted to match available stock'); }
  }
  const shipCost = () => (state.ship === 'express' ? 14 : store.subtotal() >= STORE.freeShipFrom ? 0 : STORE.shipping);
  const total = () => store.subtotal() + shipCost();

  function drawSummary() {
    sum.innerHTML = `<div class="panel"><h3>Order summary</h3>${store.cart.map((it) => { const p = getProduct(it.id), ci = Math.max(0, p.colors.findIndex((c) => c[0] === it.color)); return `<div class="sum-item"><img src="${p.thumb(ci)}" alt="" width="60" height="75"><div><b>${p.name}</b><small>${it.color} · ${it.size} · Qty ${it.qty}</small></div><strong>${money(p.price * it.qty)}</strong></div>`; }).join('')}
      <div class="row" style="margin-top:10px"><span>Subtotal</span><span>${money(store.subtotal())}</span></div><div class="row"><span>Shipping (${state.ship})</span><span>${shipCost() ? money(shipCost()) : 'Free'}</span></div><div class="row total"><span>Total</span><span>${money(total())}</span></div>
      <p class="note">Taxes are not calculated in this demo.</p></div>`;
  }
  function draw() {
    reconcile();
    if (!store.cart.length) { form.innerHTML = '<div class="empty"><h3>Your bag is empty</h3><p>Add a tee before checking out.</p><br><a class="btn btn-red" href="shop.html">Shop now</a></div>'; sum.hidden = true; return; }
    const f = (id, label, type = 'text', extra = '', full = false) => `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" ${extra} autocomplete="${id}"><span class="err" id="${id}Err"></span></div>`;
    form.innerHTML = `<form id="coF" novalidate>
      <div class="panel"><h3><span>1</span>Contact</h3><div class="fields">${f('name', 'Full name', 'text', 'required', true)}${f('email', 'Email', 'email', 'required')}${f('tel', 'Phone', 'tel', 'required')}</div></div>
      <div class="panel"><h3><span>2</span>Shipping address</h3><div class="fields">${f('address', 'Street address', 'text', 'required', true)}${f('city', 'City', 'text', 'required')}${f('zip', 'ZIP / postal code', 'text', 'required')}
        <div class="field full"><label for="country">Country</label><select id="country"><option>United States</option><option>Canada</option><option>United Kingdom</option><option>India</option><option>Australia</option></select></div></div></div>
      <div class="panel"><h3><span>3</span>Delivery</h3>
        <label class="radio-card"><input type="radio" name="ship" value="standard" checked><span>Standard · 3–5 days</span><b>${store.subtotal() >= STORE.freeShipFrom ? 'Free' : money(STORE.shipping)}</b></label>
        <label class="radio-card"><input type="radio" name="ship" value="express"><span>Express · 1–2 days</span><b>${money(14)}</b></label></div>
      <div class="panel"><h3><span>4</span>Payment</h3>
        <label class="radio-card"><input type="radio" name="pay" value="cod" checked><span>Pay on delivery (demo)</span></label>
        <label class="radio-card"><input type="radio" name="pay" value="card"><span>Card (demo — no card details are collected)</span></label>
        <p class="note">This is a demonstration store: no payment is processed and no real order is created.</p></div>
      <button class="btn btn-red btn-block" type="submit">Place order · <span id="btnTotal">${money(total())}</span></button></form>`;
    drawSummary();
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'ship') state.ship = e.target.value; if (e.target.name === 'pay') state.pay = e.target.value; drawSummary(); $('#btnTotal').textContent = money(total()); });
  form.addEventListener('submit', (e) => {
    e.preventDefault(); reconcile(); if (!store.cart.length) return draw();
    const val = {}, rules = { name: (v) => v.length > 2, email: (v) => /^\S+@\S+\.\S+$/.test(v), tel: (v) => v.replace(/\D/g, '').length >= 7, address: (v) => v.length > 5, city: (v) => v.length > 1, zip: (v) => v.length >= 3 };
    let ok = true;
    Object.keys(rules).forEach((k) => { const el = $('#' + k), v = el.value.trim(), good = rules[k](v); val[k] = v; el.classList.toggle('bad', !good); $('#' + k + 'Err').textContent = good ? '' : 'Please check this field'; if (!good) { if (ok) el.focus(); ok = false; } });
    if (!ok) return toast('Please fix the highlighted fields');
    const items = store.cart.map((it) => { const p = getProduct(it.id); return { id: p.id, name: p.name, size: it.size, color: it.color, qty: it.qty, price: p.price }; });
    const order = { id: 'HF-' + Date.now().toString(36).toUpperCase(), date: new Date().toISOString(), items, subtotal: store.subtotal(), shipping: shipCost(), shipMethod: state.ship, total: total(), pay: state.pay, address: { ...val, country: $('#country').value } };
    const orders = read('heroforge-orders', []); orders.unshift(order); localStorage.setItem('heroforge-orders', JSON.stringify(orders));
    recordSale(items); store.clearCart();
    location.href = `orders.html?placed=${order.id}`;
  });
  addEventListener('app:ready', () => { draw(); if (!motion.reduce) gsap.from('.panel', { opacity: 0, y: 24, duration: .6, stagger: .08, ease: 'power3.out', clearProps: 'transform,opacity' }); });
})();
