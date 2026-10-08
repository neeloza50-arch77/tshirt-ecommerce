/* HEROFORGE catalogue — single source of truth. Swap for an API later; keep the shape.

   ┌─ LICENSING ──────────────────────────────────────────────────────────────────────────────┐
   │ No licensed Marvel assets are available, so this is a clearly-marked DEMO catalogue of      │
   │ ORIGINAL superhero-inspired designs with original hero names. Nothing here is official      │
   │ Marvel merchandise. Each hero has an `official` name field for the day you hold a licence;  │
   │ STORE.licensed switches the displayed names — but the ARTWORK must also be replaced with     │
   │ licensed assets before you do that.                                                          │
   └──────────────────────────────────────────────────────────────────────────────────────────────┘

   IMAGE RULE: a product's images are never picked from a shared pool. Every image is rendered from
   that product's own spec (Art.render), and validateCatalog() fails loudly if two products ever share
   an image, id, slug, sku or name — so a wrong hover image can't slip in later. */
window.STORE = { name: 'HEROFORGE', licensed: false, currency: '$', freeShipFrom: 75, shipping: 6 };

const HEROES = [
  { id: 'ironclad', name: 'Ironclad', official: 'Iron Man', a: '#ff3b30', l: '#7ad7ff', tag: 'Armor with a conscience',
    story: 'Ironclad was built in a cluttered workshop by an engineer who refused to wait for rescue. Every plate, rivet and reactor ring on this line is a nod to that stubborn, brilliant, slightly reckless spirit.' },
  { id: 'sentinel', name: 'Sentinel', official: 'Captain America', a: '#d62839', l: '#9ec1ff', tag: 'First in line, last to fall',
    story: 'Sentinel stands for the quiet kind of courage — the one that shows up first and leaves last. The Sentinel line pairs classic shield geometry with a patriot-navy palette.' },
  { id: 'jade-titan', name: 'Jade Titan', official: 'Hulk', a: '#8ee63a', l: '#d7ff80', tag: 'Anger, engineered',
    story: 'Jade Titan is what happens when a brilliant mind meets more power than any one person should hold. Raw, loud and unapologetically green, this line is built around fists, claw marks and gamma glow.' },
  { id: 'skyweaver', name: 'Skyweaver', official: 'Spider-Man', a: '#e62429', l: '#4cc3ff', tag: 'Neighbourhood hero, city-sized heart',
    story: 'Skyweaver swings between rooftops with a joke ready and a web-line in hand. This line is all webs, lenses and crisp city-night contrast.' },
  { id: 'assembly', name: 'The Assembly', official: 'Avengers', a: '#e23636', l: '#d4af37', tag: 'Stronger together',
    story: 'The Assembly is a team of very different heroes who keep choosing each other. Ring emblems, team line-ups and city skylines carry the story.' },
  { id: 'tempest', name: 'Tempest', official: 'Thor', a: '#ffd400', l: '#59c9ff', tag: 'Storm on command',
    story: 'Tempest carries a storm-forged maul and a temper to match. Lightning yellow and deep navy drive the whole line.' },
  { id: 'obsidian-king', name: 'Obsidian King', official: 'Black Panther', a: '#a66cff', l: '#e6e6f2', tag: 'Crowned in shadow',
    story: 'The Obsidian King rules a hidden, technologically dazzling kingdom. Sharp feline geometry and violet highlights define the line.' },
  { id: 'mystic-warden', name: 'Mystic Warden', official: 'Doctor Strange', a: '#ff8a00', l: '#ffd166', tag: 'Guardian of the hidden doors',
    story: 'The Mystic Warden bends space with geometry and will. Mandalas, rune rings and ember-orange sparks mark this line.' },
  { id: 'starbound', name: 'Starbound', official: 'Captain Marvel', a: '#ff4d4d', l: '#ffd166', tag: 'Higher, further, faster',
    story: 'Starbound channels the energy of a star. Bursts, wings and a red-gold-blue palette carry the line.' },
  { id: 'starfarers', name: 'Starfarers', official: 'Guardians of the Galaxy', a: '#ff7a59', l: '#7be0ff', tag: 'Misfits among the stars',
    story: 'Starfarers is a crew of misfits who found a family between the stars. Rockets, ringed planets and cassette-era cool.' },
  { id: 'pulp', name: 'Pulp Comics', official: 'Marvel Comics', a: '#ff2e2e', l: '#ffe14d', tag: 'Straight off the spinner rack',
    story: 'Pulp Comics celebrates the golden age of the four-colour page: halftone dots, onomatopoeia and big loud lettering.' },
];
const MOTIF_OF = { ironclad: 'helmet', sentinel: 'shield', 'jade-titan': 'fist', skyweaver: 'web', assembly: 'ring', tempest: 'hammer', 'obsidian-king': 'panther', 'mystic-warden': 'mandala', starbound: 'starburst', starfarers: 'rocket', pulp: 'bolt' };
const charName = (c) => (STORE.licensed ? c.official : c.name);

