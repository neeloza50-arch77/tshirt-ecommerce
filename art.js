/* HEROFORGE art engine — original superhero-inspired T-shirt artwork.
   Every product image is DRAWN FROM THAT PRODUCT'S OWN SPEC (shirt, colourway, print, fit), so the
   front / back / on-model / close-up / folded views can never belong to another product.
   All artwork is original. Nothing here is copied from, or licensed from, any studio or publisher. */
(() => {
  const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";
  const MONO = "'Courier New',Courier,monospace";
  const HEAVY = "Impact,'Arial Narrow Bold','Arial Black',sans-serif";

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (h, t, a) => '#' + rgb(h).map((v) => Math.round(v + (t - v) * a).toString(16).padStart(2, '0')).join('');
  const shade = (h, a) => (a < 0 ? mix(h, 0, -a) : mix(h, 255, a));
  const lum = (h) => { const [r, g, b] = rgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const hash = (str) => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const pts = (arr) => arr.map((p) => p.join(',')).join(' ');
  const T = (o) => `<text x="${o.x || 0}" y="${o.y || 0}" text-anchor="${o.an || 'middle'}" font-family="${o.f || SANS}" font-size="${o.s}" font-weight="${o.w || 700}"${o.i ? ' font-style="italic"' : ''} letter-spacing="${o.ls || 0}"${o.tl ? ` textLength="${o.tl}" lengthAdjust="spacingAndGlyphs"` : ''}${o.rot ? ` transform="rotate(${o.rot} ${o.x || 0} ${o.y || 0})"` : ''} fill="${o.c}"${o.extra || ''}>${esc(o.t)}</text>`;
  const star = (R, r, n, rot) => Array.from({ length: n * 2 }, (_, i) => { const a = i * Math.PI / n + rot, q = i % 2 ? r : R; return `${(Math.cos(a) * q).toFixed(1)},${(Math.sin(a) * q).toFixed(1)}`; }).join(' ');

  /* ---------- motifs: original emblems drawn in a ±110 box ---------- */
  const M = {
    // Original "cyber helm": octagonal shell, central crest fin, single wide visor band, side vents
    helmet: (C) => `<path d="M0 -112L50 -92L78 -40V40L50 92L0 112L-50 92L-78 40V-40L-50 -92Z" fill="${C.k}" stroke="${C.a}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-7 -112H7L11 -50H-11Z" fill="${C.a}"/><path d="M-64 -14H64L56 24H-56Z" fill="${C.l}"/><path d="M-64 -14H64M-56 24H56" stroke="${C.a}" stroke-width="4"/>
      <path d="M-34 -14V24M0 -14V24M34 -14V24" stroke="${C.k}" stroke-width="3" opacity=".55"/>
      <path d="M-40 44V86M-20 52V98M0 56V104M20 52V98M40 44V86" stroke="${C.a}" stroke-width="5" stroke-linecap="round"/>
      <path d="M-78 -26L-98 -6V48L-78 34M78 -26L98 -6V48L78 34" fill="none" stroke="${C.a}" stroke-width="5" stroke-linejoin="round"/>`,
    // Original "drive core": ringed turbine with six curved fan blades
    core: (C) => {
      const blades = Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3, P = (r, t) => `${(Math.cos(a + t) * r).toFixed(1)} ${(Math.sin(a + t) * r).toFixed(1)}`; return `<path d="M${P(24, 0)}Q${P(70, 0.6)} ${P(92, 1)}L${P(92, 0.25)}Q${P(62, 0.18)} ${P(24, -0.5)}Z" fill="${i % 2 ? C.k : C.a}"/>`; }).join('');
      return `<circle r="104" fill="none" stroke="${C.k}" stroke-width="7"/><circle r="94" fill="none" stroke="${C.a}" stroke-width="2" stroke-dasharray="3 6"/>${blades}<circle r="24" fill="${C.l}"/><circle r="11" fill="${C.s}"/>`;
    },
    plates: (C) => [-70, -30, 10, 50].map((y, i) => `<path d="M${-92 + i * 6} ${y}L0 ${y - 34}L${92 - i * 6} ${y}V${y + 22}L0 ${y - 12}L${-92 + i * 6} ${y + 22}Z" fill="${i % 2 ? C.a : C.k}"/>`).join('') + [[-70, 76], [0, 82], [70, 76]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${C.l}"/>`).join('') + `<rect x="-92" y="98" width="184" height="6" fill="${C.k}"/>`,
    // Original kite shield: flat crown, tapered point, cross-band, centre diamond (no rings, no star)
    shield: (C) => `<path d="M-82 -96H82V4C82 62 42 98 0 114C-42 98 -82 62 -82 4Z" fill="${C.k}"/><path d="M-68 -82H68V4C68 54 36 84 0 98C-36 84 -68 54 -68 4Z" fill="none" stroke="${C.a}" stroke-width="4"/>
      <path d="M-82 -26H82V8H-82Z" fill="${C.a}"/><polygon points="0,-40 24,-5 0,30 -24,-5" fill="${C.l}" stroke="${C.k}" stroke-width="4"/><path d="M-46 40L0 72L46 40" fill="none" stroke="${C.l}" stroke-width="7" stroke-linejoin="round"/>${[-56, 0, 56].map((x) => `<circle cx="${x}" cy="-70" r="6" fill="${C.l}"/>`).join('')}`,
    wings: (C) => { const w = `<polygon points="0,-56 -90,-40 -108,4 -66,0 -80,42 -34,22 -12,70 0,48"/><path d="M-70 -30L-30 -10M-80 6L-36 14M-60 30L-26 30" stroke="${C.s}" stroke-width="3" fill="none"/>`; return `<g fill="${C.k}">${w}</g><g fill="${C.k}" transform="scale(-1 1)">${w}</g><polygon points="0,-30 12,0 0,30 -12,0" fill="${C.a}"/>`; },
    fist: (C) => `${[40, 62, 84].map((r, i) => `<circle cy="-10" r="${r + 30}" fill="none" stroke="${C.a}" stroke-width="2.5" opacity="${(0.85 - i * 0.25).toFixed(2)}"/>`).join('')}
      <rect x="-46" y="-12" width="92" height="84" rx="14" fill="${C.k}"/>${[-34, -12, 12, 34].map((x) => `<rect x="${x - 11}" y="-46" width="22" height="44" rx="11" fill="${C.k}" stroke="${C.s}" stroke-width="3"/>`).join('')}
      <path d="M-52 30Q-72 6 -42 -4L-14 34Z" fill="${C.k}" stroke="${C.s}" stroke-width="3"/><rect x="-34" y="70" width="68" height="40" fill="${C.a}"/>${[-34, -12, 12, 34].map((x) => `<line x1="${x}" y1="-8" x2="${x}" y2="18" stroke="${C.s}" stroke-width="2.5"/>`).join('')}`,
    claws: (C) => [-50, 0, 50].map((x, i) => `<path d="M${x - 30} -100Q${x + 22} -10 ${x + 26} 104Q${x - 6} 10 ${x - 30} -100Z" fill="${i === 1 ? C.a : C.k}"/>`).join(''),
    web: (C) => {
      let s = ''; const n = 12, P = (r, a) => `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
      for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; s += `<line x1="0" y1="0" x2="${(Math.cos(a) * 108).toFixed(1)}" y2="${(Math.sin(a) * 108).toFixed(1)}" stroke="${C.k}" stroke-width="2.5"/>`; }
      for (const r of [28, 52, 76, 100]) { let d = ''; for (let i = 0; i < n; i++) { const a0 = i * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n; d += (i ? '' : `M${P(r, a0)}`) + `Q${P(r * 0.86, (a0 + a1) / 2)} ${P(r, a1)}`; } s += `<path d="${d}Z" fill="none" stroke="${C.k}" stroke-width="2.5"/>`; }
      return s + `<circle r="7" fill="${C.a}"/>`;
    },
    // Original hooded mask: pointed chin, two thin angular slits, brow chevron
    visor: (C) => `<path d="M0 -110C46 -110 80 -70 82 -20L70 60L26 108H-26L-70 60L-82 -20C-80 -70 -46 -110 0 -110Z" fill="${C.k}"/><path d="M-66 -20L-12 -2L-20 14L-62 4Z" fill="${C.l}" stroke="${C.a}" stroke-width="3"/><path d="M66 -20L12 -2L20 14L62 4Z" fill="${C.l}" stroke="${C.a}" stroke-width="3"/>
      <path d="M-40 -76L0 -52L40 -76" fill="none" stroke="${C.a}" stroke-width="6" stroke-linejoin="round"/><path d="M-30 52H30M-22 70H22M-14 88H14" stroke="${C.a}" stroke-width="4" stroke-linecap="round"/>`,
    // Original angular crawler: diamond head, hex body, jointed polyline legs
    arachnid: (C) => { const leg = (s, a, b, c, d) => `<polyline points="${s * 12},${a} ${s * 56},${b} ${s * 96},${c} ${s * 110},${d}" fill="none" stroke="${C.k}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`; return [-1, 1].map((s) => leg(s, -24, -70, -48, -10) + leg(s, -8, -34, -14, 30) + leg(s, 8, 0, 34, 70) + leg(s, 24, 36, 78, 104)).join('') + `<polygon points="0,-46 18,-26 0,-8 -18,-26" fill="${C.k}"/><polygon points="0,-8 26,10 26,50 0,76 -26,50 -26,10" fill="${C.k}"/><polygon points="0,16 9,32 0,48 -9,32" fill="${C.a}"/>`; },
    hammer: (C) => `<g transform="rotate(-24)"><rect x="-9" y="-16" width="18" height="128" rx="5" fill="${C.k}"/><rect x="-9" y="76" width="18" height="12" fill="${C.a}"/><path d="M-62 -92L62 -92L74 -70V-34L62 -12H-62L-74 -34V-70Z" fill="${C.k}" stroke="${C.a}" stroke-width="5" stroke-linejoin="round"/><path d="M-40 -92V-12M40 -92V-12" stroke="${C.a}" stroke-width="4"/><rect x="-62" y="-60" width="124" height="8" fill="${C.a}"/></g>
      <polygon points="62,-100 40,-60 56,-60 38,-14 78,-70 60,-70 80,-100" fill="${C.l}"/><polygon points="-78,10 -92,40 -82,40 -96,72 -62,30 -74,30 -62,10" fill="${C.l}"/>`,
    bolt: (C) => `<circle r="102" fill="none" stroke="${C.k}" stroke-width="6"/><polygon points="14,-96 -50,12 -6,12 -24,98 56,-26 8,-26" fill="${C.a}"/><polygon points="14,-96 -50,12 -6,12 -24,98 56,-26 8,-26" fill="none" stroke="${C.k}" stroke-width="4" stroke-linejoin="round"/>`,
    panther: (C) => `<path d="M-80 -92L-56 -62L-30 -78L0 -62L30 -78L56 -62L80 -92L90 -20L68 58L26 98L0 106L-26 98L-68 58L-90 -20Z" fill="${C.k}"/><path d="M-64 -22L-22 -8L-30 12L-62 4Z" fill="${C.l}"/><path d="M64 -22L22 -8L30 12L62 4Z" fill="${C.l}"/><path d="M-14 38H14L0 56Z" fill="${C.a}"/><path d="M0 56V74M-24 70Q0 84 24 70" stroke="${C.a}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-98 20L-60 30M-98 40L-60 40M98 20L60 30M98 40L60 40" stroke="${C.a}" stroke-width="3"/>`,
    mandala: (C) => { let s = `<circle r="104" fill="none" stroke="${C.k}" stroke-width="5"/><circle r="92" fill="none" stroke="${C.a}" stroke-width="2" stroke-dasharray="4 5"/>`; for (let i = 0; i < 3; i++) s += `<rect x="-62" y="-62" width="124" height="124" fill="none" stroke="${i % 2 ? C.a : C.k}" stroke-width="3.5" transform="rotate(${i * 30})"/>`; for (let i = 0; i < 8; i++) s += `<ellipse cx="0" cy="-44" rx="9" ry="22" fill="${C.l}" transform="rotate(${i * 45})"/>`; return s + `<circle r="20" fill="${C.k}"/><circle r="9" fill="${C.a}"/>`; },
    starburst: (C) => `<polygon points="${star(106, 42, 8, -Math.PI / 2)}" fill="${C.k}"/><polygon points="${star(70, 30, 8, -Math.PI / 2 + Math.PI / 8)}" fill="${C.a}"/><circle r="26" fill="${C.l}"/><circle r="104" fill="none" stroke="${C.a}" stroke-width="2" stroke-dasharray="2 7"/>`,
    rocket: (C) => `<g transform="rotate(35)"><path d="M0 -104C30 -70 36 -20 28 50H-28C-36 -20 -30 -70 0 -104Z" fill="${C.k}"/><circle cy="-34" r="14" fill="${C.l}" stroke="${C.a}" stroke-width="4"/><path d="M-28 20L-60 66L-28 56ZM28 20L60 66L28 56Z" fill="${C.a}"/><path d="M-16 50H16L0 108Z" fill="${C.l}"/></g>${[[-84, -70, 3], [70, -80, 2.5], [-70, 60, 2], [88, 40, 3], [20, 90, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.k}"/>`).join('')}`,
    planet: (C) => `<circle r="62" fill="${C.k}"/><path d="M-60 -10Q0 -30 60 -10M-58 14Q0 -6 58 14M-50 38Q0 20 50 38" stroke="${C.a}" stroke-width="6" fill="none"/><ellipse rx="112" ry="26" fill="none" stroke="${C.l}" stroke-width="7" transform="rotate(-18)"/>${[[-90, -80, 3], [86, -70, 2.5], [-96, 62, 2.5], [92, 70, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.k}"/>`).join('')}`,
    team: (C) => `<circle cy="-14" r="88" fill="${C.a}" opacity=".9"/>${[[-84, 64], [-42, 86], [0, 104], [42, 86], [84, 64]].map(([x, h], i) => `<g transform="translate(${x} 70)"><circle cy="${-h - 16}" r="12" fill="${i === 2 ? C.l : C.k}"/><path d="M-14 ${-h}H14L20 0H-20Z" fill="${i === 2 ? C.l : C.k}"/></g>`).join('')}<rect x="-110" y="70" width="220" height="5" fill="${C.k}"/>`,
    ring: (C) => { const P = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [Math.cos(a) * 76, Math.sin(a) * 76]; }); return `<circle r="104" fill="none" stroke="${C.k}" stroke-width="6"/><circle r="92" fill="none" stroke="${C.a}" stroke-width="2"/>${P.map(([x, y]) => `<line x1="0" y1="0" x2="${x}" y2="${y}" stroke="${C.k}" stroke-width="4"/>`).join('')}<polygon points="${pts(P)}" fill="none" stroke="${C.a}" stroke-width="3"/>${P.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="16" fill="${i === 0 ? C.l : C.a}"/>`).join('')}<polygon points="0,-28 8,-8 28,0 8,8 0,28 -8,8 -28,0 -8,-8" fill="${C.l}"/>`; },
    skyline: (C) => `<circle cx="52" cy="-70" r="16" fill="${C.l}"/><polygon points="0,-50 -52,-112 52,-112" fill="${C.l}" opacity=".35"/>${[[-96, 14, 26, 90], [-68, -24, 28, 128], [-38, -56, 34, 160], [-2, -10, 28, 114], [28, 20, 28, 84], [58, -4, 26, 108], [86, 30, 24, 74]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.k}"/>`).join('')}${Array.from({ length: 26 }, (_, i) => `<rect x="${-88 + (i * 37) % 170}" y="${20 + (i * 53) % 90}" width="4" height="6" fill="${i % 3 ? C.a : C.l}"/>`).join('')}`,
  };

  /* ---------- print styles: place a motif inside a layout ---------- */
  const comicBurst = (C) => { const b = Array.from({ length: 28 }, (_, i) => { const a = i * Math.PI / 14, r = i % 2 ? 98 : 142; return [Math.cos(a) * r, Math.sin(a) * r * 0.9]; }); const dots = []; for (let y = -130; y <= 130; y += 13) for (let x = -150; x <= 150; x += 13) { const d = Math.hypot(x - 90, y + 70), r = Math.max(0, 6 - d / 26); if (r > 0.6) dots.push(`<circle cx="${x + (y / 13 % 2 ? 6.5 : 0)}" cy="${y}" r="${r.toFixed(1)}"/>`); } return `<defs><clipPath id="bu"><polygon points="${pts(b)}"/></clipPath></defs><polygon points="${pts(b)}" fill="${C.l}"/><g clip-path="url(#bu)" fill="${C.s}" opacity=".35">${dots.join('')}</g><polygon points="${pts(b)}" fill="none" stroke="${C.k}" stroke-width="5" stroke-linejoin="round"/>`; };
  const words = (list, size, C, y0 = -78, alt = true) => list.map((w, i) => T({ y: y0 + i * (size * 0.98), s: size, f: HEAVY, tl: Math.min(262, w.length * size * 0.62), c: alt && i % 2 ? C.a : C.k, t: w })).join('');
  const STYLES = {
    icon: (p, C, m) => `<g transform="translate(0 -22) scale(.9)">${m}</g>${T({ y: 124, s: 34, f: HEAVY, ls: 4, tl: p.tl || 210, c: C.k, t: p.t })}${T({ y: 148, s: 11, f: MONO, ls: 6, c: C.a, t: p.sub || '' })}`,
    minimal: (p, C, m) => `<g transform="translate(0 -24) scale(.42)">${m}</g>${T({ y: 34, s: 13, f: HEAVY, ls: 5, tl: 96, c: C.k, t: p.t })}${T({ y: 48, s: 7, f: MONO, ls: 3, tl: 96, c: C.a, t: p.sub || '' })}`,
    comic: (p, C, m) => `${comicBurst(C)}<g transform="translate(0 -22) scale(.72)">${m}</g>${T({ y: 120, s: 74, f: HEAVY, i: 1, tl: 250, c: C.k, t: p.t, rot: -5, extra: ` stroke="${C.s}" stroke-width="8" paint-order="stroke"` })}`,
    vintage: (p, C, m) => `<defs><path id="vt" d="M-88 0A88 88 0 0 1 88 0"/><path id="vb" d="M-100 0A100 100 0 0 0 100 0"/></defs><circle r="124" fill="none" stroke="${C.k}" stroke-width="6"/><circle r="112" fill="none" stroke="${C.k}" stroke-width="1.5"/><circle r="70" fill="none" stroke="${C.a}" stroke-width="2"/>
      <text font-family="${HEAVY}" font-size="25" letter-spacing="5" fill="${C.k}"><textPath href="#vt" startOffset="50%" text-anchor="middle">${esc(p.t)}</textPath></text><text font-family="${SANS}" font-size="15" font-weight="700" letter-spacing="7" fill="${C.a}"><textPath href="#vb" startOffset="50%" text-anchor="middle">${esc(p.sub || 'SINCE 1962')}</textPath></text>
      <g transform="scale(.5)">${m}</g><polygon points="-106,-6 -100,0 -106,6 -112,0" fill="${C.k}"/><polygon points="106,-6 112,0 106,6 100,0" fill="${C.k}"/>`,
    type: (p, C, m) => `${words(p.words || [p.t], 84, C, -52)}<g transform="translate(-112 112) scale(.3)">${m}</g>${T({ x: -84, y: 118, an: 'start', s: 13, f: MONO, ls: 4, c: C.a, t: p.sub || '' })}`,
    street: (p, C, m) => `<g transform="translate(0 -20) scale(1.05)">${m}</g>${T({ y: 128, s: 44, f: HEAVY, ls: 6, tl: p.tl || 240, c: C.k, t: p.t })}${T({ x: 142, y: -120, an: 'start', s: 11, f: MONO, ls: 6, c: C.a, t: (p.sub || '').toUpperCase(), rot: 90 })}`,
    tech: (p, C, m) => `<circle r="122" fill="none" stroke="${C.k}" stroke-width="2" stroke-dasharray="2 7"/><circle r="110" fill="none" stroke="${C.a}" stroke-width="1.4"/>${[0, 90, 180, 270].map((a) => `<line x1="0" y1="-110" x2="0" y2="-132" stroke="${C.a}" stroke-width="3" transform="rotate(${a})"/>`).join('')}
      ${[[-150, -150, 1, 1], [150, -150, -1, 1], [-150, 150, 1, -1], [150, 150, -1, -1]].map(([x, y, sx, sy]) => `<path d="M${x} ${y + sy * 22}V${y}H${x + sx * 22}" fill="none" stroke="${C.a}" stroke-width="3"/>`).join('')}
      <g transform="scale(.72)">${m}</g>${T({ x: -148, y: -134, an: 'start', s: 9, f: MONO, ls: 2, c: C.a, t: 'SYS // ONLINE' })}${T({ x: 148, y: -134, an: 'end', s: 9, f: MONO, ls: 2, c: C.k, t: p.sub || 'MK-07' })}${T({ y: 142, s: 24, f: HEAVY, ls: 5, tl: p.tl || 210, c: C.k, t: p.t })}`,
    cine: (p, C, m) => `<rect x="-148" y="-146" width="296" height="3" fill="${C.a}"/><rect x="-148" y="146" width="296" height="3" fill="${C.a}"/><g transform="translate(0 -26) scale(.86)">${m}</g>${T({ y: 98, s: 44, f: HEAVY, ls: 14, tl: p.tl || 262, c: C.k, t: p.t })}<rect x="-130" y="108" width="260" height="1.5" fill="${C.k}" opacity=".6"/>${T({ y: 126, s: 9, f: MONO, ls: 7, c: C.a, t: p.sub || 'A HEROFORGE ORIGINAL' })}${T({ y: 140, s: 6, f: SANS, ls: 2, w: 400, c: C.k, t: 'ORIGINAL ARTWORK · DEMO COLLECTION · NOT OFFICIAL MERCHANDISE', tl: 230 })}`,
    dark: (p, C, m) => `<g transform="translate(0 -22) scale(.95)">${m}</g>${T({ y: 128, s: 28, f: HEAVY, ls: 10, tl: p.tl || 210, c: C.k, t: p.t })}`,
    big: (p, C, m) => `<g transform="translate(0 -26) scale(1.12)">${m}</g>${T({ y: 138, s: 46, f: HEAVY, ls: 6, tl: p.tl || 250, c: C.k, t: p.t })}${T({ y: 160, s: 10, f: MONO, ls: 8, c: C.a, t: p.sub || '' })}`,
    tag: (p, C, m) => `<g transform="translate(-34 -2) scale(.17)">${m}</g>${T({ x: -12, y: -2, an: 'start', s: 12, f: HEAVY, ls: 3, c: C.k, t: p.t })}${T({ x: -12, y: 10, an: 'start', s: 6.5, f: MONO, ls: 2, c: C.a, t: p.sub || '' })}`,
    words: (p, C) => `${words(p.words || [p.t], p.size || 78, C, -64)}${T({ y: 138, s: 12, f: MONO, ls: 8, c: C.a, t: p.sub || '' })}`,
    credits: (p, C) => `${T({ y: -70, s: 50, f: HEAVY, ls: 8, tl: 250, c: C.k, t: p.t })}<rect x="-120" y="-50" width="240" height="2" fill="${C.a}"/>${(p.lines || []).map((l, i) => T({ y: -20 + i * 22, s: 11, f: MONO, ls: 5, tl: 220, c: i % 2 ? C.a : C.k, t: l })).join('')}`,
  };
  const G = {
    hero: (p, C) => (STYLES[p.st] || STYLES.icon)(p, C, M[p.m] ? M[p.m](C) : ''),
  };

  /* ---------- shirt bodies ---------- */
  const BODIES = {
    ss: 'M215 70C240 100 360 100 385 70L470 100L560 210L500 255L455 215V640Q455 655 440 655H160Q145 655 145 640V215L100 255L40 210L130 100Z',
    ls: 'M215 70C240 100 360 100 385 70L470 100L588 395L526 420L455 238V640Q455 655 440 655H160Q145 655 145 640V238L74 420L12 395L130 100Z',
  };
  const POS = { c: [300, 302], lc: [368, 226], bt: [300, 200], back: [300, 305] };

  function teeGroup(spec, C, view, o = {}) {
    const back = view === 'back', f = back ? spec.b : spec.f, BODY = BODIES[spec.body || 'ss'];
    const ox = spec.fit === 'oversized' ? 1.12 : 1, oy = spec.fit === 'oversized' ? 1.03 : 1, sh = C.s;
    const neckLow = back ? 'M385 70C360 118 240 118 215 70' : 'M385 70C360 172 240 172 215 70';
    const label = back ? `<rect x="281" y="106" width="38" height="17" fill="#f4f1ea" opacity=".95"/>${T({ x: 300, y: 118, s: 6, f: SANS, ls: 1.2, c: '#222', t: 'HEROFORGE', w: 700 })}` : '';
    const sleeveL = spec.body === 'ls' ? 'M145 238Q120 180 130 100M455 238Q480 180 470 100' : 'M145 215Q122 165 130 100M455 215Q478 165 470 100';
    let s = `<g transform="translate(300 370) scale(${ox} ${oy}) translate(-300 -370)">
      <path d="${BODY}" fill="${sh}"/><path d="M215 70C240 100 360 100 385 70${neckLow.slice(neckLow.indexOf('C'))}Z" fill="${shade(sh, -0.45)}"/>
      <path d="${neckLow}" fill="none" stroke="${shade(sh, -0.12)}" stroke-width="${back ? 8 : 11}" stroke-linecap="round"/><path d="${neckLow}" fill="none" stroke="${shade(sh, 0.14)}" stroke-width="1.5" transform="translate(0 -4)" opacity=".7"/>${label}
      <path d="${sleeveL}" fill="none" stroke="${shade(sh, -0.18)}" stroke-width="2"/><path d="M147 622H453" stroke="${shade(sh, -0.16)}" stroke-width="2"/>
      <path d="M165 250Q175 330 168 420M435 270Q428 350 436 440" fill="none" stroke="#000" stroke-opacity=".06" stroke-width="22" stroke-linecap="round"/>
      <path d="${BODY}" fill="url(#sx)"/><path d="${BODY}" fill="url(#sv)"/>${o.weave ? `<path d="${BODY}" fill="url(#wv)"/><rect x="0" y="0" width="620" height="720" clip-path="url(#bc)" filter="url(#fab)" opacity=".55"/>` : ''}
      ${C.dark ? `<path d="${BODY}" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="2"/>` : ''}</g>`;
    if (f) {
      const [px, py] = POS[f[2] || 'c'], pos = f[2] || 'c', cx = pos === 'lc' ? 300 + 68 * ox : px, sc = f[3] || (pos === 'lc' ? 1 : 0.94);
      s += `<g transform="translate(${cx} ${py}) scale(${sc})">${G[f[0]](f[1] || {}, C)}</g>`;
      teeGroup.center = [cx, py];
    } else teeGroup.center = [300, 330];
    return s;
  }

  const defs = (spec) => `<clipPath id="bc"><path d="${BODIES[spec.body || 'ss']}"/></clipPath>
    <linearGradient id="sx" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".26"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>
    <linearGradient id="sv" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
    <pattern id="wv" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0L4 4M4 0L0 4" stroke="#000" stroke-opacity=".08" stroke-width=".6"/></pattern>
    <filter id="fab" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .9 0 0 0 -.3"/></filter>
    <radialGradient id="shd"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".6" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="bgr" cx=".5" cy=".32" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f3f3f6"/><stop offset="1" stop-color="#e2e2ea"/></radialGradient>
    <radialGradient id="studioSoft" cx=".5" cy=".18" r=".65"><stop offset="0" stop-color="#ffffff" stop-opacity=".8"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`;
  const stageBg = (spec) => `<rect width="800" height="1000" fill="url(#bgr)"/><rect width="800" height="1000" fill="url(#studioSoft)"/><ellipse cx="400" cy="860" rx="280" ry="26" fill="url(#shd)"/>`;

  function mannequin() {
    const skin = '#c8a898', pant = '#1e2026';
    return `<ellipse cx="300" cy="-4" rx="40" ry="54" fill="${skin}"/><rect x="278" y="30" width="44" height="60" rx="14" fill="${skin}"/>
      <path d="M42 214L102 256L74 506L26 486Z" fill="${skin}"/><path d="M558 214L498 256L526 506L574 486Z" fill="${skin}"/><ellipse cx="52" cy="506" rx="26" ry="22" fill="${skin}"/><ellipse cx="548" cy="506" rx="26" ry="22" fill="${skin}"/>
      <path d="M150 600H450L468 770H318L300 700L282 770H132Z" fill="${pant}"/><path d="M300 640V700" stroke="#000" stroke-opacity=".4" stroke-width="3"/>`;
  }
  function folded(spec, C) {
    const f = spec.f, s = C.s; let art = '';
    if (f) art = f[2] === 'lc' ? `<g transform="translate(78 -70) scale(1.1)">${G[f[0]](f[1] || {}, C)}</g>` : `<g transform="translate(0 40) scale(.62)">${G[f[0]](f[1] || {}, C)}</g>`;
    return `<g transform="translate(400 540)"><ellipse cx="0" cy="276" rx="250" ry="22" fill="url(#shd)"/>
      <rect x="-200" y="-270" width="400" height="540" rx="16" fill="${s}"/>${art}
      <path d="M-200 -270H-96V-122Q-150 -104 -200 -62Z" fill="${shade(s, -0.12)}"/><path d="M200 -270H96V-122Q150 -104 200 -62Z" fill="${shade(s, -0.12)}"/>
      <path d="M-96 -270Q0 -166 96 -270Z" fill="${shade(s, -0.45)}"/><path d="M-96 -270Q0 -166 96 -270" fill="none" stroke="${shade(s, -0.12)}" stroke-width="13" stroke-linecap="round"/>
      <rect x="-200" y="-270" width="400" height="540" rx="16" fill="url(#sx)"/><rect x="-200" y="-270" width="400" height="540" rx="16" fill="url(#sv)"/>${C.dark ? '<rect x="-200" y="-270" width="400" height="540" rx="16" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="2"/>' : ''}</g>`;
  }

  const VIEWS = ['front', 'back', 'model', 'detail', 'folded'];
  function ctxFor(spec, ci) {
    const sh = spec.sh[ci][1], dark = lum(sh) < 0.45;
    let C = { k: dark ? '#f3f1ec' : '#131315', a: spec.a, l: spec.l, s: sh, dark };
    if (spec.tone) { const t = (x) => (dark ? shade(sh, x) : shade(sh, -x)); C = { ...C, k: t(0.22), a: t(0.4), l: t(0.3) }; }
    else { if (Math.abs(lum(C.a) - lum(sh)) < 0.17) C.a = C.k; if (Math.abs(lum(C.l) - lum(sh)) < 0.17) C.l = C.k; }
    return C;
  }
  // renderSVG(spec, view, colourIndex, {bare}) -> svg text. bare = transparent cut-out (used as a 3D texture)
  function renderSVG(spec, view, ci = 0, o = {}) {
    const C = ctxFor(spec, ci);
    if (o.bare) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="1056" height="1024" viewBox="-30 40 660 640"><defs>${defs(spec)}</defs>${teeGroup(spec, C, view === 'back' ? 'back' : 'front')}</svg>`;
    }
    let inner;
    if (view === 'folded') inner = folded(spec, C);
    else if (view === 'detail') { const g = teeGroup(spec, C, 'front', { weave: true }), [cx, cy] = teeGroup.center; inner = `<g transform="translate(400 520) scale(2.1) translate(${-cx} ${-cy})">${g}</g>`; }
    else if (view === 'model') inner = `<ellipse cx="400" cy="880" rx="275" ry="24" fill="url(#shd)"/><g transform="translate(400 560) scale(1.0) translate(-300 -362)">${mannequin()}${teeGroup(spec, C, 'front')}</g>`;
    else inner = `<ellipse cx="400" cy="858" rx="265" ry="24" fill="url(#shd)"/><g transform="translate(400 520) scale(1.12) translate(-300 -362)">${teeGroup(spec, C, view)}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"><title>${esc(spec.n)} — ${view}</title><defs>${defs(spec)}</defs>${stageBg(spec)}${inner}</svg>`;
  }
  const urlCache = new Map();
  // render(...) -> short blob: URL (cached) in the browser; falls back to a data URI elsewhere
  function render(spec, view, ci = 0) {
    const svg = renderSVG(spec, view, ci), key = `${spec.n}|${view}|${ci}`;
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL && typeof document !== 'undefined') {
      if (!urlCache.has(key)) urlCache.set(key, URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })));
      return urlCache.get(key);
    }
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  // Standalone emblem icon (used for character tiles / nav). colours: k main, a accent, l alt
  const emblem = (motif, c = {}) => `<svg viewBox="-122 -122 244 244" aria-hidden="true">${M[motif]({ k: c.k || '#f3f1ec', a: c.a || '#e62429', l: c.l || '#ffd166', s: c.s || '#0b0b0e' })}</svg>`;
  window.Art = { emblem, render, renderSVG, VIEWS, hash, lum, shade, MOTIFS: Object.keys(M), STYLES: Object.keys(STYLES) };
})();
