// Food and beverage page: 3D bottling line, scroll stops, camera view and savings calculator.
// Needs assets/vendor/three.r128.min.js loaded first.
(function(){
'use strict';
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var fmt = function(n){ return '$' + Math.round(n).toLocaleString('en-AU'); };
var num = function(n){ return Math.round(n).toLocaleString('en-AU'); };
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function smooth(t){ return t * t * (3 - 2 * t); }
var $ = function(id){ return document.getElementById(id); };

/* ---------- scroll stops ---------- */
var sections = Array.prototype.slice.call(document.querySelectorAll('.stop'));
var panels = sections.map(function(s){ return s.querySelector('.panel'); });
var railBtns = Array.prototype.slice.call(document.querySelectorAll('.rail button'));
var LAST = sections.length - 1;
var anchors = [];
function measure(){
  var vh = innerHeight;
  anchors = sections.map(function(s, i){
    var top = s.getBoundingClientRect().top + scrollY;
    if (i === 0) return 0;
    if (i === LAST) return Math.max(0, Math.min(top + vh * 0.15, document.documentElement.scrollHeight - vh));
    return top + s.offsetHeight * 0.5 - vh * 0.5;
  });
}
function stopFloat(){
  var y = scrollY, n = anchors.length;
  if (y <= anchors[0]) return 0;
  for (var i = 0; i < n - 1; i++){
    if (y < anchors[i + 1]){
      var t = (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
      return i + smooth(clamp((t - 0.18) / 0.64, 0, 1));
    }
  }
  return n - 1;
}
railBtns.forEach(function(b){
  b.addEventListener('click', function(){ scrollTo({ top: anchors[+b.getAttribute('data-go')], behavior: reduced ? 'auto' : 'smooth' }); });
});
var counted = {};
function countUp(i){
  if (counted[i] || reduced) return;
  counted[i] = true;
  var el = panels[i] && panels[i].querySelector('.num');
  if (!el) return;
  var to = +el.getAttribute('data-to'), t0 = performance.now();
  (function step(now){
    var k = clamp((now - t0) / 900, 0, 1);
    el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
function barsHTML(parts, money){
  var max = Math.max.apply(null, parts.map(function(p){ return p[1]; })) || 1;
  return parts.map(function(p){
    return '<div class="row"><span>' + p[0] + '</span><span class="track"><span class="fill" style="width:' + (p[1] / max * 100).toFixed(1) + '%"></span></span><span class="val">' + (money ? fmt(p[1]) : num(p[1])) + '</span></div>';
  }).join('');
}

/* ---------- calculator ---------- */
function val(id){ var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
function roi(){
  var packs = val('c-packs') * val('c-days');
  var parts = [
    ['QC time', val('c-hours') * 52 * val('c-rate') * 0.6],
    ['Recall risk', val('c-recalls') / 5 * val('c-recall') * 0.8],
    ['Retailer penalties', val('c-penalty') * 0.8],
    ['Faulty packs', packs * 0.0004 * val('c-escape')]
  ];
  $('r-total').textContent = fmt(parts.reduce(function(s, p){ return s + p[1]; }, 0));
  $('r-bars').innerHTML = barsHTML(parts, true);
}
['c-packs','c-days','c-hours','c-rate','c-recall','c-recalls','c-penalty','c-escape'].forEach(function(id){ $(id).addEventListener('input', roi); });
$('roi').addEventListener('submit', function(e){ e.preventDefault(); });
roi();

/* ---------- shift report ---------- */
var report = { checked: 18240, cats: { 'Fill and caps': 9, 'Labels': 7, 'Date codes': 4, 'Foreign objects': 2 } };
function drawReport(){
  var total = 0; for (var k in report.cats) total += report.cats[k];
  $('rp-checked').textContent = num(report.checked);
  $('rp-rejects').textContent = num(total);
  $('rp-rate').textContent = (total / report.checked * 100).toFixed(2) + '%';
  $('rp-bars').innerHTML = barsHTML(Object.keys(report.cats).map(function(k){ return [k, report.cats[k]]; }), false);
}
drawReport();

/* ---------- phase toggle ---------- */
var phase = 1;
function setPhase(p){ phase = p; $('ph1').setAttribute('aria-pressed', p === 1); $('ph2').setAttribute('aria-pressed', p === 2); }
$('ph1').addEventListener('click', function(){ setPhase(1); });
$('ph2').addEventListener('click', function(){ setPhase(2); });

/* ---------- camera inset drawing ---------- */
var shot = $('shot'), sx = shot.getContext('2d');
var CODE_OK = 'BB 14 MAY 27 L2317';
function rr(x, y, w, h, r){ sx.beginPath(); sx.moveTo(x + r, y); sx.arcTo(x + w, y, x + w, y + h, r); sx.arcTo(x + w, y + h, x, y + h, r); sx.arcTo(x, y + h, x, y, r); sx.arcTo(x, y, x + w, y, r); sx.closePath(); }
function tagBox(x, y, w, h, bad, text){
  sx.strokeStyle = bad ? '#FF5A4E' : '#3DDC97'; sx.lineWidth = bad ? 4 : 2.5;
  sx.setLineDash(bad ? [] : [8, 6]); sx.strokeRect(x, y, w, h); sx.setLineDash([]);
  if (text){
    sx.font = '600 15px "JetBrains Mono", monospace';
    var tw = sx.measureText(text).width + 12;
    var tx = Math.min(Math.max(x, 4), 264 - tw - 4);
    sx.fillStyle = bad ? '#FF5A4E' : '#1f7a55'; sx.fillRect(tx, y - 22, tw, 20);
    sx.fillStyle = '#fff'; sx.fillText(text, tx + 6, y - 7);
  }
}
function drawShot(it){
  var W = 264, H = 352;
  var g = sx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, 260);
  g.addColorStop(0, '#2a3346'); g.addColorStop(1, '#0a0e16');
  sx.fillStyle = g; sx.fillRect(0, 0, W, H);
  sx.fillStyle = '#1a2130'; sx.fillRect(0, H - 34, W, 34);
  if (!it){ return; }
  if (it.kind === 'object'){
    sx.save(); sx.translate(W / 2, H - 70); sx.rotate(-0.3);
    if (it.defect === 'glove'){ sx.fillStyle = '#3b7bff'; rr(-46, -16, 92, 34, 14); sx.fill(); sx.fillStyle = '#2b5fd0'; rr(-46, -16, 30, 34, 10); sx.fill(); }
    else { sx.fillStyle = '#9aa6bb'; sx.beginPath(); sx.arc(0, 0, 26, 0, Math.PI * 2); sx.fill(); sx.fillStyle = '#1a2130'; sx.beginPath(); sx.arc(0, 0, 11, 0, Math.PI * 2); sx.fill(); }
    sx.restore();
    tagBox(W / 2 - 70, H - 118, 140, 92, true, 'FOREIGN OBJECT');
    return;
  }
  var cx = W / 2, top = 44, bw = 104, bh = 250, by = top + 54;
  /* liquid */
  var fillTop = it.defect === 'underfill' ? by + 78 : by + 22;
  sx.fillStyle = 'rgba(245,213,74,.82)'; rr(cx - bw / 2 + 5, fillTop, bw - 10, by + bh - fillTop - 6, 16); sx.fill();
  /* glass */
  sx.strokeStyle = 'rgba(205,225,255,.75)'; sx.lineWidth = 3;
  rr(cx - bw / 2, by, bw, bh, 22); sx.stroke();
  sx.beginPath(); sx.moveTo(cx - 20, by + 2); sx.lineTo(cx - 18, top + 18); sx.moveTo(cx + 20, by + 2); sx.lineTo(cx + 18, top + 18); sx.stroke();
  sx.fillStyle = 'rgba(205,225,255,.10)'; sx.fillRect(cx - 18, top + 18, 36, by - top - 16);
  /* cap */
  if (it.defect !== 'capMissing'){
    sx.save(); sx.translate(cx, top + 10);
    if (it.defect === 'capSkew') { sx.translate(8, -6); sx.rotate(0.38); }
    sx.fillStyle = '#e9edf5'; rr(-22, -12, 44, 26, 5); sx.fill();
    sx.fillStyle = '#c3cbda'; for (var i = -18; i <= 16; i += 6) sx.fillRect(i, -10, 2, 22);
    sx.restore();
  }
  /* label */
  var ly = by + 96, lh = 92;
  if (it.defect !== 'labelMissing'){
    sx.save(); sx.translate(cx, ly + lh / 2);
    if (it.defect === 'labelCrooked') sx.rotate(-0.11);
    var wrong = it.defect === 'labelWrong';
    sx.fillStyle = wrong ? '#ff9a3c' : '#f6efc6';
    if (it.defect === 'labelTorn'){ sx.beginPath(); sx.moveTo(-bw / 2, -lh / 2); sx.lineTo(bw / 2, -lh / 2); sx.lineTo(bw / 2, 4); sx.lineTo(28, 14); sx.lineTo(10, 2); sx.lineTo(-8, 22); sx.lineTo(-30, 8); sx.lineTo(-bw / 2, 26); sx.closePath(); sx.fill(); }
    else sx.fillRect(-bw / 2, -lh / 2, bw, lh);
    sx.fillStyle = wrong ? '#5a2300' : '#5b4a00';
    sx.font = '700 13px Inter, sans-serif'; sx.textAlign = 'center';
    sx.fillText(wrong ? 'ORANGE' : 'SPARKLING', 0, -18); sx.fillText(wrong ? '& MANGO' : 'LEMON', 0, -2);
    sx.font = '600 11px Inter, sans-serif'; sx.fillText('600 mL', 0, 16);
    sx.restore();
  }
  /* code */
  var cy = by + bh - 34;
  if (it.defect !== 'codeMissing'){
    sx.save(); sx.font = '600 12.5px "JetBrains Mono", monospace'; sx.textAlign = 'center';
    if (it.defect === 'codeSmudged'){ sx.filter = 'blur(2.2px)'; sx.fillStyle = 'rgba(20,20,20,.75)'; sx.fillText('BB 1? M?Y 2? L23?', cx, cy); }
    else { sx.fillStyle = '#121212'; sx.fillText(it.defect === 'codeWrong' ? 'BB 14 MAY 26 L2317' : CODE_OK, cx, cy); }
    sx.restore();
  }
  /* detection boxes */
  var d = it.defect || '';
  tagBox(cx - 30, top - 8, 60, 38, /^cap/.test(d), /^cap/.test(d) ? 'CAP' : null);
  tagBox(cx - bw / 2 - 6, fillTop - 10, bw + 12, 20, d === 'underfill', d === 'underfill' ? 'FILL LOW' : null);
  tagBox(cx - bw / 2 - 6, ly - 8, bw + 12, lh + 16, /^label/.test(d), /^label/.test(d) ? 'LABEL' : null);
  tagBox(cx - 76, cy - 18, 152, 26, /^code/.test(d), /^code/.test(d) ? 'CODE' : null);
  if (!d){ sx.fillStyle = '#3DDC97'; sx.font = '700 15px "JetBrains Mono", monospace'; sx.textAlign = 'left'; sx.fillText('PASS', 10, 24); }
}
drawShot(null);

var REASONS = {
  underfill: ['Underfilled: 28 mL short', 'Fill and caps'],
  capSkew: ['Cap not seated', 'Fill and caps'],
  capMissing: ['Cap missing', 'Fill and caps'],
  labelMissing: ['Label missing', 'Labels'],
  labelCrooked: ['Label crooked: 6° off', 'Labels'],
  labelTorn: ['Label torn', 'Labels'],
  labelWrong: ['Wrong label: Orange and Mango on a Sparkling Lemon run', 'Labels'],
  codeSmudged: ['Date code unreadable', 'Date codes'],
  codeMissing: ['Date code missing', 'Date codes'],
  codeWrong: ['Wrong date: 26 printed, 27 expected', 'Date codes'],
  glove: ['Foreign object: blue glove fragment', 'Foreign objects'],
  washer: ['Foreign object: loose washer', 'Foreign objects']
};
var camChecked = 0;
function capture(it){
  camChecked++; report.checked++;
  drawShot(it);
  var bad = !!it.defect;
  var st = $('cam-status');
  st.textContent = bad ? 'Fail' : 'Pass'; st.className = 'fb-chip ' + (bad ? 'fail' : 'pass');
  $('cam-reason').textContent = bad ? REASONS[it.defect][0] : 'Fill, cap, label and code OK';
  var rd = $('cam-read');
  var code = it.kind === 'object' ? '-' : it.defect === 'codeMissing' ? 'No code found' : it.defect === 'codeSmudged' ? 'Unreadable' : it.defect === 'codeWrong' ? 'BB 14 MAY 26 L2317' : CODE_OK;
  rd.textContent = code; rd.className = /^code/.test(it.defect || '') ? 'bad' : (it.kind === 'object' ? '' : 'good');
  $('cam-count').textContent = num(camChecked);
  if (bad) report.cats[REASONS[it.defect][1]]++;
  if (activeStop === 5) drawReport();
}

/* ---------- 3D scene ---------- */
var canvas = $('scene'), renderer;
var activeStop = 0;
var stepEls = Array.prototype.slice.call(document.querySelectorAll('#steps li'));
var camEl = $('cam');
var scrimEl = $('scrim');
function setActive(i){
  panels.forEach(function(p, j){ if (p) p.classList.toggle('is-active', j === i); });
  railBtns.forEach(function(b, j){ b.classList.toggle('on', j === i); if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  camEl.classList.toggle('off', !(i >= 1 && i <= 5));
  if (i === 5) drawReport();
  countUp(i);
}
try {
  if (!window.THREE) throw new Error('no three');
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  camEl.hidden = true;
  measure();
  var fb = function(){ var a = Math.round(stopFloat()); if (a !== activeStop){ activeStop = a; } setActive(a); };
  addEventListener('scroll', fb, { passive: true });
  addEventListener('resize', function(){ measure(); fb(); });
  fb();
  return;
}
var narrow = innerWidth < 760;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.5 : 2));
var scene = new THREE.Scene();
var BG = 0x070d1a;
scene.background = new THREE.Color(BG);
scene.fog = new THREE.FogExp2(BG, 0.011);
var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
scene.add(new THREE.HemisphereLight(0xdfe7ff, 0x0b1424, 1.0));
var sun = new THREE.DirectionalLight(0xffffff, 0.55); sun.position.set(12, 30, 18); scene.add(sun);

var C = { steel: 0xaeb9cc, steelDark: 0x7d8aa3, belt: 0x232d44, floor: 0x0f1a2f, wall: 0x1b2c50, edge: 0x8ea6ff, data: 0x6f9bff, ok: 0x3ddc97, warn: 0xffb547, alert: 0xff5a4e, lemon: 0xf5d54a };
function lam(c, o){ var m = new THREE.MeshLambertMaterial({ color: c }); if (o !== undefined){ m.transparent = true; m.opacity = o; m.depthWrite = o > 0.6; } return m; }
var edgeMat = new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.5 });
var edgeFaint = new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.2 });
function box(w, h, d, mat, x, y, z, edges, parent){
  var g = new THREE.BoxGeometry(w, h, d);
  var m = new THREE.Mesh(g, typeof mat === 'number' ? lam(mat) : mat);
  m.position.set(x, y + h / 2, z);
  if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), edges === 'faint' ? edgeFaint : edgeMat));
  (parent || scene).add(m); return m;
}
function cyl(r, h, mat, x, y, z, seg, parent){
  var g = new THREE.CylinderGeometry(r, r, h, seg || 24);
  var m = new THREE.Mesh(g, typeof mat === 'number' ? lam(mat) : mat);
  m.position.set(x, y + h / 2, z); (parent || scene).add(m); return m;
}
function radialTex(inner, outer){
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* floor + zones */
var floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), lam(0x0a1222)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
var hall = new THREE.Mesh(new THREE.PlaneGeometry(56, 18), lam(C.floor)); hall.rotation.x = -Math.PI / 2; hall.position.set(-1, 0.01, -2); scene.add(hall);
var grid = new THREE.GridHelper(56, 56, 0x1c2c4d, 0x142240); grid.scale.set(1, 1, 18 / 56); grid.position.set(-1, 0.02, -2); scene.add(grid);
var lane = new THREE.Mesh(new THREE.PlaneGeometry(36, 4.2), lam(0x13213b)); lane.rotation.x = -Math.PI / 2; lane.position.set(-4, 0.025, 0); scene.add(lane);