const SHIRTS = {
  BLACK: ['Jet Black', '#111113', 'Black'], CHAR: ['Charcoal', '#2f3036', 'Grey'], WHITE: ['Bone White', '#efece6', 'White'], RED: ['Crimson', '#a3141e', 'Red'],
  NAVY: ['Midnight Navy', '#18233f', 'Blue'], GREEN: ['Gamma Green', '#2f6b3a', 'Green'], OLIVE: ['Field Olive', '#4b5233', 'Green'], PURPLE: ['Royal Violet', '#3b2a5c', 'Purple'],
  BURG: ['Burgundy', '#5a1a2a', 'Red'], TEAL: ['Deep Teal', '#12404a', 'Blue'], CREAM: ['Vintage Cream', '#e8dec4', 'White'], SILVER: ['Silver', '#b9bdc6', 'Grey'],
};
const ALT = { BLACK: 'WHITE', WHITE: 'BLACK', CHAR: 'WHITE', NAVY: 'WHITE', GREEN: 'BLACK', RED: 'BLACK', OLIVE: 'BLACK', PURPLE: 'BLACK', BURG: 'BLACK', TEAL: 'BLACK', CREAM: 'BLACK', SILVER: 'NAVY' };

const STYLE = { // collection = the design line; price offset; description
  minimal: { label: 'Essentials', add: -4, blurb: 'A small, sharp chest emblem for everyday wear.' },
  icon: { label: 'Icon Series', add: 0, blurb: 'A bold centre-chest emblem with a clean title lockup.' },
  comic: { label: 'Comic Vault', add: 4, blurb: 'A halftone comic burst with hand-lettered sound-effect type.' },
  vintage: { label: 'Heritage', add: 2, blurb: 'A faded athletic-crest print with a lived-in, vintage feel.' },
  type: { label: 'Statement', add: 0, blurb: 'Stacked, oversized typography with a small emblem.' },
  street: { label: 'Street Division', add: 10, blurb: 'Oversized fit, tiny front tag, and a huge back print.' },
  tech: { label: 'Tech Armory', add: 6, blurb: 'A HUD-style blueprint print with target brackets and readouts.' },
  cine: { label: 'Cinematic', add: 8, blurb: 'A poster-style print with a wide-tracked title and letterbox bars.' },
  dark: { label: 'Noir', add: 4, blurb: 'Tone-on-tone print: the design sits quietly in the fabric.' },
};
const TYPES = { tee: { label: 'T-Shirt', base: 38, gsm: '190gsm' }, oversized: { label: 'Oversized Tee', base: 48, gsm: '260gsm' }, long: { label: 'Long Sleeve', base: 50, gsm: '200gsm' } };

