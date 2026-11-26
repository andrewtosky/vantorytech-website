(function(){
'use strict';
var CFG = {"machines": [{"name": "Panel saw", "health": 94}, {"name": "CNC router 2", "health": 63, "warn": true}, {"name": "Air compressor", "health": 89}, {"name": "Gantry hoist", "health": 91}], "report": [["Main crossing", 9], ["Gantry zone", 6], ["Saw area PPE", 14], ["Dispatch yard", 5]], "stations": ["Chassis", "Floor and walls", "Roof (gantry)", "Fit-out", "End of line"], "shop": [{"name": "Panel saw", "x": 260, "w": 200}, {"name": "CNC router 2", "x": 520, "w": 220, "warn": true}, {"name": "Welding bays", "x": 800, "w": 240}, {"name": "Compressor", "x": 1100, "w": 160}, {"name": "Stores", "x": 1320, "w": 160}], "shopLabel": "Timber, panel and chassis shop", "lineLabel": "Van assembly line", "yardLabel": "Finished vans and dispatch", "nearWhere": "Main crossing, forklift aisle", "zoneWhere": "Roof station, gantry", "ppeWhere": "Panel saw", "okWhere": "Assembly hall", "machPill": "Spindle vibration rising", "machFeed": "Vibration rising, check this week"};
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function(id){ return document.getElementById(id); };
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function ease(x){ x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

/* ---------- scroll stops ---------- */
var sections = Array.prototype.slice.call(document.querySelectorAll('.stop'));
var panels = sections.map(function(s){ return s.querySelector('.panel') || s.querySelector('.intro'); });
var railBtns = Array.prototype.slice.call(document.querySelectorAll('.rail button'));
var stop = 0;
function onScroll(){
  var mid = innerHeight * 0.5, best = 0;
  sections.forEach(function(s, i){ if (s.getBoundingClientRect().top < mid) best = i; });
  if (best !== stop){ stop = best; changed(); }
}
function changed(){
  panels.forEach(function(p, i){ if (p) p.classList.toggle('is-active', i === stop); });
  railBtns.forEach(function(b, i){ b.classList.toggle('on', i === stop); });
  $('feed').classList.toggle('off', stop === 0 || stop >= 6);
}
railBtns.forEach(function(b){
  b.addEventListener('click', function(){
    sections[+b.getAttribute('data-go')].scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'start'});
  });
});
addEventListener('scroll', onScroll, {passive: true});

/* ---------- alert feed ---------- */
var counts = {near: 0, zone: 0, ppe: 0};
var clock = 7 * 3600 + 42 * 60;
function stamp(){ var h = Math.floor(clock / 3600) % 24, m = Math.floor(clock / 60) % 60, s = Math.floor(clock) % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
function push(kind, title, where, count){
  var li = document.createElement('li');
  li.className = kind;
  li.innerHTML = '<i></i><div><b></b><span></span></div><time></time>';
  li.querySelector('b').textContent = title;
  li.querySelector('span').textContent = where;
  li.querySelector('time').textContent = stamp();
  var ul = $('feed-list');
  ul.insertBefore(li, ul.firstChild);
  while (ul.children.length > 4) ul.removeChild(ul.lastChild);
  if (count){ counts[count]++; $('n-' + count).textContent = counts[count]; }
  var st = $('feed-status');
  st.textContent = kind === 'alert' ? 'Alert sent' : kind === 'warn' ? 'Flagged' : 'Watching';
  st.className = 'chip ' + (kind === 'alert' ? 'fail' : kind === 'ok' ? 'pass' : '');
}

/* ---------- health and report bars ---------- */
(function(){
  var h = $('health');
  CFG.machines.forEach(function(m){
    var row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<span></span><span class="track"><span class="fill"></span></span><span class="val"></span>';
    row.children[0].textContent = m.name;
    var f = row.querySelector('.fill'); f.style.width = m.health + '%'; if (m.warn) f.classList.add('warn');
    row.querySelector('.val').textContent = m.health + '%';
    h.appendChild(row);
  });
  var r = $('rep-bars'), max = 0;
  CFG.report.forEach(function(x){ max = Math.max(max, x[1]); });
  CFG.report.forEach(function(x){
    var row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<span></span><span class="track"><span class="fill"></span></span><span class="val"></span>';
    row.children[0].textContent = x[0];
    row.querySelector('.fill').style.width = Math.round(x[1] / max * 100) + '%';
    row.querySelector('.val').textContent = x[1];
    r.appendChild(row);
  });
})();

/* ---------- trial form ---------- */
var form = $('trial-form');
form.addEventListener('submit', function(e){
  e.preventDefault();
  var st = $('t-status'), name = $('t-name').value.trim(), email = $('t-email').value.trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ st.className = 'status err'; st.textContent = 'Please add your name and a work email.'; return; }
  var first = name.split(' ')[0];
  var data = {token: 'vantory-site-2026', subject: 'Demo page enquiry: Jayco', from_name: 'Vantory demo page', page: 'for/jayco-j9q1r7',
    name: name, role: $('t-role').value.trim(), email: email, company: $('t-company').value, area: $('t-area').value,
    checks_wanted: Array.prototype.map.call(document.querySelectorAll('input[name="t-check"]:checked'), function(c){ return c.value; }).join(', '),
    notes: $('t-notes').value.trim()};
  var btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; st.className = 'status'; st.textContent = 'Sending...';
  fetch('https://script.google.com/macros/s/AKfycbzi5j4yWk1y53HibXQxnsSc7mN-UivqlgG_SugqmqijTkWoIpDJs4at8_8Il_UaR8Ui/exec', {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(data)})
    .then(function(r){ return r.json(); })
    .then(function(res){ if (!res || !res.ok) throw new Error(res && res.message ? res.message : 'not sent');
      st.className = 'status ok'; st.textContent = 'Thanks, ' + first + '. We have your details and will email you a trial plan within one business day.'; })
    .catch(function(err){ st.className = 'status err'; st.textContent = 'Sorry, that did not send (' + (err && err.message ? err.message : 'no reply') + '). Please try again, or email enquiries@vantorytech.com.'; })
    .then(function(){ btn.disabled = false; });
  return;
  st.className = 'status ok'; st.textContent = 'This is a preview. On the live page this sends your details to Vantory.';
});

changed(); onScroll();
push('ok', 'Cameras online', CFG.okWhere, null);

/* ---------- 3D floor ---------- */
var canvas = $('scene'), renderer;
try {
  if (!window.THREE) throw new Error('no three');
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, powerPreference: 'high-performance'});
} catch (err) {
  document.documentElement.classList.add('no-webgl');
  return;
}
var narrow = innerWidth < 760;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.5 : 2));
renderer.shadowMap.enabled = !narrow;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
var scene = new THREE.Scene();
var BG = 0x070d1a;
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 70, 150);
var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
scene.add(new THREE.HemisphereLight(0xe4ebff, 0x0b1424, 0.95));
var sun = new THREE.DirectionalLight(0xffffff, 0.7);
sun.position.set(-20, 40, 25); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
var sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 120;
scene.add(sun);