/* low see-through walls */
function wall(x0, z0, x1, z1, h){
  var dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
  var m = box(L, h, 0.2, lam(C.wall, 0.35), (x0 + x1) / 2, 0, (z0 + z1) / 2, true);
  m.rotation.y = -Math.atan2(dz, dx);
}
wall(-29, -11, 27, -11, 1.5); wall(-29, -11, -29, 7, 1.5); wall(-29, 7, 19, 7, 1.5); wall(27, -11, 27, -3, 1.5);
wall(-18, -11, -18, -5.6, 1.5); wall(-18, -3.4, -18, 7, 1.5);   /* processing room partition with high-care door gap */

/* processing tanks + pipes */
[[-25.5, -8], [-22, -8], [-25.5, -4.5], [-22, -4.5]].forEach(function(p){
  var t = cyl(1.3, 3.2, C.steel, p[0], 0.6, p[1], 28);
  t.add(new THREE.LineSegments(new THREE.EdgesGeometry(t.geometry, 30), edgeFaint));
  cyl(1.32, 0.3, C.steelDark, p[0], 3.8, p[1], 28);
  [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(function(l){ cyl(0.07, 0.6, C.steelDark, p[0] + l[0], 0, p[1] + l[1], 6); });
});
(function(){
  var pts = [[-22, 3.4, -4.5], [-19.5, 3.4, -4.5], [-19.5, 3.4, 0], [-19.5, 2.2, 0]].map(function(p){ return new THREE.Vector3(p[0], p[1], p[2]); });
  var curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.1, 8, false), lam(C.steel)));
})();
/* cold room */
var coldRoom = box(6, 3, 5, lam(0x3a6ea8, 0.28), -24.5, 0, 3.6, true);
var coldGlow = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.6), new THREE.MeshBasicMaterial({ color: 0x6fb4ff, transparent: true, opacity: 0.12, depthWrite: false }));
coldGlow.rotation.x = -Math.PI / 2; coldGlow.position.set(-24.5, 0.05, 3.6); scene.add(coldGlow);
/* high-care door + hand wash */
box(1.2, 1.0, 0.6, C.steel, -16.8, 0, -6.5, 'faint');
var doorFrame = box(0.25, 2.4, 0.25, C.steelDark, -18, 0, -5.6); box(0.25, 2.4, 0.25, C.steelDark, -18, 0, -3.4); box(0.25, 0.25, 2.45, C.steelDark, -18, 2.4, -4.5);