// [name, style, motif, shirt, title, sub, extra]   title may use "|" to stack words (type style); extra: 'LS' = long sleeve
const ROSTER = {
  ironclad: [
    ['Ironclad Mk I Minimal Tee', 'minimal', 'helmet', 'BLACK', 'IRONCLAD', 'MK I'],
    ['Core Reactor Tee', 'icon', 'core', 'BLACK', 'CORE REACTOR', 'ONLINE'],
    ['Ironclad Helmet Graphic Tee', 'icon', 'helmet', 'CHAR', 'IRONCLAD', 'HELMET MK III'],
    ['Ironclad Comic Burst Tee', 'comic', 'helmet', 'WHITE', 'CLANG!', ''],
    ['Red Line Streetwear Tee', 'street', 'helmet', 'BLACK', 'RED LINE', 'STREET DIVISION'],
    ['Ironclad Vintage Crest Tee', 'vintage', 'core', 'CREAM', 'IRONCLAD CORPS', 'EST. 1972'],
    ['Armor Plate Tech Tee', 'tech', 'plates', 'BLACK', 'ARMOR LAB', 'MK-VII'],
    ['Ironclad Cinematic Tee', 'cine', 'helmet', 'BLACK', 'IRONCLAD', 'A HEROFORGE ORIGINAL'],
    ['Built Not Born Typography Tee', 'type', 'helmet', 'RED', 'BUILT|NOT|BORN', 'IRONCLAD'],
    ['Ironclad Noir Tee', 'dark', 'core', 'BLACK', 'IRONCLAD', ''],
    ['Ironclad Tech Long Sleeve', 'tech', 'helmet', 'BLACK', 'MK-IX', 'ARMOR LAB', 'LS'],
  ],
  sentinel: [
    ['Minimal Shield Tee', 'minimal', 'shield', 'WHITE', 'SENTINEL', 'SHIELD'],
    ['Sentinel Shield Tee', 'icon', 'shield', 'NAVY', 'SENTINEL', 'FIRST LINE'],
    ['Sentinel Vintage Crest Tee', 'vintage', 'shield', 'CREAM', 'SENTINEL CORPS', 'EST. 1944'],
    ['Sentinel Streetwear Tee', 'street', 'shield', 'BLACK', 'SENTINEL', 'STREET DIVISION'],
    ['Stand Your Ground Typography Tee', 'type', 'shield', 'NAVY', 'STAND|YOUR|GROUND', 'SENTINEL'],
    ['Sentinel Dark Premium Tee', 'dark', 'shield', 'BLACK', 'SENTINEL', ''],
    ['Wings of Valor Tee', 'icon', 'wings', 'OLIVE', 'WINGS OF VALOR', 'AIR DIVISION'],
    ['Sentinel Cinematic Tee', 'cine', 'shield', 'NAVY', 'SENTINEL', 'A HEROFORGE ORIGINAL'],
    ['Sentinel Protocol Tech Tee', 'tech', 'ring', 'BLACK', 'PROTOCOL 01', 'SENTINEL'],
    ['Sentinel Comic Burst Tee', 'comic', 'wings', 'WHITE', 'VALOR!', ''],
    ['Sentinel Heritage Long Sleeve', 'vintage', 'wings', 'NAVY', 'SENTINEL AIR CORPS', 'EST. 1951', 'LS'],
  ],
  'jade-titan': [
    ['Titan Fist Minimal Tee', 'minimal', 'fist', 'BLACK', 'JADE TITAN', 'FIST'],
    ['Smash Comic Tee', 'comic', 'fist', 'GREEN', 'SMASH!', ''],
    ['Green & Black Streetwear Tee', 'street', 'fist', 'BLACK', 'JADE TITAN', 'STREET DIVISION'],
    ['Smash Mode Typography Tee', 'type', 'fist', 'GREEN', 'SMASH|MODE', 'JADE TITAN'],
    ['Jade Titan Vintage Tee', 'vintage', 'fist', 'CHAR', 'JADE TITAN ATHLETICS', 'EST. 1971'],
    ['Claw Marks Tee', 'icon', 'claws', 'BLACK', 'CLAW MARKS', 'UNTAMED'],
    ['Gamma Core Tee', 'icon', 'core', 'BLACK', 'GAMMA CORE', 'UNSTABLE'],
    ['Titan Tech Tee', 'tech', 'fist', 'CHAR', 'TITAN LAB', 'RAGE 100%'],
    ['Jade Titan Cinematic Tee', 'cine', 'fist', 'BLACK', 'JADE TITAN', 'A HEROFORGE ORIGINAL'],
    ['Titan Noir Tee', 'dark', 'claws', 'BLACK', 'JADE TITAN', ''],
    ['Titan Streetwear Long Sleeve', 'street', 'claws', 'BLACK', 'TITAN', 'STREET DIVISION', 'LS'],
  ],
  skyweaver: [
    ['Arachnid Minimal Tee', 'minimal', 'arachnid', 'WHITE', 'SKYWEAVER', 'ARACHNID'],
    ['Web Graphic Tee', 'icon', 'web', 'BLACK', 'WEB', 'CITY NIGHTS'],
    ['Skyweaver Visor Tee', 'icon', 'visor', 'RED', 'SKYWEAVER', 'VISOR'],
    ['Skyweaver Comic Tee', 'comic', 'visor', 'WHITE', 'THWIP!', ''],
    ['Web Street Oversized Tee', 'street', 'web', 'BLACK', 'WEB', 'STREET DIVISION'],
    ['Web Vintage Crest Tee', 'vintage', 'web', 'NAVY', 'SKYWEAVER CLUB', 'CITY SWINGERS'],
    ['Web Runner Typography Tee', 'type', 'arachnid', 'RED', 'WEB|RUNNER', 'SKYWEAVER'],
    ['Skyweaver Tech Tee', 'tech', 'visor', 'BLACK', 'LENS LAB', 'MK-03'],
    ['Skyweaver Cinematic Tee', 'cine', 'visor', 'NAVY', 'SKYWEAVER', 'A HEROFORGE ORIGINAL'],
    ['Web Noir Tee', 'dark', 'web', 'BLACK', 'SKYWEAVER', ''],
    ['Arachnid Street Long Sleeve', 'street', 'arachnid', 'BLACK', 'ARACHNID', 'STREET DIVISION', 'LS'],
  ],
  assembly: [
    ['Assembly Ring Minimal Tee', 'minimal', 'ring', 'BLACK', 'THE ASSEMBLY', 'RING'],
    ['Assembly Emblem Tee', 'icon', 'ring', 'CHAR', 'THE ASSEMBLY', 'EMBLEM'],
    ['Team Lineup Tee', 'icon', 'team', 'BLACK', 'UNITED', 'THE ASSEMBLY'],
    ['Assembly Comic Team Tee', 'comic', 'team', 'WHITE', 'TOGETHER!', ''],
    ['Assembly Streetwear Tee', 'street', 'team', 'BLACK', 'THE ASSEMBLY', 'STREET DIVISION'],
    ['Assembly Vintage Crest Tee', 'vintage', 'ring', 'CREAM', 'THE ASSEMBLY', 'EST. 1978'],
    ['United We Rise Typography Tee', 'type', 'ring', 'RED', 'UNITED|WE|RISE', 'THE ASSEMBLY'],
    ['Assembly Tech Tee', 'tech', 'ring', 'BLACK', 'COMMAND', 'ALL UNITS'],
    ['Assembly Cinematic Tee', 'cine', 'team', 'BLACK', 'THE ASSEMBLY', 'A HEROFORGE ORIGINAL'],
    ['Assembly Noir Tee', 'dark', 'ring', 'BLACK', 'THE ASSEMBLY', ''],
    ['City Defenders Tee', 'icon', 'skyline', 'CHAR', 'CITY DEFENDERS', 'ON PATROL'],
    ['Assembly Skyline Long Sleeve', 'street', 'skyline', 'BLACK', 'CITY WATCH', 'STREET DIVISION', 'LS'],
  ],
  tempest: [
    ['Storm Maul Minimal Tee', 'minimal', 'hammer', 'WHITE', 'TEMPEST', 'MAUL'],
    ['Storm Maul Icon Tee', 'icon', 'hammer', 'NAVY', 'STORM MAUL', 'TEMPEST'],
    ['Tempest Comic Tee', 'comic', 'bolt', 'WHITE', 'CRACK!', ''],
    ['Tempest Streetwear Tee', 'street', 'hammer', 'BLACK', 'TEMPEST', 'STREET DIVISION'],
    ['Tempest Vintage Crest Tee', 'vintage', 'bolt', 'CHAR', 'TEMPEST GUARD', 'EST. 1966'],
    ['Tempest Cinematic Tee', 'cine', 'hammer', 'NAVY', 'TEMPEST', 'A HEROFORGE ORIGINAL'],
  ],
  'obsidian-king': [
    ['Obsidian Panther Minimal Tee', 'minimal', 'panther', 'BLACK', 'OBSIDIAN', 'KING'],
    ['Obsidian King Icon Tee', 'icon', 'panther', 'PURPLE', 'OBSIDIAN KING', 'CROWNED'],
    ['Obsidian Streetwear Tee', 'street', 'panther', 'BLACK', 'OBSIDIAN', 'STREET DIVISION'],
    ['Obsidian Claw Comic Tee', 'comic', 'claws', 'WHITE', 'SLASH!', ''],
    ['Obsidian Noir Tee', 'dark', 'panther', 'BLACK', 'OBSIDIAN KING', ''],
    ['Obsidian Cinematic Tee', 'cine', 'panther', 'CHAR', 'OBSIDIAN KING', 'A HEROFORGE ORIGINAL'],
  ],
  'mystic-warden': [
    ['Mystic Mandala Minimal Tee', 'minimal', 'mandala', 'BLACK', 'WARDEN', 'RUNE'],
    ['Mystic Warden Icon Tee', 'icon', 'mandala', 'BURG', 'MYSTIC WARDEN', 'THE DOORS'],
    ['Warden Vintage Crest Tee', 'vintage', 'mandala', 'CREAM', 'MYSTIC ORDER', 'EST. 1975'],
    ['Warden Tech Tee', 'tech', 'mandala', 'BLACK', 'RUNE LAB', 'SIGIL-04'],
    ['Warden Noir Tee', 'dark', 'mandala', 'BLACK', 'MYSTIC WARDEN', ''],
    ['Warden Cinematic Tee', 'cine', 'mandala', 'CHAR', 'MYSTIC WARDEN', 'A HEROFORGE ORIGINAL'],
  ],
  starbound: [
    ['Starburst Minimal Tee', 'minimal', 'starburst', 'WHITE', 'STARBOUND', 'BURST'],
    ['Starbound Icon Tee', 'icon', 'starburst', 'NAVY', 'STARBOUND', 'HIGHER FURTHER'],
    ['Starbound Comic Tee', 'comic', 'wings', 'WHITE', 'BOOM!', ''],
    ['Starbound Streetwear Tee', 'street', 'starburst', 'BLACK', 'STARBOUND', 'STREET DIVISION'],
    ['Starbound Vintage Crest Tee', 'vintage', 'wings', 'NAVY', 'STARBOUND FLIGHT', 'EST. 1968'],
    ['Starbound Cinematic Tee', 'cine', 'starburst', 'BLACK', 'STARBOUND', 'A HEROFORGE ORIGINAL'],
  ],
  starfarers: [
    ['Rocket Minimal Tee', 'minimal', 'rocket', 'WHITE', 'STARFARERS', 'ROCKET'],
    ['Starfarers Rocket Icon Tee', 'icon', 'rocket', 'TEAL', 'STARFARERS', 'CREW 05'],
    ['Ringed Planet Tee', 'icon', 'planet', 'BLACK', 'RINGED WORLD', 'OUTER RIM'],
    ['Starfarers Comic Tee', 'comic', 'rocket', 'WHITE', 'BLAST OFF!', ''],
    ['Starfarers Streetwear Tee', 'street', 'planet', 'BLACK', 'STARFARERS', 'STREET DIVISION'],
    ['Starfarers Cinematic Tee', 'cine', 'planet', 'CHAR', 'STARFARERS', 'A HEROFORGE ORIGINAL'],
  ],
  pulp: [
    ['Pulp Bolt Comic Tee', 'comic', 'bolt', 'WHITE', 'KA-POW!', ''],
    ['City Limits Comic Tee', 'comic', 'skyline', 'BLACK', 'CITY LIMITS', ''],
    ['Wham Comic Tee', 'comic', 'fist', 'CREAM', 'WHAM!', ''],
    ['Splat Comic Tee', 'comic', 'web', 'RED', 'SPLAT!', ''],
    ['Pulp Hero Typography Tee', 'type', 'bolt', 'BLACK', 'PULP|HERO', 'ISSUE #1'],
    ['Pulp Heroes Vintage Tee', 'vintage', 'team', 'CREAM', 'PULP HEROES', 'ISSUE #1'],
  ],
};

