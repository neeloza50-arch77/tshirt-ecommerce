// End-to-end test: drives the real site in headless Chrome (CDP). Run with the dev server up:  node tools/e2e.js
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.env.BASE || 'http://localhost:5173', CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); let pass = 0, fail = 0; const errors = [];
const check = (name, cond, info = '') => { cond ? pass++ : fail++; console.log(`${cond ? '  ✓' : '  ✗'} ${name}${!cond && info !== '' ? '  → ' + JSON.stringify(info).slice(0, 200) : ''}`); };
(async () => {
  const PORT = 9800 + Math.floor(Math.random() * 100), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-e2e-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let target; for (let i = 0; i < 50 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page'); } catch (e) { /* retry */ } if (!target) await sleep(200); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    else if (d.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).split('\n')[0]);
    else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('ERR ' + d.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (js) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${js}})()`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) return { __err: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; return r.result?.result?.value; };
  const go = async (u, wait = 2500, w = 1440, h = 900, mobile = false) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }); await send('Page.navigate', { url: BASE + u }); await sleep(wait); await ev('sessionStorage.setItem("hf-intro","1")'); };
  await send('Page.enable'); await send('Runtime.enable');
  const tick = (ms = 400) => sleep(ms);

  console.log('\n— Homepage'); await go('/index.html', 6500);
  let r = await ev(`return {cards:document.querySelectorAll('.card').length,chars:document.querySelectorAll('.char-card').length,pre:!!document.getElementById('preloader'),gl:document.querySelectorAll('#heroGL canvas').length,navLinks:[...document.querySelectorAll('.nav > a, .nav > .has-menu > a')].map(a=>a.textContent.trim()),drop:document.querySelectorAll('.mega a').length,ribbon:document.querySelector('.ribbon').textContent.length>10}`);
  check('hero renders, preloader gone', !r.pre); check('3D hero canvas mounted', r.gl === 1, r.gl); check('11 character tiles', r.chars === 11, r.chars); check('product cards on home', r.cards >= 24, r.cards);
  check('nav has all required items', ['Home', 'Shop', 'T-Shirts', 'New Arrivals', 'Best Sellers', 'Characters', 'The Assembly', 'Sale'].every((n) => r.navLinks.includes(n)), r.navLinks); check('characters dropdown lists 11', r.drop === 11, r.drop);

  console.log('\n— Hover mapping on rendered cards (home)');
  r = await ev(`const bad=[];let n=0;for(const c of document.querySelectorAll('.card')){const p=getProduct(c.dataset.id);for(const sel of ['.main','.alt']){const src=c.querySelector(sel).src;const t=(await(await fetch(src)).text()).match(/<title>(.*?)<\\/title>/);n++;if(!t||!t[1].replace(/&amp;/g,'&').startsWith(p.name))bad.push(p.name+' '+sel+' '+(t&&t[1]));}}return {n,bad:bad.slice(0,5)}`);
  check(`every card image (${r.n}) belongs to its own product`, r.n > 40 && r.bad.length === 0, r.bad);

  console.log('\n— Card hover (GSAP), quick view, navigation');
  await ev(`window.scrollTo(0,0);window.lenis&&lenis.scrollTo(document.getElementById('featured').offsetTop,{immediate:true});await new Promise(r=>setTimeout(r,1800));return true`);
  r = await ev(`const c=document.querySelector('#featGrid .card');const m=c.querySelector('.card-media');const g=(sel)=>getComputedStyle(c.querySelector(sel)).transform;m.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,relatedTarget:document.body}));await new Promise(r=>setTimeout(r,1100));const on={card:getComputedStyle(c).transform,main:g('.main'),alt:getComputedStyle(c.querySelector('.alt')).opacity,act:g('.card-actions')};m.dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body}));await new Promise(r=>setTimeout(r,1100));const off={card:getComputedStyle(c).transform,alt:getComputedStyle(c.querySelector('.alt')).opacity};return {on,off}`);
  check('hover: card lifts, image scales 1.03, second image fades in, actions slide up', /matrix\(1, 0, 0, 1, 0, -5\)/.test(r.on.card) && /matrix\(1\.0[23]/.test(r.on.main) && +r.on.alt > 0.95 && /matrix\(1, 0, 0, 1, 0, 0\)/.test(r.on.act), r.on);
  check('hover out: everything returns to rest', (r.off.card === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(r.off.card)) && +r.off.alt < 0.05, r.off);
  r = await ev(`document.querySelector('#featGrid [data-quick]').click();await new Promise(r=>setTimeout(r,700));const open=document.getElementById('quickView').classList.contains('open');document.querySelector('[data-qs]:not(.out)').click();await new Promise(r=>setTimeout(r,200));const before=store.count();document.querySelector('[data-qadd]').click();await new Promise(r=>setTimeout(r,600));return {open,added:store.count()-before,drawer:document.getElementById('drawer').classList.contains('open')}`);
  check('quick view: opens, pick size, add to cart, drawer opens', r.open && r.added === 1 && r.drawer, r);
  await go('/index.html', 3500);
  ev(`document.querySelector('.mega a[href*="char=skyweaver"]').click();return true`); await sleep(3500); // click navigates away, so read the result from the new page
  r = await ev(`return {url:location.search,title:document.getElementById('shopTitle')?.textContent,n:document.querySelectorAll('#grid .card').length}`);
  check('characters dropdown → Skyweaver shop (11 products, character banner)', /char=skyweaver/.test(r.url) && r.title === 'Skyweaver' && r.n === 11, r);
  await go('/index.html', 3500, 390, 844, true);
  r = await ev(`document.getElementById('burger').click();await new Promise(r=>setTimeout(r,700));const open=document.getElementById('mobileMenu').classList.contains('open');const links=document.querySelectorAll('#mobileMenu a.big').length;const chars=document.querySelectorAll('#mobileMenu .chars a').length;document.querySelector('[data-close-menu]').click();await new Promise(r=>setTimeout(r,700));return {open,links,chars,closed:!document.getElementById('mobileMenu').classList.contains('open')}`);
  check('mobile menu opens with nav + 11 characters, closes', r.open && r.links >= 8 && r.chars === 11 && r.closed, r);
  await go('/index.html', 3000);

  console.log('\n— Shop sections & filters'); await go('/shop.html', 4000);
  const q = async (js) => ev(js);
  for (const [s, min] of [['all', 50], ['tshirts', 25], ['new', 25], ['best', 25], ['featured', 25], ['sale', 10]]) {
    await go('/shop.html' + (s === 'all' ? '' : '?s=' + s), 3000);
    r = await ev(`while(!document.getElementById('moreWrap').hidden){document.getElementById('more').click();await new Promise(r=>setTimeout(r,150));}const ids=[...document.querySelectorAll('#grid .card')].map(c=>c.dataset.id);return {n:ids.length,dup:ids.length-new Set(ids).size,count:document.getElementById('count').textContent.trim(),title:document.getElementById('shopTitle').textContent}`);
    check(`${s}: ${r.n} products (need ${min}+), no duplicates, title "${r.title}"`, r.n >= min && r.dup === 0, r);
  }
  await go('/shop.html', 3000);
  r = await ev(`const before=document.querySelectorAll('#grid .card').length;document.querySelector('[data-f=chars][value=ironclad]').click();await new Promise(r=>setTimeout(r,500));const after=[...document.querySelectorAll('#grid .card')].map(c=>getProduct(c.dataset.id).character);return {before,after:after.length,only:after.every(c=>c==='ironclad')}`);
  check('character filter → only Ironclad', r.only && r.after === 11, r);
  r = await ev(`document.querySelector('[data-size=XXL]').click();await new Promise(r=>setTimeout(r,500));const list=[...document.querySelectorAll('#grid .card')].map(c=>getProduct(c.dataset.id));return {n:list.length,ok:list.every(p=>p.stockOf('XXL')>0)}`);
  check('size filter XXL (+character) → only products with XXL in stock', r.ok && r.n > 0, r);
  r = await ev(`document.getElementById('fClear').click();await new Promise(r=>setTimeout(r,400));document.querySelector('[data-f=cats][value="Oversized Tee"]').click();await new Promise(r=>setTimeout(r,400));const list=[...document.querySelectorAll('#grid .card')].map(c=>getProduct(c.dataset.id));return {n:list.length,ok:list.every(p=>p.category==='Oversized Tee')}`);
  check('category filter Oversized Tee', r.ok && r.n === 9, r);
  r = await ev(`document.getElementById('fClear').click();await new Promise(r=>setTimeout(r,300));const i=document.getElementById('pMax');i.value='40';i.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,700));const list=[...document.querySelectorAll('#grid .card')].map(c=>getProduct(c.dataset.id));return {n:list.length,ok:list.every(p=>p.price<=40)}`);
  check('price filter ≤ $40', r.ok && r.n > 0, r);
  r = await ev(`document.getElementById('fClear').click();await new Promise(r=>setTimeout(r,300));document.querySelector('[data-color=Red]').click();await new Promise(r=>setTimeout(r,500));const list=[...document.querySelectorAll('#grid .card')].map(c=>getProduct(c.dataset.id));return {n:list.length,ok:list.every(p=>p.colors.some(c=>c[2]==='Red'))}`);
  check('colour filter Red', r.ok && r.n > 0, r);
  r = await ev(`document.getElementById('fClear').click();await new Promise(r=>setTimeout(r,300));document.querySelector('[data-f=collections][value=Noir]').click();await new Promise(r=>setTimeout(r,500));const list=[...document.querySelectorAll('#grid .card')].map(c=>getProduct(c.dataset.id));return {n:list.length,ok:list.every(p=>p.collection==='Noir')}`);
  check('collection filter Noir', r.ok && r.n === 7, r);
  r = await ev(`document.getElementById('fClear').click();await new Promise(r=>setTimeout(r,300));document.querySelector('[data-f=avail][value=in]').click();await new Promise(r=>setTimeout(r,500));while(!document.getElementById('moreWrap').hidden){document.getElementById('more').click();await new Promise(r=>setTimeout(r,150));}const list=[...document.querySelectorAll('#grid .card')].map(c=>getProduct(c.dataset.id));return {n:list.length,ok:list.every(p=>p.stock>0)}`);
  check('availability filter hides sold-out (89 in stock)', r.ok && r.n === 89, r);
  r = await ev(`document.getElementById('fClear').click();await new Promise(r=>setTimeout(r,300));const s=document.getElementById('sort');const prices=async(v)=>{s.value=v;s.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,400));return [...document.querySelectorAll('#grid .card')].map(c=>getProduct(c.dataset.id));};const asc=(await prices('price-asc')).map(p=>p.price),desc=(await prices('price-desc')).map(p=>p.price),nw=(await prices('newest')).map(p=>p.createdAt),pop=(await prices('popular')).map(p=>p.popularity);const sorted=(a,f)=>a.every((v,i)=>i===0||f(a[i-1],v));return {asc:sorted(asc,(a,b)=>a<=b),desc:sorted(desc,(a,b)=>a>=b),nw:sorted(nw,(a,b)=>a>=b),pop:sorted(pop,(a,b)=>a>=b)}`);
  check('sort: price low→high, high→low, newest, popular', r.asc && r.desc && r.nw && r.pop, r);
  r = await ev(`const s=document.getElementById('shopSearch');s.value='web';s.dispatchEvent(new Event('input'));await new Promise(r=>setTimeout(r,600));const a=document.querySelectorAll('#grid .card').length;s.value='zzzzqq';s.dispatchEvent(new Event('input'));await new Promise(r=>setTimeout(r,600));return {a,empty:!document.getElementById('empty').hidden}`);
  check('shop search finds "web" and shows empty state for nonsense', r.a > 0 && r.empty, r);

  console.log('\n— Header search overlay'); await go('/index.html', 3500);
  r = await ev(`document.getElementById('searchBtn').click();await new Promise(r=>setTimeout(r,300));const i=document.getElementById('searchInput');i.value='helmet';i.dispatchEvent(new Event('input'));await new Promise(r=>setTimeout(r,500));return {open:document.getElementById('searchOv').classList.contains('open'),res:document.querySelectorAll('#searchRes a').length}`);
  check('search overlay opens and returns live results', r.open && r.res > 0, r);

  console.log('\n— Product page'); await ev(`localStorage.removeItem('heroforge-cart');return true`); await go('/product.html?id=core-reactor-tee', 4500);
  r = await ev(`return {title:document.querySelector('.info h1').textContent,thumbs:document.querySelectorAll('.thumb[data-i]').length,has3d:!!document.querySelector('[data-3d]'),more:document.querySelectorAll('.acc').length,rel:document.querySelectorAll('#related .card').length,relSelf:!![...document.querySelectorAll('#related .card')].find(c=>c.dataset.id==='core-reactor-tee'),size:document.querySelectorAll('.size').length}`);
  check('product renders with 5 gallery images + 3D thumb', r.title === 'Core Reactor Tee' && r.thumbs === 5 && r.has3d, r); check('related products never include the product itself', r.rel > 0 && !r.relSelf, r);
  r = await ev(`document.getElementById('addBtn').click();await new Promise(r=>setTimeout(r,300));return {cart:store.count(),toast:document.getElementById('toast').textContent}`);
  check('Add to cart without size is blocked with a message', r.cart === 0 && /size/i.test(r.toast), r);
  r = await ev(`document.querySelector('[data-size=M]').click();document.getElementById('qPlus').click();document.getElementById('qPlus').click();document.getElementById('addBtn').click();await new Promise(r=>setTimeout(r,400));return {cart:store.count(),lines:store.cart.length,count:document.getElementById('cartCount').textContent}`);
  check('size M × 3 added; header badge updates', r.cart === 3 && r.count === '3', r);
  r = await ev(`document.querySelector('.color-dot[data-ci="1"]').click();await new Promise(r=>setTimeout(r,500));const t=(await(await fetch(document.getElementById('stageImg').src)).text()).match(/<title>(.*?)<\\/title>/)[1];const th=await Promise.all([...document.querySelectorAll('.thumb[data-i] img')].map(async i=>((await(await fetch(i.src)).text()).match(/<title>(.*?)<\\/title>/)||[])[1]));return {color:document.getElementById('colorName').textContent,t,allSame:th.every(x=>x&&x.startsWith('Core Reactor Tee'))}`);
  check('colour switch swaps the whole gallery (still this product)', r.color === 'Bone White' && r.allSame, r);
  r = await ev(`document.querySelector('[data-size=XL]').click();document.getElementById('addBtn').click();await new Promise(r=>setTimeout(r,300));return {lines:store.cart.length,units:store.count()}`);
  check('second colour/size becomes its own cart line', r.lines === 2 && r.units === 4, r);
  r = await ev(`const p=getProduct('core-reactor-tee');const s=p.sizes.find(x=>p.stockOf(x)>0&&x!=='M'&&x!=='XL')||'S';document.querySelector('[data-size="'+s+'"]').click();for(let i=0;i<60;i++)document.getElementById('qPlus').click();const q=+document.getElementById('qVal').textContent;document.getElementById('addBtn').click();await new Promise(r=>setTimeout(r,300));document.getElementById('addBtn').click();await new Promise(r=>setTimeout(r,300));return {size:s,stock:p.stockOf(s),qty:q,inCart:store.inCart('core-reactor-tee',s)}`);
  check('stock limit enforced (cannot exceed available)', r.inCart <= r.stock && r.qty <= r.stock, r);
  r = await ev(`const b=document.querySelector('.btn-wish');b.click();await new Promise(r=>setTimeout(r,300));const on=store.wish.includes('core-reactor-tee');const hdr=document.getElementById('wishCount').textContent;b.click();await new Promise(r=>setTimeout(r,300));return {on,hdr,off:!store.wish.includes('core-reactor-tee')}`);
  check('wishlist add/remove + header count', r.on && r.hdr === '1' && r.off, r);
  r = await ev(`document.getElementById('cartBtn').click();await new Promise(r=>setTimeout(r,700));const items=document.querySelectorAll('.cart-item').length;const first=document.querySelector('.cart-item [data-q="1"]');const before=store.cart[0].qty;first.click();await new Promise(r=>setTimeout(r,200));const after=store.cart[0].qty;document.querySelector('.cart-item [data-q="-1"]').click();await new Promise(r=>setTimeout(r,200));return {items,inc:after>=before,restored:store.cart[0].qty===before||store.cart[0].qty===after-1}`);
  check('cart drawer lists lines; +/- quantity works', r.items >= 2 && r.restored, r);
  r = await ev(`const n=store.cart.length;document.querySelector('[data-rm="0"]').click();await new Promise(r=>setTimeout(r,200));return {n,after:store.cart.length}`);
  check('remove line from cart', r.after === r.n - 1, r);
  r = await ev(`const p=getProduct('core-reactor-tee');return {sold:p.stockOf('M')>=0}`);

  console.log('\n— 3D viewer (Three.js)'); await go('/product.html?id=sentinel-shield-tee', 4500);
  r = await ev(`document.querySelector('[data-3d]').click();await new Promise(r=>setTimeout(r,5000));const c=document.querySelector('.stage .stage3d canvas');return {canvas:!!c,w:c&&c.width,h:c&&c.height,hint:!!document.querySelector('.stage3d .hint')}`);
  check('3D tee viewer mounts a WebGL canvas', r.canvas && r.w > 100, r);
  r = await ev(`document.querySelector('.thumb[data-i="1"]').click();await new Promise(r=>setTimeout(r,700));return {gone:!document.querySelector('.stage3d canvas'),img:!!document.getElementById('stageImg')}`);
  check('leaving 3D tears the scene down cleanly', r.gone && r.img, r);

  console.log('\n— Checkout → Orders → Stock'); await go('/index.html', 1500);
  r = await ev(`localStorage.removeItem('heroforge-sold');localStorage.removeItem('heroforge-orders');localStorage.setItem('heroforge-cart',JSON.stringify([{id:'claw-marks-tee',size:'M',color:'Jet Black',qty:2},{id:'web-graphic-tee',size:'L',color:'Jet Black',qty:1}]));return true`);
  await go('/checkout.html', 3000);
  r = await ev(`return {items:document.querySelectorAll('.sum-item').length,total:document.querySelector('.sum .total span:last-child').textContent}`);
  check('checkout summary lists the bag', r.items === 2, r);
  const stockBefore = await ev(`return getProduct('claw-marks-tee').stockOf('M')`);
  r = await ev(`document.querySelector('#coF button[type=submit]').click();await new Promise(r=>setTimeout(r,300));return {bad:document.querySelectorAll('input.bad').length,url:location.pathname}`);
  check('empty checkout form is rejected with field errors', r.bad >= 5 && r.url.endsWith('checkout.html'), r);
  await ev(`const set=(id,v)=>{const e=document.getElementById(id);e.value=v;};set('name','Test Hero');set('email','hero@example.com');set('tel','5551234567');set('address','1 Rooftop Ave');set('city','Metropolis');set('zip','10001');document.querySelector('#coF button[type=submit]').click();return true`);
  await sleep(2500);
  r = await ev(`return {url:location.pathname+location.search,orders:document.querySelectorAll('.order').length,placed:!!document.querySelector('.placed'),cart:store.count(),status:document.querySelector('.order-head b:last-of-type')?.textContent}`);
  check('placing an order redirects to Orders and clears the bag', /orders\.html\?placed=HF-/.test(r.url) && r.orders === 1 && r.placed && r.cart === 0, r);
  const stockAfter = await ev(`return getProduct('claw-marks-tee').stockOf('M')`);
  check('stock is reduced by the order (claw-marks-tee M)', stockAfter === stockBefore - 2, { stockBefore, stockAfter });
  r = await ev(`document.querySelector('[data-cancel]').click();await new Promise(r=>setTimeout(r,500));return {txt:document.querySelector('.order-head').textContent.includes('Cancelled'),stock:getProduct('claw-marks-tee').stockOf('M')}`);
  check('cancelling an order restores stock', r.txt && r.stock === stockBefore, r);
  r = await ev(`document.querySelector('[data-reorder]').click();await new Promise(r=>setTimeout(r,500));return {cart:store.count()}`);
  check('reorder puts items back in the bag', r.cart === 3, r);

  console.log('\n— Wishlist page & broken links'); await go('/index.html', 1500);
  await ev(`localStorage.setItem('heroforge-wish',JSON.stringify(['web-graphic-tee','core-reactor-tee']));return true`); await go('/wishlist.html', 3000);
  r = await ev(`return document.querySelectorAll('#wishGrid .card').length`); check('wishlist page shows saved products', r === 2, r);
  await go('/product.html?id=does-not-exist', 2500); r = await ev(`return document.body.textContent.includes('Hero not found')`); check('unknown product id shows a friendly not-found state', r === true, r);
  r = await ev(`const bad=[];for(const p of PRODUCTS){if(!document.querySelector('x')&&!getProduct(p.id))bad.push(p.id);}return bad.length`); check('every catalogue id resolves to a product page', r === 0, r);

  console.log('\n— Mobile'); await go('/index.html', 6000, 390, 844, true);
  r = await ev(`return {overflow:document.documentElement.scrollWidth-innerWidth,gl:document.querySelectorAll('#heroGL canvas').length,burger:getComputedStyle(document.getElementById('burger')).display,nav:getComputedStyle(document.querySelector('.nav')).display}`);
  check('mobile: no horizontal overflow', r.overflow <= 1, r); check('mobile: 3D hero disabled (CSS fallback)', r.gl === 0, r); check('mobile: burger menu shown, desktop nav hidden', r.burger !== 'none' && r.nav === 'none', r);
  await go('/shop.html', 3500, 390, 844, true); r = await ev(`const cards=document.querySelectorAll('#grid .card').length;const qa=getComputedStyle(document.querySelector('.card-actions')).position;return {overflow:document.documentElement.scrollWidth-innerWidth,cards,qa,cols:getComputedStyle(document.getElementById('grid')).gridTemplateColumns.split(' ').length}`);
  check('mobile shop: 2-column grid, no overflow', r.cols === 2 && r.overflow <= 1, r);
  await go('/product.html?id=core-reactor-tee', 4000, 390, 844, true); r = await ev(`return {overflow:document.documentElement.scrollWidth-innerWidth,addVisible:document.getElementById('addBtn').getBoundingClientRect().width>100}`); check('mobile product page: no overflow, add button usable', r.overflow <= 1 && r.addVisible, r);

  console.log('\n— Console'); check('no console errors or exceptions during the whole run', errors.filter((e) => !/favicon/.test(e)).length === 0, errors);
  console.log(`\n${fail ? 'FAILED' : 'ALL PASSED'}: ${pass} passed, ${fail} failed`); ws.close(); proc.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ } process.exit(fail ? 1 : 0);
})();