/* ---------- the line ---------- */
var BELT_Y = 0.85, X_START = -17.2, X_FILLER = -19.5, X_CAP = -14.2, X_LABEL = -9.6, X_CODE = -5.2, X_CAM = 0, X_TRIG = -0.6, X_REJ = 3.6, X_PACK = 9.6;
var SPEED = 0.95, SPACING = 1.15;
/* conveyor */
box(X_PACK - X_START + 1.4, 0.18, 1.0, C.belt, (X_START + X_PACK) / 2, BELT_Y - 0.18, 0, 'faint');
box(X_PACK - X_START + 1.4, 0.08, 0.08, C.steel, (X_START + X_PACK) / 2, BELT_Y - 0.06, -0.54);
box(X_PACK - X_START + 1.4, 0.08, 0.08, C.steel, (X_START + X_PACK) / 2, BELT_Y - 0.06, 0.54);
for (var lx = X_START; lx <= X_PACK; lx += 2.4){ box(0.08, BELT_Y - 0.18, 0.08, C.steelDark, lx, 0, -0.45); box(0.08, BELT_Y - 0.18, 0.08, C.steelDark, lx, 0, 0.45); }
/* belt stripes to show motion */
var stripeMat = new THREE.MeshBasicMaterial({ color: 0x3a4766 });
var stripes = [];
for (var si = 0; si < 28; si++){ var s = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.9), stripeMat); s.rotation.x = -Math.PI / 2; s.position.set(X_START + si * 1, BELT_Y + 0.002, 0); scene.add(s); stripes.push(s); }

