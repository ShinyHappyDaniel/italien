/* Puglia-guide app — Leaflet map, filters, search, detail sheet */
const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
let activeCat = "alla";
let searchTerm = "";
let markers = {};
let map;

/* ---------- Map init ---------- */
function initMap(){
  map = L.map('map', { zoomControl:true, attributionControl:true })
        .setView([HOME.lat, HOME.lng], 10);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Home marker
  const homeIcon = L.divIcon({ className:'', html:'<div class="home-pin">★</div>',
    iconSize:[34,34], iconAnchor:[17,17] });
  L.marker([HOME.lat, HOME.lng], { icon:homeIcon, zIndexOffset:1000 })
    .addTo(map).bindPopup('<b>Villa Agave</b><br>Ert boende');

  // "Hem"-knapp: återcentrera på Villa Agave
  const HomeCtl = L.Control.extend({
    options:{ position:'topleft' },
    onAdd:function(){
      const btn = L.DomUtil.create('a','leaflet-home-btn');
      btn.innerHTML = '★'; btn.href='#'; btn.title='Tillbaka till Villa Agave';
      L.DomEvent.on(btn,'click', e => { L.DomEvent.preventDefault(e); map.setView([HOME.lat,HOME.lng], 11); });
      return btn;
    }
  });
  map.addControl(new HomeCtl());

  // Place markers
  PLACES.forEach((p, i) => {
    const c = catMap[p.cat];
    const icon = L.divIcon({ className:'',
      html:`<div class="pin" style="background:${c.color}"><span>${c.icon}</span></div>`,
      iconSize:[28,28], iconAnchor:[14,28] });
    const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
    m.on('click', () => openSheet(i));
    markers[i] = m;
    p._i = i;
  });
}

/* ---------- Filters ---------- */
function buildFilters(){
  const wrap = document.getElementById('filters');
  const all = document.createElement('button');
  all.className = 'chip active'; all.dataset.cat = 'alla';
  all.textContent = 'Alla';
  wrap.appendChild(all);
  CATEGORIES.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip'; b.dataset.cat = c.id;
    b.innerHTML = `<span class="dot" style="background:${c.color}"></span>${c.label}`;
    wrap.appendChild(b);
  });
  wrap.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if(!chip) return;
    activeCat = chip.dataset.cat;
    [...wrap.children].forEach(c => c.classList.toggle('active', c === chip));
    render();
  });
}