/* ---------- build ---------- */
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const SIZES = { tee: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], oversized: ['S', 'M', 'L', 'XL'], long: ['S', 'M', 'L', 'XL', 'XXL'] };
const SOLD_OUT = new Set(['ironclad-vintage-crest-tee', 'tempest-vintage-crest-tee', 'wham-comic-tee']); // demo: a few sold-out products for the availability filter
window.Sold = (() => { try { return JSON.parse(localStorage.getItem('heroforge-sold') || '{}'); } catch (e) { return {}; } })();

function backPrint(st, p, m) {
  const tag = { st: 'tag', m, t: p.t.split('|')[0], sub: 'DEMO COLLECTION' };
  if (st === 'minimal') return null;
  if (st === 'comic') return ['hero', { st: 'words', words: [p.t.replace('!', '')], size: 84, sub: p.cn.toUpperCase() }, 'back', 0.95];
  if (st === 'street') return ['hero', { st: 'big', m, t: p.t, sub: p.sub }, 'back', 1.08];
  if (st === 'type') return ['hero', { st: 'icon', m, t: p.cn.toUpperCase(), sub: p.sub, tl: 190 }, 'back', 0.8];
  if (st === 'cine') return ['hero', { st: 'credits', t: p.cn.toUpperCase(), lines: ['STARRING YOU', 'MUSIC BY THE CITY', 'ORIGINAL SERIES', 'DEMO COLLECTION'] }, 'back', 0.95];
  return ['hero', tag, 'bt', 1.7];
}
function buildTee(c, row, idx) {
  const [name, st, motif, key, title, sub, extra] = row, ls = extra === 'LS';
  const type = ls ? 'long' : st === 'street' ? 'oversized' : 'tee', T0 = TYPES[type], slug = slugify(name), h = Art.hash(slug);
  const sh = [SHIRTS[key], SHIRTS[ALT[key]]].map((s) => [s[0], s[1], s[2]]);
  const p = { t: title, sub, cn: charName(c) };
  const front = st === 'street' ? ['hero', { st: 'tag', m: motif, t: charName(c).toUpperCase(), sub: 'STREET DIV.' }, 'lc', 1]
    : st === 'minimal' ? ['hero', { st, m: motif, t: title, sub }, 'lc', 1.25]
      : ['hero', { st, m: motif, t: title.split('|')[0], words: title.split('|'), sub, tl: Math.min(262, Math.max(110, title.length * 17)) }, 'c', 1.02];
  const spec = { n: name, fit: type === 'oversized' ? 'oversized' : 'regular', body: ls ? 'ls' : 'ss', sh, a: c.a, l: c.l, f: front, b: backPrint(st, p, motif), tone: st === 'dark' };
  const cache = {}, view = (ci, v) => (cache[ci + v] = cache[ci + v] || Art.render(spec, v, ci));
  const price = T0.base + STYLE[st].add + (h % 3) * 2, sale = h % 4 === 0;
  const sizes = SIZES[type], stockBySize = Object.fromEntries(sizes.map((s, i) => [s, SOLD_OUT.has(slug) ? 0 : ((h >>> (i * 3)) % 11 === 0 ? 0 : 3 + ((h >>> (i * 2)) % 28))]));
  return {
    id: slug, slug, name, character: c.id, characterName: charName(c), collection: STYLE[st].label, style: st, type, category: T0.label,
    description: `${STYLE[st].blurb} ${c.tag}. Original ${c.name} artwork on ${T0.gsm} combed cotton — demo collection, not official merchandise.`,
    story: c.story, price, originalPrice: sale ? Math.round(price * 1.3) : price,
    tags: ['t-shirt', type, st, c.id, charName(c).toLowerCase(), STYLE[st].label.toLowerCase(), 'superhero-inspired', motif],
    sizes, colors: sh, stockBySize, spec,
    material: `${type === 'oversized' ? '100% heavyweight' : '100% combed ringspun'} cotton, ${T0.gsm}. Pre-shrunk, soft-washed, water-based inks.`,
    details: [`${T0.gsm} cotton jersey`, type === 'oversized' ? 'Oversized, drop-shoulder fit' : ls ? 'Regular fit, ribbed cuffs' : 'Regular fit', 'Original artwork, water-based print', 'Ethically made in Portugal'],
    get primaryImage() { return view(0, 'front'); },
    get secondaryImage() { return view(0, 'model'); },
    get galleryImages() { return Art.VIEWS.map((v) => view(0, v)); },
    gallery(ci = 0) { return Art.VIEWS.map((v) => view(ci, v)); },
    thumb(ci = 0) { return view(ci, 'front'); },
  };
}
const built = [];
// Lead with the boldest graphics: minimal emblems go last in every character's run, so default listings never open with small-logo tees
const RANK = { icon: 0, comic: 1, cine: 2, street: 3, tech: 4, vintage: 5, type: 6, dark: 7, minimal: 8 };
const order = HEROES.map((c) => (ROSTER[c.id] || []).slice().sort((a, b) => RANK[a[1]] - RANK[b[1]]).map((r) => buildTee(c, r)));
// interleave characters so the default order is varied
for (let i = 0; order.some((l) => i < l.length); i++) order.forEach((l) => l[i] && built.push(l[i]));
const PHOTO_REGISTRY = [
  'photo-1521572267360-ee0c2909d518', 'photo-1583743814966-8936f5b7be1a', 'photo-1576566588028-4147f3842f27',
  'photo-1529374255404-311a2a4f1fd9', 'photo-1618354691373-d851c5c3a990', 'photo-1503342394128-c104d54dba01',
  'photo-1571455786673-9d9d6c194f90', 'photo-1581655353564-df123a1eb820', 'photo-1618453292459-53424b66bb6a',
  'photo-1523381294911-8d3cead13b95', 'photo-1523381210434-271e8be1f52b', 'photo-1588117305388-c2631a279f82',
  'photo-1618354691551-44de113f0164', 'photo-1574180045827-681f8a1a9622', 'photo-1596755094514-f87e34085b2c',
  'photo-1552374196-1ab2a1c593e8', 'photo-1552374196-c4e7ffc6e126', 'photo-1606107557195-0e29a4b5b4aa',
  'photo-1583743089695-4b816a340f82', 'photo-1576871337622-98d48d1cf531', 'photo-1622470953794-aa9c70b0fb9d',
  'photo-1618354691229-88d47f285158', 'photo-1542272604-787c3835535d', 'photo-1556821840-3a63f95609a7',
  'photo-1529720317453-c8da503f2051', 'photo-1558171813-4c088753af8f', 'photo-1514222134-b57cbb8ce073',
  'photo-1553062407-98eeb64c6a62', 'photo-1620799140408-edc6dcb6d633', 'photo-1551028719-00167b16eac5',
  'photo-1592878904946-b3cd8ae243d0', 'photo-1508427953056-b00b8d78ebf5', 'photo-1578632767115-351597cf2477',
  'photo-1556905055-8f358a7a47b2', 'photo-1509967419530-da38b4704bc6', 'photo-1543163521-1bf539c55dd2',
  'photo-1512436991641-6745cdb1723f', 'photo-1544441893-675973e31985', 'photo-1534528741775-53994a69daeb',
  'photo-1469334031218-e382a71b716b', 'photo-1539109136881-3be0616acf4b', 'photo-1500648767791-00dcc994a43e',
  'photo-1507003211169-0a1dd7228f2d', 'photo-1472099645785-5658abf4ff4e', 'photo-1519085360753-af0119f7cbe7',
  'photo-1517841905240-472988babdf9', 'photo-1524504388940-b1c1722653e1', 'photo-1548883354-7622d03aca27',
  'photo-1494790108377-be9c29b29330', 'photo-1539571696357-5a69c17a67c6', 'photo-1513094735237-8f2714d57c13',
  'photo-1516826957135-700dedea698c', 'photo-1554568218-0f1715e72254', 'photo-1445205170230-053b83016050',
  'photo-1529139574466-a303027c1d8b', 'photo-1508214751196-bcfd4ca60f91', 'photo-1550614000-4895a10e1bfd',
  'photo-1576995853123-5a10305d93c0', 'photo-1516257984-b1b4d707412e', 'photo-1527719327859-c6ce80353573',
  'photo-1508746829417-e6f548d8d6ed', 'photo-1517849845537-4d257902454a', 'photo-1501196354995-cbb51c65aaea',
  'photo-1506630448388-4e683c67ddb0', 'photo-1492562080023-ab3db95bfbce', 'photo-1584865288642-42078afe6942',
  'photo-1506152983158-b4a74a01c721', 'photo-1515886657613-9f3515b0c78f', 'photo-1509631179647-0177331693ae',
  'photo-1496747611176-843222e1e57c', 'photo-1485230895905-ec40ba36b9bc', 'photo-1483985988355-763728e1935b',
  'photo-1490481651871-ab68de25d43d', 'photo-1485968579580-b6d095142e6e', 'photo-1517445312882-bc9910d016b7',
  'photo-1541099649105-f69ad21f3246', 'photo-1552902865-b72c031ac5ea', 'photo-1473966968600-fa801b869a1a',
  'photo-1594633312681-425c7b97ccd1', 'photo-1562157873-818bc0726f68', 'photo-1624378439575-d8705ad7ae80',
  'photo-1503341455253-b2e723bb3dbb', 'photo-1571945153237-4929e783af4a', 'photo-1586790170083-2f9ceadc732d',
  'photo-1564584217132-2271feaeb3c5', 'photo-1521591443-1d4db75c8f48', 'photo-1485218126466-34e6a34c6a40',
  'photo-1578587018452-892bacefd3f2', 'photo-1593726891090-7d4f60f0fd79', 'photo-1613852348851-df1739db8b2b',
  'photo-1612722432474-b971cdcea546', 'photo-1523398002811-999ca8dec234', 'photo-1594938298603-c8148c4dae35',
  'photo-1598032895397-b9472444bf93', 'photo-1599255068390-206e0d068539', 'photo-1611601322175-ef1f6f76e46a',
  'photo-1503341504253-dff4f8e20468', 'photo-1521153089-e1a7e6adc14c', 'photo-1608234807905-4d67e47e0dd3'
];