/* filler carousel */
var filler = new THREE.Group(); filler.position.set(X_FILLER, 0, 0); scene.add(filler);
cyl(1.7, 1.0, C.steelDark, 0, 0, 0, 32, filler);
var carousel = new THREE.Group(); carousel.position.y = 1.0; filler.add(carousel);
cyl(1.6, 0.12, C.steel, 0, 0, 0, 32, carousel);
for (var fi = 0; fi < 12; fi++){
  var a = fi / 12 * Math.PI * 2;
  var fb2 = cyl(0.2, 0.75, lam(0xcfe3ff, 0.45), Math.cos(a) * 1.3, 0.12, Math.sin(a) * 1.3, 12, carousel);
  cyl(0.06, 0.9, C.steel, Math.cos(a) * 1.3, 0.95, Math.sin(a) * 1.3, 8, carousel);
}
cyl(0.5, 1.6, C.steel, 0, 1.12, 0, 20, carousel);
/* capper */
box(1.6, 1.2, 1.4, C.steel, X_CAP, 0, -1.25, true);
box(0.5, 0.25, 1.9, C.steel, X_CAP, 2.15, -0.5, 'faint');
var capHead = cyl(0.26, 0.5, C.steelDark, X_CAP, 1.6, 0, 16);
/* labeller */
box(2.2, 1.3, 1.3, C.steel, X_LABEL, 0, -1.25, true);
var reel1 = cyl(0.45, 0.16, lam(0xf6efc6), X_LABEL - 0.5, 1.3, -1.25, 24);
var reel2 = cyl(0.3, 0.16, lam(0xf6efc6), X_LABEL + 0.55, 1.3, -1.25, 24);
/* date coder */
box(0.5, 1.6, 0.5, C.steelDark, X_CODE, 0, -1.0);
box(0.9, 0.5, 0.6, C.steel, X_CODE, 1.6, -1.0, 'faint');
box(0.2, 0.2, 0.6, C.steelDark, X_CODE, 1.25, -0.55);
var codeFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('rgba(150,190,255,1)', 'rgba(150,190,255,0)'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
codeFlash.position.set(X_CODE, BELT_Y + 0.5, -0.25); codeFlash.scale.set(0.8, 0.8, 1); scene.add(codeFlash);
/* camera station: hood + light + trigger + tower light */
var hood = new THREE.Group(); hood.position.set(X_CAM, 0, 0); scene.add(hood);
box(0.12, 1.3, 0.12, C.steel, -0.55, BELT_Y, -0.6, false, hood); box(0.12, 1.3, 0.12, C.steel, 0.55, BELT_Y, -0.6, false, hood);
box(0.12, 1.3, 0.12, C.steel, -0.55, BELT_Y, 0.6, false, hood); box(0.12, 1.3, 0.12, C.steel, 0.55, BELT_Y, 0.6, false, hood);
box(1.3, 0.3, 1.4, lam(0x1a2a4d), 0, BELT_Y + 1.3, 0, true, hood);
var camBody = box(0.35, 0.3, 0.45, lam(0x2350f5), 0, BELT_Y + 1.6, 0, false, hood);
var ringMat = new THREE.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
var ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.48, 32), ringMat); ring.rotation.x = Math.PI / 2; ring.position.set(0, BELT_Y + 1.29, 0); hood.add(ring);
var camLight = new THREE.PointLight(0xcfe0ff, 0.3, 4); camLight.position.set(0, BELT_Y + 1.1, 0); hood.add(camLight);
var beamMat = new THREE.MeshBasicMaterial({ color: 0x8ea6ff, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
var beam = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.2, 24, 1, true), beamMat); beam.position.set(0, BELT_Y + 0.65, 0); hood.add(beam);
box(0.18, 0.5, 0.12, C.steelDark, X_TRIG, BELT_Y - 0.1, 0.62);
var laserMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.35 });
var laser = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 1.2), laserMat); laser.position.set(X_TRIG, BELT_Y + 0.25, 0); scene.add(laser);
var tower = new THREE.Group(); tower.position.set(1.0, 0, -0.85); scene.add(tower);
cyl(0.05, 2.1, C.steelDark, 0, 0, 0, 8, tower);
var lampMats = [0x3ddc97, 0xffb547, 0xff5a4e].map(function(c, i){ var m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.25 }); cyl(0.13, 0.22, m, 0, 2.1 + i * 0.24, 0, 16, tower); return m; });
/* edge AI unit + line screen */
var unit = box(0.9, 1.5, 0.7, lam(0x101c38), 2.4, 0, -2.3, true);
var unitLeds = [];
for (var ul = 0; ul < 4; ul++){ var led = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.05), new THREE.MeshBasicMaterial({ color: C.data, transparent: true, opacity: 0.8 })); led.position.set(0, 0.3 - ul * 0.18, 0.36); unit.add(led); unitLeds.push(led); }
var scrCanvas = document.createElement('canvas'); scrCanvas.width = 512; scrCanvas.height = 300;
var scrCtx = scrCanvas.getContext('2d'), scrTex = new THREE.CanvasTexture(scrCanvas);
box(0.08, 1.6, 0.08, C.steelDark, -1.6, 0, -1.7);
var screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.88), new THREE.MeshBasicMaterial({ map: scrTex })); screen.position.set(-1.6, 2.0, -1.62); scene.add(screen);
box(1.6, 0.98, 0.06, lam(0x1a2130), -1.6, 1.51, -1.68);
var lastFailTxt = '';
function drawScreen(){
  var c = scrCtx; c.fillStyle = '#0b1424'; c.fillRect(0, 0, 512, 300);
  c.fillStyle = '#8ea6ff'; c.font = '600 22px Inter, sans-serif'; c.fillText('LINE 2  ·  CHANGEOVER SET 06:00', 24, 42);
  c.fillStyle = '#eef1f6'; c.font = '700 34px Inter, sans-serif'; c.fillText('Sparkling Lemon 600 mL', 24, 92);
  c.font = '600 28px "JetBrains Mono", monospace'; c.fillText(CODE_OK, 24, 138);
  c.fillStyle = '#a9b5d0'; c.font = '500 24px Inter, sans-serif';
  var total = 0; for (var k in report.cats) total += report.cats[k];
  c.fillText('Checked ' + num(report.checked) + '   Flagged ' + total, 24, 190);
  c.fillStyle = lastFailTxt ? '#ff5a4e' : '#3ddc97'; c.beginPath(); c.arc(36, 246, 10, 0, 7); c.fill();
  c.fillStyle = '#eef1f6'; c.font = '600 24px Inter, sans-serif'; c.fillText(lastFailTxt || 'All checks passing', 58, 254);
  scrTex.needsUpdate = true;
}
drawScreen();
/* reject: air nozzle, chute, bin; QC hold table */
box(0.25, 0.25, 0.35, C.steelDark, X_REJ, BELT_Y + 0.1, -0.75);
var puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('rgba(220,235,255,.9)', 'rgba(220,235,255,0)'), transparent: true, opacity: 0, depthWrite: false }));
puff.position.set(X_REJ, BELT_Y + 0.4, -0.4); puff.scale.set(0.9, 0.9, 1); scene.add(puff);
var chute = box(0.9, 0.08, 1.0, C.steel, X_REJ, BELT_Y - 0.4, 1.05); chute.rotation.x = 0.45;
var bin = box(1.3, 0.6, 1.1, lam(0x5a2a3a), X_REJ, 0, 2.0, true);
var holdTable = box(1.8, 0.85, 0.9, C.steel, X_REJ + 0.4, 0, -2.0, 'faint');
/* case packer, pallet, truck */
box(2.0, 2.0, 2.2, C.steel, X_PACK + 0.9, 0, 0, true);
box(4.4, 0.6, 1.0, C.belt, X_PACK + 4.0, 0.25, 0, 'faint');
var PALLET_X = 15.6;
var palletGroup = new THREE.Group(); palletGroup.position.set(PALLET_X, 0, 0); scene.add(palletGroup);
box(2.2, 0.16, 1.8, lam(0x8a6a44), 0, 0, 0, false, palletGroup);
var truck = new THREE.Group(); truck.position.set(23.5, 0, 0); scene.add(truck);
box(6, 2.6, 2.6, lam(0xd9dee8, 0.4), 0, 0.6, 0, true, truck);
box(1.8, 2.0, 2.4, lam(0x2350f5), 4.0, 0.4, 0, true, truck);
[[-2, 1.3], [-2, -1.3], [3.8, 1.3], [3.8, -1.3]].forEach(function(w){ var c = cyl(0.45, 0.3, lam(0x111827), truck.position.x + w[0], 0.45, w[1], 16); c.rotation.x = Math.PI / 2; c.position.y = 0.45; });