var COL = {floor: 0x111d33, steel: 0xaeb9cc, dark: 0x2a3654, yellow: 0xf5c518, orange: 0xf29a1f, white: 0xeef2f8, blue: 0x2350f5,
  ok: 0x3ddc97, warn: 0xffb547, alert: 0xff5a4e, edge: 0x8ea6ff, skin: 0xd9b59a, vest: 0xd8f03a};
var matCache = {};
function lam(c, o){
  var key = c + ':' + (o === undefined ? 1 : o);
  if (matCache[key]) return matCache[key];
  var m = new THREE.MeshLambertMaterial({color: c});
  if (o !== undefined){ m.transparent = true; m.opacity = o; m.depthWrite = o > 0.6; }
  return (matCache[key] = m);
}
function basic(c, o){ return new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide}); }
function box(w, h, d, mat, x, y, z, parent){
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof mat === 'number' ? lam(mat) : mat);
  m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true;
  (parent || scene).add(m); return m;
}
function cyl(rt, rb, h, mat, x, y, z, parent, seg){
  var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), typeof mat === 'number' ? lam(mat) : mat);
  m.position.set(x || 0, y || 0, z || 0); m.castShadow = true;
  (parent || scene).add(m); return m;
}
function flat(w, d, mat, x, z, y){
  var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2; m.position.set(x, y || 0.02, z); m.receiveShadow = true; scene.add(m); return m;
}

/* layout (metres): x along the line, z towards the viewer */
var STX = [-22, -11, 0, 11, 22], LINE_Z = 0, AISLE_Z = 9, WALK_Z = 13.2, CROSS_X = -6, SHOP_Z = -12;

/* hall */
flat(200, 200, lam(0x09111f), 0, 0, 0);
flat(70, 40, lam(COL.floor), 0, 1, 0.01);
var grid = new THREE.GridHelper(70, 35, 0x1d2d4e, 0x16243f); grid.scale.set(1, 1, 40 / 70); grid.position.set(0, 0.015, 1); scene.add(grid);
box(70, 7, 0.4, lam(0x14223d), 0, 3.5, -19);
box(0.4, 7, 40, lam(0x111d36), -35, 3.5, 1);
for (var wi = -30; wi <= 30; wi += 10) box(0.5, 7, 0.6, lam(0x1b2c50), wi, 3.5, -18.6);