function makeImageSet(slug, photoId, custom) {
  if (custom && typeof custom === 'object') {
    const front = custom.front || `assets/products/${slug}/front.jpg`;
    const back = custom.back || `assets/products/${slug}/back.jpg`;
    const model = custom.model || `assets/products/${slug}/model.jpg`;
    const detail = custom.detail || `assets/products/${slug}/detail.jpg`;
    const folded = custom.folded || `assets/products/${slug}/folded.jpg`;
    const obj = { front, back, model, detail, folded };
    obj[0] = front; obj[1] = back; obj[2] = model; obj[3] = detail; obj[4] = folded;
    obj.length = 5;
    obj[Symbol.iterator] = function* () { yield front; yield back; yield model; yield detail; yield folded; };
    return obj;
  }
  if (typeof window !== 'undefined' && window.PRODUCT_ASSETS && window.PRODUCT_ASSETS[slug]) {
    const loc = window.PRODUCT_ASSETS[slug];
    const front = loc.front || `assets/products/${slug}/front.jpg`;
    const back = loc.back || `assets/products/${slug}/back.jpg`;
    const model = loc.model || `assets/products/${slug}/model.jpg`;
    const detail = loc.detail || `assets/products/${slug}/detail.jpg`;
    const folded = loc.folded || `assets/products/${slug}/folded.jpg`;
    const obj = { front, back, model, detail, folded };
    obj[0] = front; obj[1] = back; obj[2] = model; obj[3] = detail; obj[4] = folded;
    obj.length = 5;
    obj[Symbol.iterator] = function* () { yield front; yield back; yield model; yield detail; yield folded; };
    return obj;
  }
  const front = `https://images.unsplash.com/${photoId}?w=900&h=1200&auto=format&fit=crop&q=85`;
  const back = `https://images.unsplash.com/${photoId}?w=900&h=1200&auto=format&fit=crop&q=85&flip=h`;
  const model = `https://images.unsplash.com/${photoId}?w=900&h=1200&auto=format&fit=crop&crop=faces,edges&q=85`;
  const detail = `https://images.unsplash.com/${photoId}?w=900&h=1200&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.45&fp-z=1.65&q=85`;
  const folded = `https://images.unsplash.com/${photoId}?w=900&h=1200&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.25&fp-z=2.1&q=85`;
  const obj = { front, back, model, detail, folded };
  obj[0] = front; obj[1] = back; obj[2] = model; obj[3] = detail; obj[4] = folded;
  obj.length = 5;
  obj[Symbol.iterator] = function* () { yield front; yield back; yield model; yield detail; yield folded; };
  return obj;
}