/* people */
function person(x, z, ry){
  var g = new THREE.Group(); g.position.set(x, 0.02, z); g.rotation.y = ry || 0;
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 1.1, 12), lam(0xf2f4f8)); body.position.y = 0.88; g.add(body);
  var legs = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 8), lam(0x2a3654)); legs.position.y = 0.18; g.add(legs);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), lam(0xd9b59a)); head.position.y = 1.62; g.add(head);
  var net = new THREE.Mesh(new THREE.SphereGeometry(0.215, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xffffff)); net.position.y = 1.64; g.add(net);
  scene.add(g); return g;
}
var opScreen = person(-2.4, -2.5, 0.6);
var opHold = person(X_REJ + 0.4, -3.0, 0);
var opDoor = person(-16.6, -4.5, -1.2);

/* ---------- bottles ---------- */
var glassMat = lam(0xcfe3ff, 0.38);
var liquidMat = lam(C.lemon);
var capMat = lam(0xf2f4f8);
var labelMat = new THREE.MeshLambertMaterial({ color: 0xf6efc6, side: THREE.DoubleSide });
var labelWrongMat = new THREE.MeshLambertMaterial({ color: 0xff9a3c, side: THREE.DoubleSide });
var codeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
var codeSmudgeMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.45 });
var R = 0.2, BH = 0.78;
var gBody = new THREE.CylinderGeometry(R, R, BH, 16); gBody.translate(0, BH / 2, 0);
var gNeck = new THREE.CylinderGeometry(0.08, R, 0.24, 16); gNeck.translate(0, BH + 0.12, 0);
var gLiquid = new THREE.CylinderGeometry(R * 0.86, R * 0.86, 1, 14); gLiquid.translate(0, 0.5, 0);
var gCap = new THREE.CylinderGeometry(0.095, 0.095, 0.1, 12);
var gLabel = new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.3, 20, 1, true);
var gLabelTorn = new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.3, 20, 1, true, 0, Math.PI * 1.1);
var gCode = new THREE.PlaneGeometry(0.2, 0.04);
var flagGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.56, 1.22, 0.56));
function makeBottle(){
  var g = new THREE.Group();
  var liquid = new THREE.Mesh(gLiquid, liquidMat); liquid.position.y = 0.03; g.add(liquid);
  g.add(new THREE.Mesh(gBody, glassMat)); g.add(new THREE.Mesh(gNeck, glassMat));
  var cap = new THREE.Mesh(gCap, capMat); cap.position.y = BH + 0.29; g.add(cap);
  var label = new THREE.Mesh(gLabel, labelMat); label.position.y = 0.42; g.add(label);
  var code = new THREE.Mesh(gCode, codeMat); code.position.set(0, 0.22, R + 0.016); g.add(code);
  var flag = new THREE.LineSegments(flagGeo, new THREE.LineBasicMaterial({ color: C.alert, transparent: true, opacity: 0 })); flag.position.y = 0.58; g.add(flag);
  scene.add(g);
  return { kind: 'bottle', g: g, liquid: liquid, cap: cap, label: label, code: code, flag: flag, x: 0, defect: null, checked: false, out: null, t: 0 };
}
var gGlove = new THREE.BoxGeometry(0.42, 0.05, 0.2), gWasher = new THREE.TorusGeometry(0.09, 0.035, 8, 16);
function makeObject(){
  var g = new THREE.Group();
  var glove = new THREE.Mesh(gGlove, lam(0x3b7bff)); glove.rotation.y = 0.5; g.add(glove);
  var washer = new THREE.Mesh(gWasher, lam(0x9aa6bb)); washer.rotation.x = Math.PI / 2; g.add(washer);
  var flag = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.6, 0.35, 0.5)), new THREE.LineBasicMaterial({ color: C.alert, transparent: true, opacity: 0 })); flag.position.y = 0.12; g.add(flag);
  g.visible = false; scene.add(g);
  return { kind: 'object', g: g, glove: glove, washer: washer, flag: flag, x: 0, defect: null, checked: false, out: null, t: 0, live: false };
}
var POOLS = {
  1: ['underfill', 'capSkew', 'capMissing'],
  2: ['labelWrong', 'labelCrooked', 'labelTorn', 'labelMissing'],
  3: ['codeWrong', 'codeSmudged', 'codeMissing'],
  any: ['underfill', 'capSkew', 'labelCrooked', 'labelWrong', 'codeSmudged', 'codeWrong', 'labelTorn', 'capMissing']
};
var poolIdx = 0;
function pick(stop){
  var pool = POOLS[stop] || POOLS.any;
  poolIdx = (poolIdx + 1) % 997;
  return pool[poolIdx % pool.length];
}
function roll(stop){ return Math.random() < (stop >= 1 && stop <= 3 ? 0.22 : 0.1) ? pick(stop) : null; }
function dress(b){
  var d = b.defect || '';
  var f = d === 'underfill' ? 0.5 : 0.74;
  b.liquid.scale.y = f;
  b.cap.rotation.z = d === 'capSkew' ? 0.55 : 0; b.cap.position.x = d === 'capSkew' ? 0.05 : 0; b.cap.position.y = BH + (d === 'capSkew' ? 0.26 : 0.29);
  b.label.material = d === 'labelWrong' ? labelWrongMat : labelMat;
  b.label.geometry = d === 'labelTorn' ? gLabelTorn : gLabel;
  b.label.rotation.z = d === 'labelCrooked' ? 0.2 : 0; b.label.position.y = d === 'labelCrooked' ? 0.46 : 0.42;
  b.code.material = d === 'codeSmudged' ? codeSmudgeMat : codeMat;
}
var bottles = [];
var nB = Math.ceil((X_PACK - X_START) / SPACING) + 1;
for (var bi = 0; bi < nB; bi++){ var b = makeBottle(); b.x = X_START + bi * SPACING; b.defect = b.x < X_CAM ? roll(0) : null; b.checked = b.x >= X_CAM; dress(b); bottles.push(b); }
var objects = [makeObject(), makeObject()];
function resetBottle(b){
  var minX = Infinity;
  bottles.forEach(function(o){ if (!o.out && o !== b) minX = Math.min(minX, o.x); });
  b.x = Math.min(X_START, minX - SPACING);
  b.defect = roll(activeStop); b.checked = false; b.out = null; b.t = 0;
  b.g.visible = true; b.g.rotation.set(0, 0, 0); b.flag.material.opacity = 0;
  dress(b);
}
function reroll(stop){
  /* restock defects for bottles not yet at the camera so the active check shows up soon */
  var upstream = bottles.filter(function(b){ return !b.out && b.x < X_CAM; }).sort(function(a, b){ return b.x - a.x; });
  upstream.forEach(function(b, i){
    if (stop >= 1 && stop <= 3) b.defect = (i === 2 || i === 7 || i === 12) ? pick(stop) : (Math.random() < 0.08 ? pick(stop) : null);
    else b.defect = (i % 9 === 4) ? pick(0) : null;
    dress(b);
  });
  if (stop === 4) launchObject(0, 1);
}
function launchObject(k, gapIndex){
  var o = objects[k]; if (o.live) return;
  var upstream = bottles.filter(function(b){ return !b.out && b.x < X_CAM - 1; }).sort(function(a, b){ return b.x - a.x; });
  var ref = upstream[gapIndex] || upstream[0]; if (!ref) return;
  o.x = ref.x + SPACING / 2; o.defect = Math.random() < 0.5 ? 'glove' : 'washer';
  o.glove.visible = o.defect === 'glove'; o.washer.visible = o.defect === 'washer';
  o.checked = false; o.out = null; o.t = 0; o.live = true; o.g.visible = true; o.g.rotation.set(0, 0, 0); o.flag.material.opacity = 0;
}

