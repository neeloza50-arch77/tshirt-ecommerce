/* Home page: content from the catalogue queries, cinematic intro, lazy 3D (hero + showcase). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hasGSAP = typeof gsap !== 'undefined';

  /* ----- content (each section runs its OWN catalogue query) ----- */
  const featured = queryProducts({ scope: 'featured' }), fresh = queryProducts({ scope: 'new' }), best = queryProducts({ scope: 'best' });
  const pick = (list, ids) => ids.map(getProduct).filter(Boolean).concat(list).filter((p, i, a) => a.indexOf(p) === i);
  $('#statP').textContent = PRODUCTS.length; $('#statC').textContent = CHARACTERS.length;
  $('#marquee').innerHTML = Array.from({ length: 2 }, () => ['Suit up', 'New drop', 'Original art', 'Heavyweight cotton', 'Free shipping $' + STORE.freeShipFrom + '+', 'Built to be worn loud'].map((t) => `<span>${t}</span>`).join('')).join('');
  $('#charGrid').innerHTML = CHARACTERS.map((c) => `<a class="char-card" href="shop.html?char=${c.id}" style="--cc:${c.a}" data-reveal>${c.icon}<h3>${c.display}</h3><p>${c.tag}</p><small><span>${c.count} tees</span><span>Shop →</span></small></a>`).join('');
  // each home section shows different tees (a product appears once on this page); the full lists live on the shop page
  const shown = new Set(), take = (list, n) => { const out = list.filter((p) => !shown.has(p.id)).slice(0, n); out.forEach((p) => shown.add(p.id)); return out; };
  $('#featGrid').innerHTML = take(featured, 8).map(cardHTML).join('');
  $('#newStrip').innerHTML = take(fresh, 10).map(cardHTML).join('');
  $('#bestGrid').innerHTML = take(best, 8).map(cardHTML).join('');
  $('#promoA img').src = getProduct('assembly-cinematic-tee').gallery(0)[3]; $('#promoB img').src = getProduct('ironclad-cinematic-tee').gallery(0)[3];

  // hero product cards
  const hv = pick(featured, ['core-reactor-tee', 'skyweaver-visor-tee', 'sentinel-shield-tee']);
  [['#hvA', 0, 0], ['#hvB', 1, 2], ['#hvC', 2, 1]].forEach(([sel, i, v]) => { const p = hv[i], a = $(sel); a.href = `product.html?id=${p.id}`; a.setAttribute('aria-label', p.name); $('img', a).src = p.gallery(0)[v]; $('img', a).alt = p.name; });
  $('#shieldFb').innerHTML = Art.emblem('shield', { a: '#e62429', l: '#c9cdd6', k: '#e9ebef' });

  /* ----- 3D showcase ----- */
  const show = CHARACTERS.slice(0, 5).map((c) => queryProducts({ chars: [c.id], scope: 'featured' }).find((p) => p.type !== 'long') || queryProducts({ chars: [c.id] })[0]);
  let showP = show[0], tee = null, teeMod = null, ci = 0;
  $('#scChips').innerHTML = show.map((p, i) => `<button class="chip ${i ? '' : 'active'}" data-i="${i}">${p.characterName}</button>`).join('');
  const fb = $('#showFallback img');
  function showUpdate() {
    fb.src = showP.gallery(0)[0]; fb.alt = showP.name; $('#scLink').href = `product.html?id=${showP.id}`;
    if (tee) tee.destroy(), (tee = null);
    if (teeMod && $('#showStage')) {
      teeMod.mountTee($('#showStage'), showP, { ci }).then((t) => { tee = t; $('#showFallback').style.display = 'none'; $('.hint', $('#showStage')).style.display = ''; }).catch(() => { $('#showFallback').style.display = ''; });
    }
  }
  $('#scChips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip', $('#scChips')).forEach((c) => c.classList.toggle('active', c === b)); showP = show[+b.dataset.i]; showUpdate(); });
  showUpdate();
  if (!caps.three) $('.hint', $('#showStage')).style.display = 'none';

  // lazy-load Three.js only when the section is near the viewport (and the device can afford it)
  const loadThree = () => (teeMod ? Promise.resolve(teeMod) : import('./three-scenes.js').then((m) => (teeMod = m)));
  if (caps.three && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); loadThree().then(showUpdate).catch(() => {}); } }, { rootMargin: '300px' });
    io.observe($('#showStage'));
  }
  let heroGL = null;
  function startHero3D() {
    if (!caps.autoThree()) return;
    loadThree().then((m) => { heroGL = m.mountHero($('#heroGL')); if (hasGSAP) gsap.to('#shieldFb', { opacity: 0, duration: .8 }); }).catch(() => {});
  }

  /* ----- newsletter ----- */
  $('#newsForm').addEventListener('submit', (e) => {
    e.preventDefault(); const v = $('#newsEmail').value.trim(), msg = $('#newsMsg');
    if (!/^\S+@\S+\.\S+$/.test(v)) { msg.textContent = 'Please enter a valid email address.'; return; }
    msg.textContent = 'You\'re in — check your inbox for your 10% code. (Demo: nothing is sent.)'; e.target.reset();
  });

  /* ----- intro + GSAP ----- */
  function intro() {
    const pre = $('#preloader');
    if (!hasGSAP || motion.reduce) { pre.remove(); startHero3D(); return; }
    animateLines(document);
    const d = motion.dist();
    const hero = () => {
      $$('[data-now]').forEach((el) => el._run && el._run());
      gsap.from('[data-hero]', { opacity: 0, y: d * .6, duration: .8, ease: 'power3.out', stagger: .09, delay: .25, clearProps: 'transform' });
      gsap.from('.hv-card', { opacity: 0, y: d * 1.4, rotate: 0, duration: 1, ease: 'power3.out', stagger: .14, delay: .35 });
      gsap.from('.shield-fallback', { opacity: 0, scale: .9, duration: 1.2, ease: 'power3.out', delay: .2 });
      gsap.from('.header .container', { opacity: 0, y: -14, duration: .7, ease: 'power3.out', delay: .2 });
      setTimeout(startHero3D, 600);
    };
    if (sessionStorage.getItem('hf-intro')) { pre.remove(); hero(); }
    else {
      sessionStorage.setItem('hf-intro', 1);
      const sh = $('#plShield'), mk = $('#plMark'), len = sh.getTotalLength();
      gsap.set(sh, { strokeDasharray: len, strokeDashoffset: len }); gsap.set(mk, { opacity: 0 }); gsap.set('.preloader .name', { opacity: 0, y: 8 });
      gsap.timeline({ onComplete: () => pre.remove() })
        .to(sh, { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut' })
        .to(sh, { fill: 'rgba(230,36,41,.9)', duration: .25 }, '-=.15').to(mk, { opacity: 1, duration: .2 }, '<')
        .to('.preloader .name', { opacity: 1, y: 0, duration: .35 }, '<')
        .to(pre, { yPercent: -100, duration: .7, ease: 'power4.inOut', delay: .15 }).add(hero, '-=.35');
    }
    // parallax: hero cards respond to the pointer (desktop only)
    gsap.matchMedia().add('(hover: hover) and (min-width: 1021px)', () => {
      const cards = $$('.hv-card'), move = (e) => { const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; cards.forEach((c, i) => gsap.to(c, { x: x * (14 + i * 10), y: y * (10 + i * 8), duration: .9, ease: 'power2.out', overwrite: 'auto' })); };
      addEventListener('pointermove', move, { passive: true }); return () => removeEventListener('pointermove', move);
    });
    revealAll();
    ScrollTrigger.refresh();
  }
  addEventListener('app:ready', intro);
  addEventListener('pagehide', () => { heroGL && heroGL.destroy(); tee && tee.destroy(); });
})();
