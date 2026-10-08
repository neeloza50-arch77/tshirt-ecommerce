// node tools/cls-debug.js /shop.html — prints which elements cause layout shift
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const BASE = 'http://localhost:5173', CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe', sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const u = process.argv[2] || '/shop.html';
(async () => {
  const PORT = 9500 + Math.floor(Math.random() * 100), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-cls-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 50 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((x) => x.type === 'page'); } catch (e) { /* retry */ } if (!t) await sleep(200); }
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__s=[];new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)__s.push({v:+e.value.toFixed(3),t:Math.round(e.startTime),src:e.sources.map(s=>(s.node&&(s.node.id?'#'+s.node.id:s.node.className||s.node.nodeName))+' '+Math.round(s.previousRect.y)+'→'+Math.round(s.currentRect.y))})}).observe({type:'layout-shift',buffered:true});` });
  await send('Page.navigate', { url: BASE + u }); await sleep(6500);
  const r = await send('Runtime.evaluate', { expression: 'JSON.stringify(__s.sort((a,b)=>b.v-a.v).slice(0,8))', returnByValue: true });
  JSON.parse(r.result.result.value).forEach((s) => console.log(s.v, '@', s.t + 'ms', s.src.join(' | ').slice(0, 220)));
  ws.close(); proc.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ } process.exit(0);
})();