/* cases */
var packed = 0, palletCount = 0, palletState = 'fill', palletT = 0;
var caseGeo = new THREE.BoxGeometry(0.95, 0.5, 0.75), caseMat = lam(0xc9a46a);
var cases = [];
function spawnCase(){
  var m = new THREE.Mesh(caseGeo, caseMat); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(caseGeo), edgeFaint));
  m.position.set(X_PACK + 2.0, 0.85 + 0.25, 0); scene.add(m);
  var slot = palletCount++; cases.push({ m: m, slot: slot, t: 0 });
}
function slotPos(s){ var layer = Math.floor(s / 4), i = s % 4; return new THREE.Vector3((i % 2 ? 0.5 : -0.5), 0.16 + 0.25 + layer * 0.5, (i < 2 ? -0.4 : 0.4)); }

/* ---------- labels ---------- */
var labelRoot = $('labels');
function mkLabel(stops, cls){ var el = document.createElement('div'); el.className = 'tag3d ' + (cls || ''); el.innerHTML = '<i></i><span></span>'; labelRoot.appendChild(el); return { el: el, txt: el.lastChild, stops: stops, pos: new THREE.Vector3(), state: cls || '', text: '', w: 0 }; }
function setLabel(l, state, text){ if (l.state !== state){ l.el.className = 'tag3d ' + state; l.state = state; } if (l.text !== text){ l.txt.textContent = text; l.text = text; l.w = 0; } }
var stationLabels = [
  ['Filler', X_FILLER, 3.2], ['Capper', X_CAP, 2.8], ['Labeller', X_LABEL, 2.4], ['Date coder', X_CODE, 2.6], ['Camera check', X_CAM, 3.0], ['Case packer', X_PACK + 0.9, 2.6], ['Dispatch', 21.5, 3.6]
].map(function(s){ var l = mkLabel([0], 'station'); setLabel(l, 'station', s[0]); l.pos.set(s[1], s[2], 0); return l; });
var det = mkLabel([1, 2, 3, 4]);
var phaseLab = mkLabel([3, 4]);
phaseLab.pos.set(X_REJ, 2.4, 1.2);
var unitLab = mkLabel([5]); setLabel(unitLab, '', 'On-site AI unit · footage stays on site'); unitLab.pos.set(2.4, 2.1, -2.3);
var scrLab = mkLabel([5]); setLabel(scrLab, '', 'Line screen · product and date set at changeover'); scrLab.pos.set(-1.6, 2.75, -1.62);
var trialLab = mkLabel([6]); setLabel(trialLab, 'ok', 'Camera station · bolts on in half a day'); trialLab.pos.set(X_CAM, 3.2, 0);
var trialLab2 = mkLabel([6]); setLabel(trialLab2, '', 'Phase 1: no connection to your machines'); trialLab2.pos.set(X_REJ, 1.9, 1.2);
var laterLabs = [
  [-18, 3.3, -4.5, 'Later: hygiene check at the high-care door'],
  [-24.5, 3.8, 3.6, 'Later: cold room energy and door alerts'],
  [X_CAP, 3.1, -0.6, 'Later: filler and capper health']
].map(function(d){ var l = mkLabel([7], 'later'); setLabel(l, 'later', d[3]); l.pos.set(d[0], d[1], d[2]); return l; });