/* ---------- Shared card HTML ---------- */
function cardHTML(p){
  const c = catMap[p.cat];
  const rating = p.rating ? `<span class="rating">★ ${p.rating.toFixed(1)}</span>` : '';
  const price = p.price ? `<span>${p.price}</span>` : '';
  const drive = p.drive && p.drive!=='—' ? `<span class="drive">🚗 ${p.drive}</span>` : '';
  const tags = (p.tags||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('');
  return `<div class="card" data-i="${p._i}">
    <div class="card-top">
      <div class="card-cat" style="background:${c.color}22">${c.icon}</div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-meta">${rating}${price}${drive}</div>
      </div>
    </div>
    <div class="card-desc">${p.desc}</div>
    <div class="tags">${tags}</div>
  </div>`;
}

/* ---------- Chapter view (collections, no search needed) ---------- */
function buildChapters(){
  const wrap = document.getElementById('chapters');
  wrap.innerHTML = CATEGORIES.map(c => {
    const items = PLACES.filter(p => p.cat === c.id)
                        .sort((a,b) => dist(HOME,a) - dist(HOME,b));
    const cards = items.map(cardHTML).join('');
    return `<div class="chapter">
      <div class="chapter-head">
        <div class="chapter-ic" style="background:${c.color}22">${c.icon}</div>
        <div style="flex:1">
          <div class="chapter-title">${c.label}</div>
          <div class="chapter-sub">${items.length} ställen · närmast först</div>
        </div>
        <button class="chapter-map-btn" data-cat="${c.id}">🗺️ Karta</button>
      </div>
      ${cards}
    </div>`;
  }).join('');
  wrap.querySelectorAll('.card').forEach(card =>
    card.addEventListener('click', () => openSheet(+card.dataset.i)));
  wrap.querySelectorAll('.chapter-map-btn').forEach(btn =>
    btn.addEventListener('click', () => showChapterOnMap(btn.dataset.cat)));
}

/* ---------- Open map zoomed to one chapter's places ---------- */
function showChapterOnMap(catId){
  // sätt filtret till kapitlet så bara dess pins visas
  activeCat = catId;
  document.querySelectorAll('#filters .chip').forEach(chip =>
    chip.classList.toggle('active', chip.dataset.cat === catId));
  switchView('karta');
  render();
  const pts = PLACES.filter(p => p.cat === catId).map(p => [p.lat, p.lng]);
  pts.push([HOME.lat, HOME.lng]);
  setTimeout(() => {
    if(map && pts.length){
      map.invalidateSize();
      map.fitBounds(pts, { padding:[50,50], maxZoom:13 });
    }
  }, 120);
}

/* ---------- Theme toggle ---------- */
function initTheme(){
  const btn = document.getElementById('themeBtn');
  const saved = localStorage.getItem('theme');
  if(saved) document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn();
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveDark = cur ? cur==='dark' : sysDark;
    const next = effectiveDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeBtn();
    document.querySelector('meta[name=theme-color]')
      .setAttribute('content', next==='dark' ? '#1B1A18' : '#FBFAF7');
  });
}
function updateThemeBtn(){
  const cur = document.documentElement.getAttribute('data-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveDark = cur ? cur==='dark' : sysDark;
  document.getElementById('themeBtn').textContent = effectiveDark ? '☀️' : '🌙';
}

/* ---------- Distance (haversine) ---------- */
function dist(a, b){
  const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
  const s=Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

/* ---------- Render list + markers ---------- */
function render(){
  const list = document.getElementById('list');
  const term = searchTerm.toLowerCase();
  let items = PLACES.filter(p => {
    const okCat = activeCat === 'alla' || p.cat === activeCat;
    const okSearch = !term ||
      p.name.toLowerCase().includes(term) ||
      p.desc.toLowerCase().includes(term) ||
      (p.tags||[]).join(' ').toLowerCase().includes(term) ||
      catMap[p.cat].label.toLowerCase().includes(term);
    return okCat && okSearch;
  });
  // sort by distance from home
  items.sort((a,b) => dist(HOME,a) - dist(HOME,b));

  list.innerHTML = items.map(cardHTML).join('');

  document.getElementById('count').textContent =
    `${items.length} ställen${activeCat!=='alla' ? ' · '+catMap[activeCat].label : ''} · sorterade efter närhet`;

  // show/hide markers to match filter
  const visible = new Set(items.map(p=>p._i));
  Object.entries(markers).forEach(([i, m]) => {
    const el = m.getElement();
    if(el) el.style.display = visible.has(+i) ? '' : 'none';
  });

  list.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openSheet(+card.dataset.i));
  });
}

/* ---------- Detail sheet ---------- */
function openSheet(i){
  const p = PLACES[i], c = catMap[p.cat];
  const rating = p.rating ? `<span class="rating">★ ${p.rating.toFixed(1)}</span>` : '';
  const price = p.price ? `<span>${p.price}</span>` : '';
  const drive = p.drive && p.drive!=='—' ? `<span class="drive">🚗 ${p.drive} från Villa Agave</span>` : '';
  const tags = (p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('');

  // Actions: directions always; call if phone; web if web; share always
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  let btns = `<a class="btn btn-primary" href="${gmaps}" target="_blank" rel="noopener">🧭 Vägbeskrivning</a>`;
  const extra = [];
  if(p.phone) extra.push(`<a class="btn btn-ghost" href="tel:${p.phone}">📞 Ring</a>`);
  if(p.web)   extra.push(`<a class="btn btn-ghost" href="${p.web}" target="_blank" rel="noopener">🌐 Webb</a>`);
  extra.push(`<button class="btn btn-ghost" id="shareBtn">↗ Dela</button>`);
  // layout: 1 primary full-width, then extras in a grid of 2
  let actionClass = extra.length >= 2 ? 'actions two-under' : 'actions';
  btns += extra.join('');

  document.getElementById('sheetInner').innerHTML = `
    <div class="sheet-cat" style="color:${c.color}">${c.icon} ${c.label}</div>
    <div class="sheet-name">${p.name}</div>
    <div class="sheet-meta">${rating}${price}${drive}</div>
    <div class="sheet-desc">${p.desc}</div>
    <div class="sheet-tags">${tags}</div>
    <div class="${actionClass}">${btns}</div>`;

  // wire share button
  const shareBtn = document.getElementById('shareBtn');
  if(shareBtn){
    shareBtn.addEventListener('click', () => sharePlace(i));
  }

  document.getElementById('sheet').classList.add('open');
  document.getElementById('sheetBg').classList.add('open');

  // also pan map to the place
  if(map) map.panTo([p.lat, p.lng]);
}
function closeSheet(){
  document.getElementById('sheet').classList.remove('open');
  document.getElementById('sheetBg').classList.remove('open');
  // rensa #plats från URL utan att ladda om
  if(location.hash.startsWith('#plats=')){
    history.replaceState(null, '', location.pathname + location.search);
  }
}

/* ---------- Share a place (native share + clipboard fallback) ---------- */
function sharePlace(i){
  const p = PLACES[i];
  const url = location.origin + location.pathname + '#plats=' + i;
  const text = `${p.name} — ${p.drive && p.drive!=='—' ? p.drive+' från Villa Agave. ' : ''}Från vår Puglia-guide:`;
  if(navigator.share){
    navigator.share({ title:p.name, text, url }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('shareBtn');
      if(btn){ const t=btn.textContent; btn.textContent='✓ Länk kopierad'; setTimeout(()=>btn.textContent=t,1600); }
    }).catch(()=>{});
  }
}

