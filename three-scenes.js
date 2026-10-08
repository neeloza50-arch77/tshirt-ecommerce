/* HEROFORGE — lightweight Three.js scenes. Loaded on demand (dynamic import) and only when caps.three allows it.
   • mountHero(host)       particles + a metallic kite shield (desktop only, pauses off-screen)
   • mountTee(host, p, ci) draggable 3D T-shirt built from the product's own front/back artwork
   Everything is disposed in destroy(). */
import * as THREE from 'three';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';

const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5);
const dispose = (obj) => obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { m.map && m.map.dispose(); m.dispose(); }); });

function baseRenderer(host, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: !!opts.antialias, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const size = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); return [w, h]; };
  return { renderer, size };
}
// Run the loop only while the host is visible and the tab is active
function loop(host, tick) {
  let raf = 0, visible = true, running = false;
  const step = (t) => { if (!running) return; tick(t); raf = requestAnimationFrame(step); };
  const sync = () => { const want = visible && !document.hidden; if (want && !running) { running = true; raf = requestAnimationFrame(step); } else if (!want) { running = false; cancelAnimationFrame(raf); } };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.01 });
  io.observe(host); document.addEventListener('visibilitychange', sync); sync();
  return () => { running = false; cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('visibilitychange', sync); };
}

export function mountHero(host) {
  const { renderer, size } = baseRenderer(host);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, 0, 10);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  const red = new THREE.PointLight(0xe62429, 90, 40); red.position.set(-4, 3, 5); scene.add(red);
  const cool = new THREE.PointLight(0x7ac8ff, 40, 40); cool.position.set(6, -3, 4); scene.add(cool);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // metallic kite shield with a red band and diamond
  const s = new THREE.Shape(); s.moveTo(-1.5, 2); s.lineTo(1.5, 2); s.lineTo(1.5, 0.2); s.bezierCurveTo(1.5, -1.2, 0.8, -1.9, 0, -2.4); s.bezierCurveTo(-0.8, -1.9, -1.5, -1.2, -1.5, 0.2); s.closePath();
  const body = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3, curveSegments: 24 }); body.center();
  const metal = new THREE.MeshStandardMaterial({ color: 0xc4c9d4, metalness: 0.92, roughness: 0.26, envMapIntensity: 1.2 });
  const shield = new THREE.Group(); shield.add(new THREE.Mesh(body, metal));
  const band = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.6, 0.12), new THREE.MeshStandardMaterial({ color: 0xe62429, metalness: 0.5, roughness: 0.35, emissive: 0x4a0508 })); band.position.set(0, 0.6, 0.32); shield.add(band);
  const dia = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0xf5f5f7, metalness: 0.8, roughness: 0.2 })); dia.scale.set(0.9, 1.3, 0.35); dia.position.set(0, 0.6, 0.46); shield.add(dia);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.025, 8, 80), new THREE.MeshBasicMaterial({ color: 0xe62429, transparent: true, opacity: 0.55 })); rim.position.z = -0.4; shield.add(rim);
  scene.add(shield);

  // soft red glow sprite behind the shield
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d').createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(230,36,41,.65)'); g.addColorStop(1, 'rgba(230,36,41,0)'); c.getContext('2d').fillStyle = g; c.getContext('2d').fillRect(0, 0, 128, 128);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); glow.scale.set(11, 11, 1); glow.position.z = -2; shield.add(glow);

  // particles
  const N = 220, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 22; pos[i * 3 + 1] = (Math.random() - 0.5) * 12; pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1; seeds[i] = Math.random(); const hot = Math.random() < 0.45; col.set(hot ? [0.9, 0.14, 0.16] : [0.8, 0.82, 0.88], i * 3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(points);

  let mx = 0, my = 0; const onMove = (e) => { mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2; };
  addEventListener('pointermove', onMove, { passive: true });
  const layout = () => { const [w, h] = size(); camera.aspect = w / h; camera.updateProjectionMatrix(); const wide = w / h; shield.position.x = Math.min(3.1, 0.9 + wide * 1.05); shield.position.y = 0.35; shield.scale.setScalar(Math.min(0.78, 0.36 + wide * 0.2)); };
  const ro = new ResizeObserver(layout); ro.observe(host); layout();
  const stop = loop(host, (t) => {
    const k = t * 0.001;
    shield.rotation.y += ((Math.sin(k * 0.6) * 0.55 + mx * 0.3) - shield.rotation.y) * 0.06; shield.rotation.x += ((my * 0.12) - shield.rotation.x) * 0.06;
    shield.position.y = 0.35 + Math.sin(k * 0.9) * 0.14; points.rotation.y = k * 0.012; points.position.y = (k * 0.05) % 0.6;
    renderer.render(scene, camera);
  });
  return { destroy() { stop(); ro.disconnect(); removeEventListener('pointermove', onMove); dispose(scene); renderer.dispose(); renderer.domElement.remove(); } };
}

