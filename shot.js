// Dev tool: drive headless Chrome over CDP to screenshot pages and collect console errors.
// node tools/shot.js <url> <out.png> [--w 1440] [--h 900] [--wait 5000] [--scroll 0] [--mobile] [--full] [--eval "js"] [--after 800] [--shots a.png@js|b.png@js ...]
const { spawn } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const args = process.argv.slice(2), url = args[0], out = args[1];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const W = +opt('w', 1440), H = +opt('h', 900), WAIT = +opt('wait', 5000), SCROLL = +opt('scroll', 0), MOBILE = !!opt('mobile', false), FULL = !!opt('full', false), EVAL = opt('eval', ''), AFTER = +opt('after', 900), PORT = 9300 + Math.floor(Math.random() * 500);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  let target; for (let i = 0; i < 50 && !target; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json`); target = (await r.json()).find((t) => t.type === 'page'); } catch (e) { /* retry */ } if (!target) await sleep(200); }
  if (!target) { console.error('could not reach Chrome'); proc.kill(); process.exit(2); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(), errors = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    else if (d.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).split('\n')[0]);
    else if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errors.push(d.params.type.toUpperCase() + ' ' + d.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 220));
    else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errors.push('LOG ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
  };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (js) => { const r = await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.text; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: MOBILE });
  if (MOBILE) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url }); await sleep(WAIT);
  const snap = async (file, js) => { if (js) { const r = await ev(js); if (r !== undefined) console.log('eval:', JSON.stringify(r).slice(0, 600)); await sleep(AFTER); }
    let params = { format: 'png' };
    if (FULL) { // scroll through the page so reveal animations fire, then capture everything
      const h = await ev('document.documentElement.scrollHeight'); for (let y = 0; y < h; y += H * 0.6) { await ev(`window.lenis?lenis.scrollTo(${y},{immediate:true}):scrollTo(0,${y})`); await sleep(220); }
      await ev('window.lenis?lenis.scrollTo(0,{immediate:true}):scrollTo(0,0)'); await sleep(500);
      params = { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(h, 12000), scale: 1 } };
    } else if (SCROLL) { await ev(`window.lenis?lenis.scrollTo(${SCROLL},{immediate:true}):scrollTo(0,${SCROLL})`); await sleep(1800); }
    const r = await send('Page.captureScreenshot', params); fs.writeFileSync(file, Buffer.from(r.result.data, 'base64')); console.log('wrote', file); };
  if (EVAL && !args.includes('--shots')) await snap(out, EVAL); else if (!args.includes('--shots')) await snap(out);
  const si = args.indexOf('--shots'); if (si > -1) for (const spec of args.slice(si + 1)) { const [f, js] = spec.split('@'); await snap(f, js); }
  console.log(errors.length ? 'CONSOLE PROBLEMS:\n  ' + [...new Set(errors)].join('\n  ') : 'console: clean');
  ws.close(); proc.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  process.exit(0);
})();