/* ---------- camera rig ---------- */
var shots = [
  { p: [6, 17, 25], t: [-4, 0, -1] },
  { p: [3.2, 4.2, 6.6], t: [-4.2, 1.0, 0] },
  { p: [-4.0, 4.0, 6.8], t: [-4.6, 1.0, 0] },
  { p: [2.6, 3.3, 4.6], t: [-0.4, 1.3, -0.2] },
  { p: [0.6, 6.8, 5.6], t: [0.2, 0.8, 0] },
  { p: [5.5, 5.6, 6.8], t: [0.2, 1.2, -1.3] },
  { p: [9.5, 6.8, 9.5], t: [1.4, 1.0, 0] },
  { p: [-6, 14, 17], t: [-21, 0.5, -1] },
  { p: [16, 21, 24], t: [0, 0, -1] }
].map(function(s){ return { p: new THREE.Vector3().fromArray(s.p), t: new THREE.Vector3().fromArray(s.t) }; });
var camPos = shots[0].p.clone(), camTgt = shots[0].t.clone(), wantPos = new THREE.Vector3(), wantTgt = new THREE.Vector3();
function resize(){
  var w = innerWidth, h = innerHeight;
  narrow = w < 760;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = narrow ? 56 : 40;
  if (narrow) camera.setViewOffset(w, h, 0, -h * 0.12, w, h);
  else camera.setViewOffset(w, h, -w * 0.16, h * 0.04, w, h);
  camera.updateProjectionMatrix();
  measure();
}
addEventListener('resize', resize);
resize();

/* ---------- loop ---------- */
var clock = new THREE.Clock(), time = 0, act = [], lastActive = -1, towerRed = 0, captureFlash = 0, scrTimer = 0, lastFlagged = null, objTimer = 6;
var proj = new THREE.Vector3(), tmp = new THREE.Vector3();
var blockers = [];
function placeLabel(l, a){
  if (a < 0.02){ l.el.style.opacity = '0'; return; }
  proj.copy(l.pos).project(camera);
  if (proj.z > 1 || Math.abs(proj.x) > 1.3 || Math.abs(proj.y) > 1.3){ l.el.style.opacity = '0'; return; }
  var x = (proj.x * 0.5 + 0.5) * innerWidth, y = (-proj.y * 0.5 + 0.5) * innerHeight;
  var hw = (l.w || (l.w = l.el.offsetWidth)) / 2 + 10;
  x = hw * 2 > innerWidth ? innerWidth / 2 : clamp(x, hw, innerWidth - hw);
  for (var bi = 0; bi < blockers.length; bi++){ var r = blockers[bi]; if (x + hw - 10 > r.left && x - hw + 10 < r.right && y > r.top && y - 26 < r.bottom){ l.el.style.opacity = '0'; return; } }
  l.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
  l.el.style.opacity = a.toFixed(2);
}
function labelAct(l){ var m = 0; l.stops.forEach(function(s){ m = Math.max(m, act[s] || 0); }); return m; }

function moveItem(it, dt, speed){
  if (!it.out){
    it.x += SPEED * speed * dt;
    if (!it.checked && it.x >= X_CAM){
      it.checked = true; capture(it); captureFlash = 1;
      if (it.defect){ towerRed = 2.2; lastFlagged = it; lastFailTxt = REASONS[it.defect][0]; drawScreen(); it.flag.material.color.setHex(C.alert); it.flag.material.opacity = 1; }
      else { it.flag.material.color.setHex(C.ok); it.flag.material.opacity = 0.9; it.t = -0.35; }
    }
    if (it.checked && !it.defect && it.t < 0){ it.t += dt; if (it.t >= 0){ it.flag.material.opacity = 0; } }
    if (it.defect && it.checked && it.x >= X_REJ){ it.out = phase === 2 ? 'jet' : 'hand'; it.t = 0; it.ox = it.x; if (phase === 2) puff.material.opacity = 1; }
    it.g.position.set(it.x, BELT_Y, it.kind === 'object' ? 0.28 : 0);
    if (it.kind === 'object') it.g.position.y = BELT_Y + 0.03;
    return;
  }
  it.t += dt * speed;
  if (it.out === 'jet'){
    var k = Math.min(it.t / 0.9, 1);
    it.g.position.set(it.ox + 0.1 * k, BELT_Y - Math.max(0, k - 0.35) * 1.2, 0.3 + k * 1.7);
    it.g.rotation.x = k * 1.2;
    if (it.t > 1.6){ it.g.visible = false; it.out = 'done'; }
  } else if (it.out === 'hand'){
    var h = Math.min(it.t / 1.1, 1), lift = Math.sin(h * Math.PI) * 0.5;
    it.g.position.set(it.ox + 0.4 * h, BELT_Y + lift, -2.0 * smooth(h));
    if (h >= 1) it.g.position.y = 0.85;
    if (it.t > 3.2){ it.g.visible = false; it.out = 'done'; }
  }
}