/* assembly line track */
flat(56, 5.4, lam(0x0c1628), 0, LINE_Z, 0.03);
[-2.7, 2.7].forEach(function(dz){ flat(56, 0.12, basic(0x5b6b8c, 0.9), 0, LINE_Z + dz, 0.04); });
STX.forEach(function(x, i){ if (i) flat(0.1, 5.4, basic(0x3b4e75, 0.8), x - 5.5, LINE_Z, 0.045); });

/* forklift aisle, walkway, crossing */
flat(66, 5, lam(0x0d1830), 0, AISLE_Z, 0.03);
for (var dx = -33; dx < 33; dx += 2.2){ flat(1.3, 0.14, basic(COL.yellow, 0.85), dx, AISLE_Z - 2.5, 0.045); flat(1.3, 0.14, basic(COL.yellow, 0.85), dx, AISLE_Z + 2.5, 0.045); }
flat(66, 2.2, lam(0x0f2230), 0, WALK_Z, 0.03);
flat(66, 0.1, basic(COL.ok, 0.7), 0, WALK_Z - 1.1, 0.045); flat(66, 0.1, basic(COL.ok, 0.7), 0, WALK_Z + 1.1, 0.045);
for (var zz = AISLE_Z - 2.3; zz < AISLE_Z + 2.4; zz += 0.7) flat(2.2, 0.38, basic(0xeef1f6, 0.55), CROSS_X, zz, 0.05);

/* ---------- caravans ---------- */
function makeVan(){
  var g = new THREE.Group();
  var frame = new THREE.Group(); g.add(frame);
  box(8.2, 0.25, 0.18, COL.dark, 0, 0.75, -1.0, frame); box(8.2, 0.25, 0.18, COL.dark, 0, 0.75, 1.0, frame);
  for (var i = -3; i <= 3; i += 1.5) box(0.15, 0.2, 2.0, COL.dark, i, 0.75, 0, frame);
  box(2.0, 0.15, 0.15, COL.dark, 5.0, 0.75, 0, frame);
  [-0.4, 0.6].forEach(function(x){ [-1.15, 1.15].forEach(function(z){ var w = cyl(0.45, 0.45, 0.3, 0x1a2235, x, 0.45, z, frame, 18); w.rotation.x = Math.PI / 2; }); });
  var walls = box(8, 2.3, 2.4, lam(0x8b6a45), 0, 2.05, 0, g);
  var body = box(8, 2.4, 2.45, lam(COL.white), 0, 2.1, 0, g);
  var stripe = box(8.02, 0.22, 2.47, lam(COL.blue), 0, 1.4, 0, g);
  var stripe2 = box(8.02, 0.1, 2.47, lam(0x5e7bff), 0, 2.9, 0, g);
  var roof = box(7.6, 0.25, 2.3, lam(0xd7deea), 0, 3.42, 0, g);
  var win1 = box(1.6, 0.8, 0.05, lam(0x1a2a48), -2, 2.4, 1.24, g);
  var win2 = box(1.2, 0.8, 0.05, lam(0x1a2a48), 2.2, 2.4, 1.24, g);
  var door = box(0.8, 1.8, 0.05, lam(0xc9d2e2), 0.4, 1.95, 1.24, g);
  var front = box(0.05, 1.0, 1.8, lam(0x1a2a48), 4.02, 2.4, 0, g);
  g.userData.set = function(stage){
    walls.visible = stage === 1;
    body.visible = stage >= 2; stripe.visible = stage >= 2; stripe2.visible = stage >= 3; roof.visible = stage >= 2;
    win1.visible = win2.visible = door.visible = front.visible = stage >= 3;
  };
  scene.add(g); return g;
}
var vans = []; for (var v = 0; v < 6; v++) vans.push(makeVan());

/* ---------- gantry over the roof station ---------- */
var GX = STX[2];
var gantry = new THREE.Group(); gantry.position.set(GX, 0, LINE_Z); scene.add(gantry);
[-4.6, 4.6].forEach(function(x){ [-3.6, 3.6].forEach(function(z){ box(0.35, 6.4, 0.35, COL.yellow, x, 3.2, z, gantry); }); box(0.4, 0.5, 7.6, COL.yellow, x, 6.4, 0, gantry); });
box(9.6, 0.5, 0.5, COL.yellow, 0, 6.15, 0, gantry);
box(0.9, 0.6, 0.9, 0x3a4766, 0, 5.6, 0, gantry);
var cable = box(0.05, 1, 0.05, 0x9aa6bd, 0, 4.5, 0, gantry);
var load = box(6.5, 0.18, 2.3, lam(0xd7deea), 0, 4.2, 0, gantry);
var zoneMat = basic(COL.alert, 0.0);
flat(9.2, 7.2, zoneMat, GX, LINE_Z, 0.06);
var zoneEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9.2, 0.01, 7.2)), new THREE.LineBasicMaterial({color: COL.alert, transparent: true, opacity: 0}));
zoneEdge.position.set(GX, 0.08, LINE_Z); scene.add(zoneEdge);

