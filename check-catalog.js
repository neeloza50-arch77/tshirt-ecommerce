// Run:  node tools/check-catalog.js
// Loads the real catalogue code and verifies IDs, image mapping, per-section / per-character counts and filters.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { console, localStorage: { getItem: () => null, setItem() {} } }; ctx.window = ctx; vm.createContext(ctx);
['art.js', 'data.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
let fail = 0; const ok = (cond, msg) => { if (!cond) { fail++; console.log('  ✗', msg); } };

const problems = run('validateCatalog(undefined,{images:true})');
console.log('Products:', run('PRODUCTS.length'), '| image/ID problems:', problems.length);
problems.slice(0, 20).forEach((p) => console.log('  ✗', p)); fail += problems.length;

const need = { all: 50, tshirts: 25, new: 25, best: 25, featured: 25 };
Object.entries(need).forEach(([s, min]) => {
  const ids = run(`queryProducts({scope:'${s}'}).map(p=>p.id)`);
  console.log(`${s.padEnd(10)} ${String(ids.length).padStart(3)} products (need ${min}+) | dup ids: ${ids.length - new Set(ids).size}`);
  ok(ids.length >= min, `${s} below ${min}`); ok(ids.length === new Set(ids).size, `${s} has duplicate ids`);
});
const charMin = { ironclad: 10, sentinel: 10, 'jade-titan': 10, skyweaver: 10, assembly: 10 };
run('CHARACTERS').forEach((c) => { const n = run(`queryProducts({chars:['${c.id}']}).length`); console.log(`  ${c.display.padEnd(14)} ${String(n).padStart(2)}`); if (charMin[c.id]) ok(n >= charMin[c.id], `${c.id} needs ${charMin[c.id]}+`); ok(n > 0, `${c.id} empty`); });

// Hover mapping: every image of a product is rendered from that product's spec (title = product name)
let checked = 0;
for (const id of run('PRODUCTS.map(p=>p.id)')) {
  const p = run(`(()=>{const p=getProduct('${id}');return {n:p.name,imgs:[0,1].flatMap(ci=>Art.VIEWS.map(v=>Art.renderSVG(p.spec,v,ci)))}})()`);
  p.imgs.forEach((svg) => { checked++; const t = ((svg.match(/<title>(.*?)<\/title>/) || [])[1] || '').replace(/&amp;/g, '&'); ok(t.startsWith(p.n), `image for ${p.n} is titled ${t}`); });
}
console.log(`Image→product check: ${checked} images, mismatches counted in failures`);
// filters use real data
const q = (o) => run(`queryProducts(${JSON.stringify(o)}).length`);
console.log('Filters: char ironclad', q({ chars: ['ironclad'] }), '| cat Oversized Tee', q({ cats: ['Oversized Tee'] }), '| collection Noir', q({ collections: ['Noir'] }), '| size XXL', q({ sizes: ['XXL'] }), '| color Red', q({ colors: ['Red'] }), '| ≤$45', q({ max: 45 }), '| in stock', q({ avail: ['in'] }), '| sale', q({ scope: 'sale' }));
console.log('Search: "web" =', q({ q: 'web' }), '| "ironclad helmet" =', q({ q: 'ironclad helmet' }), '| "marvel" =', q({ q: 'marvel' }), '| "avengers" =', q({ q: 'avengers' }));
ok(q({ chars: ['ironclad'] }) > 0 && q({ sizes: ['XXL'] }) > 0 && q({ avail: ['in'] }) < q({}), 'filters not data-driven');
console.log(fail ? `FAILED (${fail})` : 'ALL CHECKS PASSED'); process.exitCode = fail ? 1 : 0;