built.forEach((p, i) => {
  const h = Art.hash(p.id);
  const photoId = PHOTO_REGISTRY[i % PHOTO_REGISTRY.length];
  p.imageSet = makeImageSet(p.slug, photoId);
  Object.assign(p, {
    newArrival: i % 2 === 0, bestSeller: (i * 5) % 9 < 4, featured: i % 3 !== 1,
    sku: `HF-${p.character.slice(0, 3).toUpperCase()}-${String(101 + i).padStart(3, '0')}`,
    rating: +(4.1 + (h % 80) / 100).toFixed(1), reviewCount: 14 + ((h >>> 5) % 380), popularity: ((h >>> 3) % 900) + (i * 5) % 9 < 4 ? 300 : 0,
    createdAt: new Date(Date.UTC(2026, 9, 5) - (i % 2 === 0 ? i : i + 90) * 864e5).toISOString().slice(0, 10),
  });
  p.popularity = ((h >>> 3) % 900) + ((i * 5) % 9 < 4 ? 600 : 0);
  Object.defineProperty(p, 'discount', { get() { return this.originalPrice > this.price ? Math.round((1 - this.price / this.originalPrice) * 100) : 0; } });
  Object.defineProperty(p, 'badge', { get() { return this.newArrival ? 'New' : this.bestSeller ? 'Bestseller' : this.discount ? `-${this.discount}%` : ''; } });
  Object.defineProperty(p, 'stockOf', { value(size) { return Math.max(0, (p.stockBySize[size] || 0) - ((Sold[p.id] || {})[size] || 0)); } });
  Object.defineProperty(p, 'stock', { get() { return p.sizes.reduce((n, s) => n + p.stockOf(s), 0); } });
  Object.defineProperty(p, 'images', { get() { return this.galleryImages; } });
});
window.PRODUCTS = built;
window.CHARACTERS = HEROES.map((c) => ({ ...c, motif: MOTIF_OF[c.id], icon: Art.emblem(MOTIF_OF[c.id], { a: c.a, l: c.l }), display: charName(c), count: built.filter((p) => p.character === c.id).length }));
window.getCharacter = (id) => HEROES.find((c) => c.id === id);
window.getProduct = (id) => built.find((p) => p.id === id || p.slug === id);
window.money = (n) => STORE.currency + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0);
window.recordSale = (items) => { items.forEach((i) => { Sold[i.id] = Sold[i.id] || {}; Sold[i.id][i.size] = (Sold[i.id][i.size] || 0) + i.qty; }); try { localStorage.setItem('heroforge-sold', JSON.stringify(Sold)); } catch (e) { /* ignore */ } };