/* ---------- machine shop ---------- */
var shop = {};
function station(name, x, w){
  box(w, 0.1, 5.4, lam(0x13203a), x, 0.05, SHOP_Z, scene);
  var hi = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 3, 5.4)), new THREE.LineBasicMaterial({color: COL.warn, transparent: true, opacity: 0}));
  hi.position.set(x, 1.5, SHOP_Z); scene.add(hi);
  var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshBasicMaterial({color: COL.ok, transparent: true, opacity: 0}));
  lamp.position.set(x + w / 2 - 0.6, 3.4, SHOP_Z - 2.2); scene.add(lamp);
  return (shop[name] = {x: x, w: w, hi: hi, lamp: lamp});
}
var SHOP3D = [[-24, 6.5], [-12, 7], [0, 7.5], [11, 5.5], [22, 6.5]];
var S0 = {x: SHOP3D[0][0], w: SHOP3D[0][1]}, S1 = {x: SHOP3D[1][0], w: SHOP3D[1][1]}, S2 = {x: SHOP3D[2][0], w: SHOP3D[2][1]}, S3 = {x: SHOP3D[3][0], w: SHOP3D[3][1]}, S4 = {x: SHOP3D[4][0], w: SHOP3D[4][1]};
station('saw', S0.x, S0.w);
box(4.5, 0.9, 3.2, 0x3a4766, S0.x, 0.55, SHOP_Z, scene);
box(4.0, 0.06, 2.6, lam(0xc9a36b), S0.x - 0.3, 1.03, SHOP_Z, scene);
var blade = cyl(0.55, 0.55, 0.05, 0xcfd6e3, S0.x + 0.8, 1.05, SHOP_Z, scene, 24); blade.rotation.x = Math.PI / 2;
box(0.3, 1.6, 0.3, 0x3a4766, S0.x + 0.8, 1.8, SHOP_Z - 1.6, scene);
station('cnc', S1.x, S1.w);
box(5.2, 0.9, 3.4, 0x2b3a5c, S1.x, 0.45, SHOP_Z, scene);
box(4.8, 0.08, 3.0, lam(0xc9a36b), S1.x, 0.94, SHOP_Z, scene);
var cncBridge = new THREE.Group(); cncBridge.position.set(S1.x, 0, SHOP_Z); scene.add(cncBridge);
box(0.3, 1.6, 0.3, COL.steel, 0, 1.7, -1.8, cncBridge); box(0.3, 1.6, 0.3, COL.steel, 0, 1.7, 1.8, cncBridge);
box(0.4, 0.4, 3.9, COL.steel, 0, 2.5, 0, cncBridge);
var spindle = box(0.5, 0.9, 0.5, 0xff8a3c, 0, 1.9, 0, cncBridge);
station('weld', S2.x, S2.w);
for (var b = 0; b < 3; b++){ box(0.08, 2.2, 3.4, lam(0xb5442e, 0.75), S2.x - S2.w / 2 + 0.6 + b * (S2.w - 1.2) / 2, 1.1, SHOP_Z, scene); }
box(3.2, 0.8, 1.4, 0x3a4766, S2.x, 0.4, SHOP_Z, scene);
var spark = new THREE.PointLight(0x9fd0ff, 0, 6); spark.position.set(S2.x, 1.3, SHOP_Z); scene.add(spark);
station('comp', S3.x, S3.w);
var tank = cyl(0.8, 0.8, 3.2, 0x5b6b8c, S3.x - 0.4, 1.0, SHOP_Z, scene, 20); tank.rotation.z = Math.PI / 2;
box(1.4, 1.6, 1.6, 0x2b3a5c, S3.x + 1.0, 0.8, SHOP_Z, scene);
station('stores', S4.x, S4.w);
for (var r = 0; r < 3; r++){ box(S4.w - 0.6, 0.08, 1.4, COL.orange, S4.x, 0.8 + r * 1.1, SHOP_Z - 1.6, scene); box(S4.w - 0.6, 0.08, 1.4, COL.orange, S4.x, 0.8 + r * 1.1, SHOP_Z + 1.6, scene); }
[-1, 1].forEach(function(sx){ [-1, 1].forEach(function(sz){ box(0.12, 3.4, 0.12, COL.blue, S4.x + sx * (S4.w / 2 - 0.4), 1.7, SHOP_Z + sz * 1.6, scene); }); });