function frame(){
  var dt = Math.min(clock.getDelta(), 0.05);
  if (document.hidden){ requestAnimationFrame(frame); return; }
  var speed = reduced ? 0.35 : 1;
  time += dt * speed;
  var f = stopFloat();
  for (var i = 0; i < shots.length; i++) act[i] = clamp(1 - Math.abs(f - i) * 1.6, 0, 1);

  var i0 = Math.floor(f), i1 = Math.min(i0 + 1, shots.length - 1), k = f - i0;
  wantPos.copy(shots[i0].p).lerp(shots[i1].p, k);
  wantTgt.copy(shots[i0].t).lerp(shots[i1].t, k);
  if (i0 === 0 && k < 0.5 && !reduced){ wantPos.x += Math.sin(time * 0.15) * 2.5; wantPos.z += Math.cos(time * 0.15) * 1.5; }
  var damp = reduced ? 1 : 1 - Math.pow(0.0015, dt);
  camPos.lerp(wantPos, damp); camTgt.lerp(wantTgt, damp);
  camera.position.copy(camPos); camera.lookAt(camTgt);

  var active = Math.round(f);
  if (active !== lastActive){ activeStop = active; setActive(active); reroll(active); lastActive = active; }

  /* machines */
  carousel.rotation.y -= dt * speed * 0.9;
  capHead.rotation.y += dt * speed * 6;
  reel1.rotation.y += dt * speed * 2; reel2.rotation.y += dt * speed * 3;
  stripes.forEach(function(s){ s.position.x += SPEED * speed * dt; if (s.position.x > X_PACK) s.position.x -= (X_PACK - X_START + 0.8); });
  unitLeds.forEach(function(l, j){ l.material.opacity = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(time * 7 + j * 1.9)); });
  coldGlow.material.opacity = 0.1 + 0.05 * Math.sin(time * 1.5) + 0.1 * act[7];

  /* bottles + objects */
  var codeHit = false, trigHit = false, nextD = Infinity;
  bottles.forEach(function(b){
    moveItem(b, dt, speed);
    if (!b.out){
      b.cap.visible = b.x > X_CAP && b.defect !== 'capMissing';
      b.label.visible = b.x > X_LABEL && b.defect !== 'labelMissing';
      b.code.visible = b.x > X_CODE && b.defect !== 'codeMissing' && b.label.visible;
      if (Math.abs(b.x - X_CODE) < 0.12) codeHit = true;
      if (b.x > X_TRIG && b.x < X_CAM) trigHit = true;
      if (b.x < X_CAM) nextD = Math.min(nextD, X_CAM - b.x);
      if (b.x > X_PACK){ packed++; if (packed % 6 === 0 && palletState === 'fill' && palletCount < 12) spawnCase(); resetBottle(b); }
    } else if (b.out === 'done'){ resetBottle(b); }
  });
  objects.forEach(function(o){
    if (!o.live) return;
    moveItem(o, dt, speed);
    if (o.out === 'done' || (!o.out && o.x > X_PACK)){ o.live = false; o.g.visible = false; }
  });
  objTimer -= dt * speed;
  if (objTimer <= 0){ objTimer = activeStop === 4 ? 7 : 26; launchObject(objects[0].live ? 1 : 0, 2); }

  /* station effects */
  codeFlash.material.opacity = codeHit ? 0.9 : Math.max(0, codeFlash.material.opacity - dt * 4);
  laserMat.opacity = trigHit ? 0.95 : 0.3;
  captureFlash = Math.max(0, captureFlash - dt * 3);
  ringMat.opacity = 0.3 + captureFlash * 0.7; camLight.intensity = 0.3 + captureFlash * 2.2; beamMat.opacity = 0.06 + captureFlash * 0.18;
  towerRed = Math.max(0, towerRed - dt * speed);
  lampMats[0].opacity = towerRed > 0 ? 0.2 : 0.95;
  lampMats[2].opacity = towerRed > 0 ? (0.6 + 0.4 * Math.sin(time * 14)) : 0.2;
  lampMats[1].opacity = phase === 1 && towerRed > 0 ? 0.8 : 0.2;
  puff.material.opacity = Math.max(0, puff.material.opacity - dt * 2.5);
  if (towerRed <= 0 && lastFailTxt){ lastFailTxt = ''; drawScreen(); }
  scrTimer -= dt; if (scrTimer <= 0){ scrTimer = 1; drawScreen(); }

  /* step tracker */
  if (activeStop === 3){
    var stepOn = nextD < 0.55 ? 1 : (towerRed > 1.6 || captureFlash > 0.35) ? 2 : 3;
    stepEls.forEach(function(el, j){ el.classList.toggle('on', j === stepOn); el.classList.toggle('fail', j === 3 && towerRed > 0); });
  }

  /* cases + pallet */
  cases.forEach(function(c){
    if (c.placed) return;
    c.t += dt * speed;
    if (c.t < 2.2){ c.m.position.x = X_PACK + 2.0 + c.t / 2.2 * 2.6; }
    else {
      var s = slotPos(c.slot), kk = Math.min((c.t - 2.2) / 0.7, 1);
      tmp.set(PALLET_X + s.x, s.y, s.z);
      c.m.position.lerp(tmp, kk);
      if (kk >= 1){ palletGroup.attach(c.m); c.placed = true; }
    }
  });
  if (palletState === 'fill' && palletCount >= 12 && cases.every(function(c){ return c.placed; })){ palletState = 'load'; palletT = 0; }
  if (palletState === 'load'){
    palletT += dt * speed;
    palletGroup.position.x = PALLET_X + smooth(Math.min(palletT / 3, 1)) * 6.5;
    if (palletT > 3.6){
      cases.forEach(function(c){ palletGroup.remove(c.m); });
      cases = []; palletCount = 0; palletGroup.position.x = PALLET_X; palletState = 'fill';
    }
  }

  /* operators */
  opHold.rotation.y = Math.sin(time * 0.6) * 0.3;
  opDoor.position.x = -16.6 + Math.sin(time * 0.4) * 0.3;

  /* labels */
  var heroIntro = sections[0].querySelector('.intro');
  blockers = [ (activeStop === 0 ? heroIntro : panels[activeStop]).getBoundingClientRect() ];
  if (!camEl.classList.contains('off')) blockers.push(camEl.getBoundingClientRect());
  scrimEl.style.opacity = (0.35 + 0.65 * act[0]).toFixed(2);
  stationLabels.forEach(function(l){ placeLabel(l, act[0]); });
  var dA = labelAct(det);
  if (lastFlagged && lastFlagged.g.visible && lastFlagged.out !== 'done' && towerRed > -1 && (lastFlagged.kind === 'object' ? lastFlagged.live : true) && lastFlagged.checked && lastFlagged.defect){
    det.pos.copy(lastFlagged.g.position).setY(lastFlagged.g.position.y + (lastFlagged.kind === 'object' ? 0.7 : 1.5));
    setLabel(det, 'alert', REASONS[lastFlagged.defect][0]);
    if (lastFlagged.out === 'done' || !lastFlagged.g.visible) lastFlagged = null;
  } else {
    det.pos.set(X_CAM, BELT_Y + 2.1, 0);
    setLabel(det, 'ok', 'Fill, cap, label and code OK');
  }
  placeLabel(det, dA);
  setLabel(phaseLab, phase === 2 ? 'ok' : 'warn', phase === 2 ? 'Phase 2: air jet rejects flagged bottles' : 'Phase 1: staff remove flagged bottles');
  placeLabel(phaseLab, labelAct(phaseLab));
  [unitLab, scrLab, trialLab, trialLab2].forEach(function(l){ placeLabel(l, labelAct(l)); });
  laterLabs.forEach(function(l){ placeLabel(l, act[7]); });

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener('load', measure);
})();