window.restoreSale = (items) => { items.forEach((i) => { if (Sold[i.id] && Sold[i.id][i.size]) Sold[i.id][i.size] = Math.max(0, Sold[i.id][i.size] - i.qty); }); try { localStorage.setItem('heroforge-sold', JSON.stringify(Sold)); } catch (e) { /* ignore */ } };

/* ---------- section scopes + the one query function every page uses ---------- */
window.SCOPES = {
  all: { label: 'Shop', test: () => true },
  tshirts: { label: 'T-Shirts', test: (p) => p.type === 'tee' || p.type === 'oversized' },
  new: { label: 'New Arrivals', test: (p) => p.newArrival },
  best: { label: 'Best Sellers', test: (p) => p.bestSeller },
  featured: { label: 'Featured', test: (p) => p.featured },
  sale: { label: 'Sale', test: (p) => p.discount > 0 },
};
window.queryProducts = ({ scope = 'all', q = '', chars = [], cats = [], sizes = [], colors = [], collections = [], min = 0, max = Infinity, avail = [], sort = 'default' } = {}) => {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean), sc = (SCOPES[scope] || SCOPES.all).test;
  const list = built.filter((p) => sc(p)
    && (!chars.length || chars.includes(p.character)) && (!cats.length || cats.includes(p.category)) && (!collections.length || collections.includes(p.collection))
    && (!sizes.length || sizes.some((s) => p.stockOf(s) > 0)) && (!colors.length || p.colors.some((c) => colors.includes(c[2])))
    && p.price >= min && p.price <= max
    && (!avail.length || avail.every((a) => (a === 'in' ? p.stock > 0 : a === 'sale' ? p.discount > 0 : a === 'new' ? p.newArrival : true)))
    && (!terms.length || (() => { const hay = [p.name, p.sku, p.characterName, p.character, getCharacter(p.character).official && '', p.collection, p.category, p.description, ...p.tags, ...p.colors.map((c) => c[0])].join(' ').toLowerCase(); return terms.every((t) => hay.includes(t)); })()));
  const by = { newest: (a, b) => b.createdAt.localeCompare(a.createdAt), popular: (a, b) => b.popularity - a.popularity, 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating };
  if (sort === 'default') sort = scope === 'new' ? 'newest' : scope === 'best' ? 'popular' : null;
  if (sort && by[sort]) list.sort(by[sort]);
  return list;
};
window.facets = (list) => {
  const tally = (fn) => { const m = new Map(); list.forEach((p) => [].concat(fn(p)).forEach((k) => m.set(k, (m.get(k) || 0) + 1))); return [...m.entries()]; };
  return { chars: tally((p) => p.character), cats: tally((p) => p.category), collections: tally((p) => p.collection), colors: tally((p) => [...new Set(p.colors.map((c) => c[2]))]), sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], maxPrice: Math.max(...built.map((p) => p.price)) };
};
window.COLOR_SWATCH = { Black: '#111113', White: '#efece6', Grey: '#6b6c72', Red: '#a3141e', Blue: '#18233f', Green: '#2f6b3a', Purple: '#3b2a5c' };