/* dispatch yard: finished vans parked */
[12, 25].forEach(function(x){ var pv = makeVan(); pv.userData.set(3); pv.position.set(x, 0, 19); });

/* ---------- people ---------- */
function person(){
  var g = new THREE.Group();
  box(0.18, 0.85, 0.2, 0x1f2a44, -0.13, 0.43, 0, g); box(0.18, 0.85, 0.2, 0x1f2a44, 0.13, 0.43, 0, g);
  box(0.55, 0.75, 0.32, lam(COL.vest), 0, 1.25, 0, g);
  box(0.57, 0.06, 0.34, lam(0xe8eef8), 0, 1.15, 0, g); box(0.57, 0.06, 0.34, lam(0xe8eef8), 0, 1.38, 0, g);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), lam(COL.skin)); head.position.y = 1.82; g.add(head);
  var hat = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xffffff)); hat.position.y = 1.86; g.add(hat);
  var glasses = box(0.26, 0.06, 0.05, 0x111827, 0, 1.83, 0.16, g);
  var ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 40), basic(COL.alert, 0)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  g.userData = {glasses: glasses, ring: ring};
  g.scale.setScalar(1.35);
  scene.add(g); return g;
}
var walkers = [person(), person(), person()];
var crosser = person(), zoner = person(), sawOp = person(), cncOp = person(), welder = person();
cncOp.position.set(S1.x + 1.2, 0, SHOP_Z + 2.4); cncOp.rotation.y = Math.PI;
welder.position.set(S2.x - 1, 0, SHOP_Z + 1.4); welder.rotation.y = Math.PI;
sawOp.position.set(S0.x - 0.4, 0, SHOP_Z + 2.4);

/* ---------- forklift ---------- */
var fork = new THREE.Group(); scene.add(fork);
box(2.4, 1.0, 1.4, COL.orange, 0, 0.75, 0, fork);
box(0.9, 0.7, 1.3, 0x3a4766, -1.2, 0.7, 0, fork);
box(0.5, 0.5, 0.8, 0x1a2235, -0.2, 1.4, 0, fork);
[[-0.9, -0.6], [-0.9, 0.6], [0.6, -0.6], [0.6, 0.6]].forEach(function(p){ box(0.08, 1.4, 0.08, 0x1a2235, p[0] * 0.8, 1.95, p[1], fork); });
box(1.5, 0.08, 1.3, 0x1a2235, -0.15, 2.65, 0, fork);
box(0.12, 2.6, 0.12, COL.steel, 1.25, 1.3, -0.45, fork); box(0.12, 2.6, 0.12, COL.steel, 1.25, 1.3, 0.45, fork);
box(1.6, 0.08, 0.18, COL.steel, 2.05, 0.35, -0.35, fork); box(1.6, 0.08, 0.18, COL.steel, 2.05, 0.35, 0.35, fork);
box(1.4, 0.15, 1.2, lam(0x8b6a45), 2.05, 0.47, 0, fork); box(1.3, 0.9, 1.1, lam(0xc9a36b), 2.05, 1.0, 0, fork);
[[-0.8, -0.72], [-0.8, 0.72], [0.8, -0.72], [0.8, 0.72]].forEach(function(p){ var w = cyl(0.32, 0.32, 0.25, 0x111827, p[0], 0.32, p[1], fork, 16); w.rotation.x = Math.PI / 2; });
var beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({color: 0xffa31a})); beacon.position.set(-0.15, 2.75, 0); fork.add(beacon);
var forkRing = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.7, 48), basic(COL.alert, 0)); forkRing.rotation.x = -Math.PI / 2; forkRing.position.y = 0.07; fork.add(forkRing);
var forkDisc = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48), basic(COL.alert, 0)); forkDisc.rotation.x = -Math.PI / 2; forkDisc.position.y = 0.06; fork.add(forkDisc);
fork.scale.setScalar(1.15);