export async function mountTee(host, product, { ci = 0, auto = true } = {}) {
  const { renderer, size } = baseRenderer(host, { antialias: true });
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100); camera.position.set(0, 0, 8.4);
  scene.add(new THREE.AmbientLight(0xffffff, 1.05));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2.5, 3, 5); scene.add(key);
  const rimL = new THREE.PointLight(0xe62429, 40, 20); rimL.position.set(-4, 1, -3); scene.add(rimL);
  const fill = new THREE.PointLight(0x7ac8ff, 14, 20); fill.position.set(4, -2, 2); scene.add(fill);
  const aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const tee = new THREE.Group(); scene.add(tee);
  const geo = new THREE.PlaneGeometry(2.64, 2.56, 36, 36), P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), nx = x / 1.32; P.setZ(i, 0.15 * (1 - nx * nx) + Math.sin(y * 3 + x) * 0.015); }
  geo.computeVertexNormals();
  const mats = [0, 1].map(() => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, transparent: true, alphaTest: 0.35, side: THREE.FrontSide }));
  const front = new THREE.Mesh(geo, mats[0]), back = new THREE.Mesh(geo, mats[1]); back.rotation.y = Math.PI; back.position.z = -0.01; front.position.z = 0.01; tee.add(front, back);
  const loader = new THREE.TextureLoader(), urls = [];
  const load = (view, mat, cidx) => new Promise((res) => {
    const svg = Art.renderSVG(product.spec, view, cidx, { bare: true }), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); urls.push(url);
    loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; if (mat.map) mat.map.dispose(); mat.map = t; mat.needsUpdate = true; res(); }, undefined, res);
  });
  await Promise.all([load('front', mats[0], ci), load('back', mats[1], ci)]);

  let dragging = false, lastX = 0, vel = 0, targetScale = 1; tee.rotation.y = -0.5;
  const el = renderer.domElement;
  const down = (e) => { dragging = true; lastX = e.clientX; vel = 0; el.setPointerCapture && el.setPointerCapture(e.pointerId); };
  const move = (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * 0.012; tee.rotation.y += vel; };
  const up = () => { dragging = false; };
  el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  const layout = () => { const [w, h] = size(); camera.aspect = w / h; camera.updateProjectionMatrix(); camera.position.z = w / h < 0.9 ? 8.6 : 6.9; };
  const ro = new ResizeObserver(layout); ro.observe(host); layout();
  const stop = loop(host, (t) => {
    if (!dragging) { vel *= 0.92; tee.rotation.y += vel + (auto ? 0.006 : 0); }
    tee.position.y = Math.sin(t * 0.0012) * 0.05;
    renderer.render(scene, camera);
  });
  return {
    async setColor(i) { await Promise.all([load('front', mats[0], i), load('back', mats[1], i)]); },
    destroy() { stop(); ro.disconnect(); el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); urls.forEach((u) => URL.revokeObjectURL(u)); dispose(scene); renderer.dispose(); el.remove(); },
  };
}