/* ---------- catalogue integrity check ---------- */
// Structural checks run on every page load (cheap). Pass {images:true} (tools/check-catalog.js) to also render and compare every image.
window.validateCatalog = (list = built, { images = false } = {}) => {
  const problems = [], seen = { id: {}, slug: {}, sku: {}, name: {}, svg: {} };
  const required = ['id', 'name', 'slug', 'description', 'price', 'originalPrice', 'category', 'character', 'collection', 'tags', 'primaryImage', 'secondaryImage', 'galleryImages', 'sizes', 'colors', 'stock', 'sku', 'rating', 'reviewCount', 'featured', 'newArrival', 'bestSeller'];
  list.forEach((p) => {
    required.forEach((k) => { if (p[k] === undefined || p[k] === null || p[k] === '') problems.push(`${p.id}: missing ${k}`); });
    ['id', 'slug', 'sku', 'name'].forEach((k) => { if (seen[k][p[k]]) problems.push(`duplicate ${k}: ${p[k]} (${seen[k][p[k]]} & ${p.id})`); seen[k][p[k]] = p.id; });
    if (p.originalPrice < p.price) problems.push(`${p.id}: originalPrice below price`);
    if (!getCharacter(p.character)) problems.push(`${p.id}: unknown character ${p.character}`);
    if (images) Art.VIEWS.forEach((v) => { p.colors.forEach((_, ci) => { const svg = Art.renderSVG(p.spec, v, ci), t = ((svg.match(/<title>(.*?)<\/title>/) || [])[1] || '').replace(/&amp;/g, '&'); if (!t.startsWith(p.name)) problems.push(`${p.id}: ${v} image is titled "${t}"`); if (seen.svg[svg] && seen.svg[svg] !== p.id) problems.push(`image shared by ${seen.svg[svg]} and ${p.id} (${v})`); seen.svg[svg] = p.id; }); });
  });
  return problems;
};