/* ---------- cameras on poles ---------- */
function cam(x, z, h, tx, tz, rad){
  var g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  cyl(0.08, 0.08, h, 0x5b6b8c, 0, h / 2, 0, g, 8);
  var headG = new THREE.Group(); headG.position.y = h; g.add(headG);
  box(0.5, 0.3, 0.3, 0xe8eef8, 0, 0, 0, headG);
  var dir = new THREE.Vector3(tx - x, -h, tz - z), dist = dir.length();
  var coneMat = new THREE.MeshBasicMaterial({color: COL.edge, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide});
  var cone = new THREE.Mesh(new THREE.ConeGeometry(rad || 3.2, dist, 24, 1, true), coneMat);
  cone.position.y = -dist / 2; var pivot = new THREE.Group(); pivot.add(cone); headG.add(pivot);
  pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize());
  var led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({color: COL.alert})); led.position.set(0.26, 0.05, 0); headG.add(led);
  return {cone: coneMat};
}
var cams = {
  cross: cam(CROSS_X + 4, AISLE_Z + 5, 6.5, CROSS_X, AISLE_Z, 4.2),
  gantry: cam(GX + 7, LINE_Z - 5, 7, GX, LINE_Z, 4.5),
  saw: cam(S0.x + 3.5, SHOP_Z + 4, 5.5, S0.x, SHOP_Z + 1.5, 3),
  aisle: cam(24, AISLE_Z + 4, 6.5, 14, AISLE_Z, 4),
  eol: cam(STX[4] + 1, LINE_Z - 4.5, 6.5, STX[4], LINE_Z, 3.5)
};
var arch = new THREE.Group(); arch.position.set(STX[4] + 4.8, 0, LINE_Z); scene.add(arch);
var archMat = new THREE.MeshLambertMaterial({color: 0xf5d54a, transparent: true, opacity: 0.25});
box(0.3, 4.6, 0.3, archMat, 0, 2.3, -2.6, arch); box(0.3, 4.6, 0.3, archMat, 0, 2.3, 2.6, arch); box(0.3, 0.3, 5.5, archMat, 0, 4.6, 0, arch);