/* ---------- Open a place directly from a shared link (#plats=N) ---------- */
function openFromHash(){
  const m = location.hash.match(/^#plats=(\d+)$/);
  if(m){
    const i = +m[1];
    if(PLACES[i]){
      switchView('karta');
      setTimeout(() => { if(map) map.setView([PLACES[i].lat, PLACES[i].lng], 13); openSheet(i); }, 400);
    }
  }
}

/* ---------- Info & rules pages ---------- */
function buildInfo(){
  document.getElementById('emergency').innerHTML = EMERGENCY.map(e => `
    <div class="info-row">
      <div class="info-row-top">
        <span class="info-label">${e.label}</span>
        <span class="info-val"><a href="tel:${e.val}">${e.val}</a></span>
      </div>
      ${e.note ? `<div class="info-note">${e.note}</div>` : ''}
    </div>`).join('');

  const services = PLACES.filter(p=>p.cat==='info');
  document.getElementById('services').innerHTML = services.map(p => `
    <div class="info-row" style="cursor:pointer" data-i="${p._i}">
      <div class="info-row-top">
        <span class="info-label">${p.name}</span>
        ${p.phone ? `<span class="info-val"><a href="tel:${p.phone}" onclick="event.stopPropagation()">${fmtPhone(p.phone)}</a></span>` : ''}
      </div>
      <div class="info-note">${p.desc}</div>
    </div>`).join('');
  document.querySelectorAll('#services .info-row').forEach(r=>{
    r.addEventListener('click',()=>{ switchView('karta'); openSheet(+r.dataset.i); });
  });
}
function fmtPhone(p){ return p.replace('+39',''); }

function buildRules(){
  document.getElementById('rules').innerHTML = RULES.map(g => `
    <div class="rule-cat">${g.cat}</div>
    ${g.items.map(it => `
      <div class="rule">
        <div class="rule-t">${it.t}</div>
        <div class="rule-d">${it.d}</div>
      </div>`).join('')}
  `).join('');
}

/* ---------- View switching ---------- */
function switchView(v){
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === 'view-'+v));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === v));
  // search + filters only make sense on the map view
  const onMap = v === 'karta';
  document.getElementById('search').classList.toggle('hidden', !onMap);
  document.getElementById('filters').classList.toggle('hidden', !onMap);
  if(onMap && map) setTimeout(()=>map.invalidateSize(), 50);
  window.scrollTo(0,0);
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMap();
  buildFilters();
  buildChapters();
  buildInfo();
  buildRules();
  render();

  document.getElementById('search').addEventListener('input', e => {
    searchTerm = e.target.value; render();
  });
  document.getElementById('sheetBg').addEventListener('click', closeSheet);
  document.getElementById('sheetClose').addEventListener('click', closeSheet);
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => switchView(t.dataset.view)));

  // iOS install hint (only if not already standalone)
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if(isiOS && !standalone){ document.getElementById('installHint').style.display='block'; }

  // register service worker for offline
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }

  // öppna delat ställe direkt om URL har #plats=N
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
});
