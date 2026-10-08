// node tools/perf.js — page-load metrics (LCP, CLS, long tasks, requests, 3D payload) + reduced-motion behaviour, via headless Chrome.
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.env.BASE || 'http://localhost:5173', CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const PORT = 9400 + Math.floor(Math.random() * 100), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-perf-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let target; for (let i = 0; i < 50 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page'); } catch (e) { /* retry */ } if (!target) await sleep(200); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); let id = 0; const pend = new Map(); const reqs = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Network.loadingFinished') reqs.push(d.params); else if (d.method === 'Network.responseReceived') reqs.push({ url: d.params.response.url, type: d.params.type }); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (js) => (await send('Runtime.evaluate', { expression: `(async()=>{${js}})()`, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const probe = `window.__m={cls:0,lcp:0,long:0};new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)__m.cls+=e.value}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())__m.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())__m.long+=Math.max(0,e.duration-50)}).observe({type:'longtask',buffered:true});`;
  async function run(label, u, { w = 1440, h = 900, mobile = false, reduce = false } = {}) {
    reqs.length = 0; await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: probe }); await send('Page.navigate', { url: BASE + u }); await sleep(7000);
    const m = await ev(`const nav=performance.getEntriesByType('navigation')[0];const res=performance.getEntriesByType('resource');return {dcl:Math.round(nav.domContentLoadedEventEnd),load:Math.round(nav.loadEventEnd),lcp:Math.round(__m.lcp),cls:+__m.cls.toFixed(3),longMs:Math.round(__m.long),dom:document.getElementsByTagName('*').length,kb:Math.round(res.reduce((n,r)=>n+(r.transferSize||0),0)/1024),n:res.length,three:res.some(r=>/three/.test(r.name)),canvas:document.querySelectorAll('canvas').length,pre:!!document.getElementById('preloader'),hiddenReveals:[...document.querySelectorAll('[data-reveal]')].filter(e=>getComputedStyle(e).opacity==='0').length,heap:Math.round((performance.memory||{}).usedJSHeapSize/1048576)||0}`);
    console.log(label.padEnd(34), JSON.stringify(m));
    return m;
  }
  console.log('metric key → dcl/load/lcp in ms, cls (layout shift), longMs (blocking time over 50ms tasks), dom nodes, kb transferred (CDN files are cached/opaque), three = Three.js fetched, hiddenReveals = elements still invisible\n');
  await run('home · desktop', '/index.html'); await run('home · mobile 390', '/index.html', { w: 390, h: 844, mobile: true });
  await run('shop · desktop', '/shop.html'); await run('product · desktop', '/product.html?id=core-reactor-tee'); await run('product · mobile', '/product.html?id=core-reactor-tee', { w: 390, h: 844, mobile: true });
  const rm = await run('home · REDUCED MOTION', '/index.html', { reduce: true });
  console.log(rm.pre === false && rm.hiddenReveals === 0 && rm.canvas === 0 && !rm.three ? '\n✓ reduced motion: no preloader, nothing hidden, no WebGL, Three.js not even downloaded' : '\n✗ reduced-motion problem');
  ws.close(); proc.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ } process.exit(0);
})();