/* heat spots for the report */
function heatTex(){
  var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
  var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,90,78,1)'); g.addColorStop(1, 'rgba(255,90,78,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
var hTex = heatTex();
var heats = [[CROSS_X, AISLE_Z, 9], [GX, LINE_Z + 3, 7], [S0.x, SHOP_Z + 2, 6.5], [18, 19, 5]].map(function(h){
  var m = new THREE.Mesh(new THREE.PlaneGeometry(h[2], h[2]), new THREE.MeshBasicMaterial({map: hTex, transparent: true, opacity: 0, depthWrite: false}));
  m.rotation.x = -Math.PI / 2; m.position.set(h[0], 0.1, h[1]); scene.add(m); return m;
});

/* ---------- floating labels ---------- */
var state = {near: false, inZone: false, ppeBad: false};
var labelsEl = $('labels'), tags = [];
function tag(text, cls, pos, show){
  var el = document.createElement('div'); el.className = 'tag3d ' + (cls || ''); el.innerHTML = '<i></i><span></span>';
  el.querySelector('span').textContent = text; labelsEl.appendChild(el);
  var tg = {el: el, pos: pos, show: show, o: 0, text: function(s){ el.querySelector('span').textContent = s; }};
  tags.push(tg); return tg;
}
var V = function(x, y, z){ var v = new THREE.Vector3(x, y, z); return function(){ return v; }; };
CFG.stations.forEach(function(n, i){ tag(n, 'station', V(STX[i], 5.4, LINE_Z - 2.6), function(){ return (stop === 0 && !narrow) || (stop === 7 && i === 4); }); });
tag(CFG.shopLabel, 'station', V(-20, 4.4, SHOP_Z - 3), function(){ return stop === 0 && !narrow; });
tag('Forklift aisle', 'station', V(18, 0.6, AISLE_Z - 2.2), function(){ return (stop === 0 && !narrow) || stop === 1; });
tag('Pedestrian walkway', 'station', V(18, 0.6, WALK_Z + 1.4), function(){ return (stop === 0 && !narrow) || stop === 1; });
var tNear = tag('Near miss', 'alert', function(){ return fork.position.clone().setY(4.4); }, function(){ return stop === 1 && state.near; });
tag('Person under moving load', 'alert', V(GX, 7.6, LINE_Z), function(){ return stop === 2 && state.inZone; });
tag('Exclusion zone', 'warn', V(GX - 4.6, 0.4, LINE_Z + 3.6), function(){ return stop === 2 && !state.inZone; });
tag('No safety glasses', 'warn', function(){ return sawOp.position.clone().setY(3.4); }, function(){ return stop === 3 && state.ppeBad; });
tag('Glasses and hearing protection zone', 'station', V(S0.x, 3.6, SHOP_Z - 2.6), function(){ return stop === 3; });
tag(CFG.machPill, 'warn', V(S1.x, 4.8, SHOP_Z), function(){ return stop === 4; });
CFG.shop.forEach(function(m, i){ if (!m.warn) tag(m.name, 'ok', V(SHOP3D[i][0], 4.0, SHOP_Z - 2.2), function(){ return stop === 4; }); });
tag('Next step: finished van check', 'later', V(STX[4] + 4.8, 5.8, LINE_Z), function(){ return stop === 7; });
tag('Hotspot: main crossing', 'alert', V(CROSS_X, 1.5, AISLE_Z), function(){ return stop === 5; });

/* ---------- camera shots per stop ---------- */
function shot(px, py, pz, tx, ty, tz){ return {p: new THREE.Vector3(px, py, pz), t: new THREE.Vector3(tx, ty, tz)}; }
var shots = {
  0: shot(30, 34, 46, 2, 0, 1),
  1: shot(CROSS_X - 13, 16, AISLE_Z + 23, CROSS_X + 2, 0.5, AISLE_Z - 1),
  2: shot(GX + 14, 14, LINE_Z + 18, GX, 2.5, LINE_Z),
  3: shot(S0.x + 10, 9, SHOP_Z + 14, S0.x, 1.2, SHOP_Z + 1),
  4: shot(-6, 30, SHOP_Z + 21, -3, 0, SHOP_Z - 1),
  5: shot(4, 46, 40, 0, 0, 2),
  6: shot(30, 30, 44, 2, 0, 1),
  7: shot(STX[4] + 14, 11, LINE_Z + 16, STX[4] + 3, 2, LINE_Z),
  8: shot(-26, 26, 40, 2, 0, 1)
};
var camPos = shots[0].p.clone(), camTgt = shots[0].t.clone();

function resize(){
  var w = innerWidth, h = innerHeight; narrow = w < 760;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  if (narrow) camera.setViewOffset(w, h, 0, -h * 0.14, w, h);
  else camera.setViewOffset(w, h, -w * 0.17, 0, w, h);
  camera.fov = narrow ? 52 : 38;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

/* ---------- animation ---------- */
var t = reduced ? 3 : 0, last = performance.now(), fired = {}, idle = 0;
function once(k){ if (fired[k]) return false; fired[k] = true; return true; }
var tmp = new THREE.Vector3();

function frame(now){
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!reduced){ t += dt; clock += dt * 6; }
  idle += dt;
  var pulse = 0.5 + 0.5 * Math.sin(t * 8);

  // vans index along the line every 8 s
  var cyc = 8, ph = (t % cyc) / cyc, mv = ease(ph > 0.75 ? (ph - 0.75) / 0.25 : 0);
  vans.forEach(function(van, i){
    var slot = i - 1;
    var x0 = slot < 0 ? STX[0] - 11 : STX[slot], x1 = slot + 1 <= 4 ? STX[slot + 1] : STX[4] + 11;
    van.position.set(x0 + (x1 - x0) * mv, 0, LINE_Z);
    van.userData.set(slot < 1 ? 0 : slot === 1 ? 1 : slot === 2 ? 2 : 3);
    van.visible = van.position.x > -30 && van.position.x < 30;
  });
  // gantry load
  var lp = (Math.sin(t * 0.6) + 1) / 2;
  load.position.y = 3.7 + lp * 1.6; cable.scale.y = 5.6 - load.position.y; cable.position.y = (5.6 + load.position.y) / 2;

  spindle.position.z = Math.sin(t * 1.3) * 1.3; cncBridge.position.x = S1.x + Math.sin(t * 0.5) * 1.8;
  spark.intensity = Math.random() < 0.3 ? 1.8 : 0.2;
  blade.rotation.y += dt * 20;

  // forklift back and forth
  var fc = 18, fp = (t % fc) / fc, dir = fp < 0.5 ? 1 : -1;
  var fx = fp < 0.5 ? -28 + ease(fp * 2) * 56 : 28 - ease((fp - 0.5) * 2) * 56;
  fork.position.set(fx, 0, AISLE_Z - 0.8 * dir); fork.rotation.y = dir > 0 ? 0 : Math.PI;
  beacon.material.color.setHex(Math.sin(t * 10) > 0 ? 0xffa31a : 0x553300);

  // crossing person, timed to meet the forklift
  var cs = (fp > 0.12 && fp < 0.36) ? (fp - 0.12) / 0.24 : -1;
  var cz = cs >= 0 ? WALK_Z - cs * (WALK_Z - LINE_Z - 4) : (fp < 0.12 ? WALK_Z : LINE_Z + 4);
  crosser.visible = fp < 0.5;
  crosser.position.set(CROSS_X, 0, cz); crosser.rotation.y = Math.PI;
  var d = Math.hypot(fx - CROSS_X, AISLE_Z - cz);
  state.near = cs >= 0 && d < 8.5 && cz < AISLE_Z + 3.2 && cz > AISLE_Z - 3.2;
  if (stop === 1 && state.near && once('near' + Math.floor(t / fc))) push('alert', 'Near miss: forklift and person', CFG.nearWhere, 'near');
  if (state.near) tNear.text('Near miss · ' + (d * 0.55).toFixed(1) + ' m');
  var showNear = (stop === 1 || stop === 5) && state.near;
  forkRing.material.opacity = showNear ? 0.6 + 0.3 * pulse : 0;
  forkDisc.material.opacity = showNear ? 0.14 : 0;
  crosser.userData.ring.material.opacity = showNear ? 0.9 : 0;

  walkers.forEach(function(w, i){ var wx = -30 + ((t * 1.6 + i * 21) % 60); w.position.set(wx, 0, WALK_Z + (i % 2 ? 0.45 : -0.45)); w.rotation.y = Math.PI / 2; });

  // zone entry under the gantry
  var zc = 13, zp = (t % zc) / zc, zk = zp < 0.5 ? ease(zp * 2) : ease((1 - zp) * 2);
  zoner.position.set(GX + 2, 0, LINE_Z + 6.5 - zk * 4.5); zoner.rotation.y = Math.PI;
  state.inZone = zoner.position.z < LINE_Z + 3.6;
  var zOn = stop === 2;
  zoneMat.opacity = zOn ? (state.inZone ? 0.2 + 0.12 * pulse : 0.1) : 0;
  zoneEdge.material.opacity = zOn ? 0.9 : 0;
  zoner.userData.ring.material.opacity = zOn && state.inZone ? 0.9 : 0;
  if (zOn && state.inZone && once('zone' + Math.floor(t / zc))) push('alert', 'Person under moving load', CFG.zoneWhere, 'zone');

  // PPE at the saw
  state.ppeBad = (Math.floor(t / 5) % 2) === 0;
  sawOp.userData.glasses.visible = !state.ppeBad;
  sawOp.position.x = S0.x - 0.4 + Math.sin(t * 0.7) * 0.8;
  sawOp.userData.ring.material.color.setHex(COL.warn);
  sawOp.userData.ring.material.opacity = stop === 3 && state.ppeBad ? 0.9 : 0;
  if (stop === 3 && state.ppeBad && once('ppe' + Math.floor(t / 10))) push('warn', 'No safety glasses', CFG.ppeWhere, 'ppe');

  // machine health
  CFG.shop.forEach(function(m, i){
    var s = shop[['saw', 'cnc', 'weld', 'comp', 'stores'][i]], on = stop === 4;
    s.lamp.material.opacity = on ? 1 : 0;
    s.lamp.material.color.setHex(m.warn ? COL.warn : COL.ok);
    if (m.warn) s.lamp.scale.setScalar(on ? 1 + 0.35 * pulse : 1);
    s.hi.material.opacity = on && m.warn ? 0.6 + 0.4 * pulse : 0;
  });
  if (stop === 4 && once('mach' + Math.floor(t / 20))) push('warn', CFG.machFeed, CFG.shop.filter(function(m){ return m.warn; })[0].name, null);

  heats.forEach(function(h, i){ h.material.opacity += ((stop === 5 ? [0.9, 0.7, 0.6, 0.4][i] : 0) - h.material.opacity) * 0.08; });
  archMat.opacity += ((stop === 7 ? 0.9 : 0.15) - archMat.opacity) * 0.08;
  var active = {1: ['cross', 'aisle'], 2: ['gantry'], 3: ['saw'], 5: ['cross'], 7: ['eol']}[stop] || [];
  Object.keys(cams).forEach(function(k){ var c = cams[k].cone; var want = active.indexOf(k) >= 0 ? 0.2 : 0.04; c.opacity += (want - c.opacity) * 0.1; });

  if (idle > 9 && stop >= 1 && stop <= 5){ idle = 0; push('ok', 'Walkway clear', CFG.okWhere, null); }

  var s = shots[stop] || shots[0], damp = reduced ? 1 : 1 - Math.pow(0.04, dt);
  camPos.lerp(s.p, damp); camTgt.lerp(s.t, damp);
  camera.position.copy(camPos); camera.lookAt(camTgt);
  renderer.render(scene, camera);

  var w = innerWidth, h = innerHeight;
  tags.forEach(function(tg){
    var want = tg.show() ? 1 : 0; tg.o += (want - tg.o) * 0.15;
    if (tg.o < 0.02){ tg.el.style.opacity = 0; return; }
    tmp.copy(tg.pos()).project(camera);
    if (tmp.z > 1){ tg.el.style.opacity = 0; return; }
    var x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
    tg.el.style.opacity = tg.o.toFixed(2);
    tg.el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px) translate(-50%,-50%)';
  });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
