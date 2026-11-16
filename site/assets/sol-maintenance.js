// Warn before machines break: filling line with motors, gearboxes and compressors fitted with
// vibration and temperature sensors, a gauge read by a camera, and a live machine health card.
// Runs on assets/sol-core.js.
(function(){
'use strict';

/* ---------- machine models (shared by the 3D scene and the health card) ---------- */
// drift goes 0 to 1 over a wear cycle; a planned job in the maintenance window resets it.
var M = {
  filler: { name: 'Filler drive motor', job: 'Book a bearing check.', vib: [1.8, 7.4], temp: [46, 63], cycle: 46, t: 6, hist: { v: [], c: [] }, done: 0 },
  comp:   { name: 'Air compressor 2', job: 'Book a cooler and filter check.', vib: [2.3, 3.9], temp: [71, 97], cycle: 40, t: 4, hist: { v: [], c: [] }, done: 0 }
};
function smooth(t){ return t * t * (3 - 2 * t); }
function state(m){
  var d = smooth(Math.min(Math.max((m.t - 6) / (m.cycle - 12), 0), 1));
  var n = Math.sin(m.t * 3.1) * 0.06 + Math.sin(m.t * 7.3) * 0.04;
  var vib = m.vib[0] + d * (m.vib[1] - m.vib[0]) + n * (1 + d * 2);
  var temp = m.temp[0] + d * (m.temp[1] - m.temp[0]) + n * 6;
  var health = Math.round(97 - d * 60 + n * 8);
  return { d: d, vib: vib, temp: temp, health: Math.max(20, Math.min(99, health)) };
}
var HIST = 90, histTimer = 0;
function stepModels(dt){
  histTimer -= dt;
  var push = histTimer <= 0; if (push) histTimer = 0.25;
  ['filler', 'comp'].forEach(function(k){
    var m = M[k];
    if (m.done > 0){ m.done -= dt; if (m.done <= 0){ m.t = 0; } }
    else { m.t += dt; if (m.t >= m.cycle){ m.done = 4.5; } }
    m.s = state(m);
    if (push){
      m.hist.v.push(m.s.vib); m.hist.c.push(m.s.temp);
      if (m.hist.v.length > HIST){ m.hist.v.shift(); m.hist.c.shift(); }
    }
  });
}
for (var w = 0; w < HIST; w++){ stepModels(0.25); }

/* ---------- health card ---------- */
var $ = function(id){ return document.getElementById(id); };
var trend = $('w-trend'), tx = trend.getContext('2d');
var focus = 'filler';
function band(h){ return h >= 85 ? 'ok' : h >= 60 ? 'warn' : 'alert'; }
function advice(m){
  var s = m.s;
  if (m.done > 0) return ['Planned job done in the maintenance window. Readings back to normal.', 'pass', 'Serviced'];
  if (s.health >= 85) return ['Running normally. Next routine check in about 30 days.', 'pass', 'Healthy'];
  var days = Math.max(2, Math.round((s.health - 34) / 2.2));
  if (s.health >= 60) return ['Wear is building. Service in about ' + days + ' days.', 'warn', 'Watch'];
  return [m.job + ' Service in about ' + days + ' days.', 'fail', 'Act soon'];
}
function line(arr, lo, hi, color, W, H){
  tx.beginPath();
  arr.forEach(function(v, i){
    var x = i / (HIST - 1) * W, y = H - 10 - (v - lo) / (hi - lo) * (H - 22);
    if (i) tx.lineTo(x, y); else tx.moveTo(x, y);
  });
  tx.strokeStyle = color; tx.lineWidth = 3; tx.stroke();
}
function drawCard(){
  var m = M[focus], s = m.s, W = trend.width, H = trend.height;
  tx.fillStyle = '#05080f'; tx.fillRect(0, 0, W, H);
  tx.strokeStyle = 'rgba(142,166,255,.12)'; tx.lineWidth = 1;
  for (var g = 1; g < 4; g++){ tx.beginPath(); tx.moveTo(0, g * H / 4); tx.lineTo(W, g * H / 4); tx.stroke(); }
  var vLo = m.vib[0] - 1, vHi = m.vib[1] + 1.2, cLo = m.temp[0] - 6, cHi = m.temp[1] + 8;
  var limY = H - 10 - ((m.vib[0] + (m.vib[1] - m.vib[0]) * 0.55) - vLo) / (vHi - vLo) * (H - 22);
  tx.setLineDash([8, 7]); tx.strokeStyle = 'rgba(255,181,71,.55)'; tx.beginPath(); tx.moveTo(0, limY); tx.lineTo(W, limY); tx.stroke(); tx.setLineDash([]);
  tx.fillStyle = 'rgba(255,181,71,.8)'; tx.font = '600 18px Inter, sans-serif'; tx.fillText('alert level', 10, limY - 8);
  line(m.hist.c, cLo, cHi, '#FFB547', W, H);
  line(m.hist.v, vLo, vHi, '#8EA6FF', W, H);
  tx.fillStyle = '#A9B5D0'; tx.font = '500 17px Inter, sans-serif'; tx.textAlign = 'right'; tx.fillText('last 7 days', W - 10, 24); tx.textAlign = 'left';
  $('w-name').textContent = m.name;
  $('w-score').textContent = s.health;
  $('w-vib').textContent = s.vib.toFixed(1);
  $('w-temp').textContent = Math.round(s.temp);
  var a = advice(m);
  $('w-advice').textContent = a[0];
  var st = $('w-status'); st.textContent = a[2]; st.className = 'fb-chip ' + a[1];
}
var cardTimer = 0;
function tick(dt, time, active){
  stepModels(dt);
  focus = active === 2 ? 'comp' : 'filler';
  cardTimer -= dt; if (cardTimer <= 0){ cardTimer = 0.2; drawCard(); }
}
drawCard();

/* ---------- report and calculator ---------- */
function drawReport(H){
  $('rp-bars').innerHTML = H.bars([
    ['Vibration', 2, '#8EA6FF'], ['Temperature', 1, '#FFB547'], ['Gauge readings', 1, '#3DDC97']
  ], false);
}

SolPage({
  widgetStops: [1, 2, 3, 4, 5],
  tick: tick,
  onStop: function(i, H){ if (i === 5) drawReport(H); },
  calc: {
    inputs: ['c-down', 'c-hourcost', 'c-insp', 'c-rate', 'c-callouts', 'c-callcost'],
    parts: function(v){
      return [
        ['Stoppages', v['c-down'] * v['c-hourcost'] * 0.4],
        ['Inspection time', v['c-insp'] * 52 * v['c-rate'] * 0.5],
        ['Call-outs', v['c-callouts'] * v['c-callcost'] * 0.5]
      ];
    }
  },
  build: function(H){
    var THREE = window.THREE, C = H.C, box = H.box, cyl = H.cyl, lam = H.lam;
    var BELT_Y = 0.85, X0 = -16.5, X1 = 13;
    H.floor(40, 22, -1, -3);
    H.wall(-21, -14, 19, -14, 1.5); H.wall(-21, -14, -21, 8, 1.5); H.wall(-21, 8, 19, 8, 1.5); H.wall(19, -14, 19, 0, 1.5);
    H.wall(-7, -10.4, 4.6, -10.4, 0.01);
    H.wall(-7, -4.6, 4.6, -4.6, 1.2); H.wall(-7, -10.4, -7, -4.6, 1.2);

    /* conveyor */
    box(X1 - X0, 0.18, 1.0, C.belt, (X0 + X1) / 2, BELT_Y - 0.18, 0, 'faint');
    box(X1 - X0, 0.08, 0.08, C.steel, (X0 + X1) / 2, BELT_Y - 0.06, -0.54);
    box(X1 - X0, 0.08, 0.08, C.steel, (X0 + X1) / 2, BELT_Y - 0.06, 0.54);
    for (var lx = X0; lx <= X1; lx += 2.4){ box(0.08, BELT_Y - 0.18, 0.08, C.steelDark, lx, 0, -0.45); box(0.08, BELT_Y - 0.18, 0.08, C.steelDark, lx, 0, 0.45); }
    var stripeMat = new THREE.MeshBasicMaterial({ color: 0x3a4766 }), stripes = [];
    for (var si = 0; si < 30; si++){ var sp = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.9), stripeMat); sp.rotation.x = -Math.PI / 2; sp.position.set(X0 + si, BELT_Y + 0.002, 0); H.scene.add(sp); stripes.push(sp); }

    /* filler with its drive motor and gearbox */
    var filler = new THREE.Group(); filler.position.set(-13, 0, 0); H.scene.add(filler);
    cyl(1.7, 1.0, C.steelDark, 0, 0, 0, 32, filler);
    var carousel = new THREE.Group(); carousel.position.y = 1.0; filler.add(carousel);
    cyl(1.6, 0.12, C.steel, 0, 0, 0, 32, carousel);
    for (var fi = 0; fi < 12; fi++){ var a = fi / 12 * Math.PI * 2; cyl(0.06, 0.9, C.steel, Math.cos(a) * 1.3, 0.95, Math.sin(a) * 1.3, 8, carousel); }
    cyl(0.5, 1.6, C.steel, 0, 1.12, 0, 20, carousel);

    var sensorMats = {};
    function motor(key, x, z, scale, rotY){
      var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY || 0; H.scene.add(g);
      var s = scale || 1;
      box(1.5 * s, 0.35 * s, 0.9 * s, C.steelDark, 0, 0, 0, 'faint', g);
      var body = new THREE.Group(); body.position.y = 0.35 * s; g.add(body);
      var m = new THREE.Mesh(new THREE.CylinderGeometry(0.36 * s, 0.36 * s, 0.95 * s, 20), lam(0x2a4d8f)); m.rotation.z = Math.PI / 2; m.position.set(-0.25 * s, 0.38 * s, 0); body.add(m);
      for (var r = -2; r <= 2; r++){ var fin = new THREE.Mesh(new THREE.TorusGeometry(0.37 * s, 0.025 * s, 6, 20), lam(0x3a5ea6)); fin.rotation.y = Math.PI / 2; fin.position.set(-0.25 * s + r * 0.17 * s, 0.38 * s, 0); body.add(fin); }
      var gb = new THREE.Mesh(new THREE.BoxGeometry(0.55 * s, 0.7 * s, 0.7 * s), lam(C.steel)); gb.position.set(0.5 * s, 0.35 * s, 0); body.add(gb);
      var mat = new THREE.MeshBasicMaterial({ color: C.ok });
      var puck = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * s, 0.11 * s, 0.1 * s, 14), mat); puck.position.set(-0.2 * s, 0.8 * s, 0); body.add(puck);
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.16 * s, 0.24 * s, 24), new THREE.MeshBasicMaterial({ color: C.ok, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(-0.2 * s, 0.86 * s, 0); body.add(ring);
      sensorMats[key] = { puck: mat, ring: ring };
      var heat = H.glow('rgba(255,120,60,1)', 2.2 * s, x - 0.2 * s, 0.75 * s, z);
      return { g: g, body: body, heat: heat, puck: mat, ring: ring };
    }
    var fMotor = motor('filler', -13, 2.7, 1, Math.PI);
    var cMotor = motor('capper', -8.2, -1.6, 0.6, 0);
    var d1 = motor('drive1', 1.5, 1.35, 0.7, Math.PI);
    var d2 = motor('drive2', 8.5, 1.35, 0.7, Math.PI);
    /* capper and labeller */
    box(1.6, 1.2, 1.4, C.steel, -8.2, 0, -1.25, true);
    var capHead = cyl(0.26, 0.5, C.steelDark, -8.2, 1.6, 0, 16);
    box(2.2, 1.3, 1.3, C.steel, -3.4, 0, -1.25, true);
    var reel = cyl(0.45, 0.16, lam(0xf6efc6), -3.9, 1.3, -1.25, 24);
    /* case packer */
    box(2.0, 2.0, 2.2, C.steel, X1 + 0.9, 0, 0, true);

    /* compressor room */
    function compressor(x){
      var g = new THREE.Group(); g.position.set(x, 0, -7.6); H.scene.add(g);
      box(2.0, 1.5, 1.3, lam(0x2a3a5c), 0, 0, 0, true, g);
      var fan = new THREE.Group(); fan.position.set(0, 1.52, 0); g.add(fan);
      var grille = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 24), lam(0x111a2e)); fan.add(grille);
      for (var b = 0; b < 4; b++){ var bl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.12), lam(0x8090b0)); bl.rotation.y = b * Math.PI / 4; bl.position.y = 0.04; fan.add(bl); }
      var mat = new THREE.MeshBasicMaterial({ color: C.ok });
      var puck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 14), mat); puck.position.set(0.75, 1.55, 0.4); g.add(puck);
      var heat = H.glow('rgba(255,120,60,1)', 3, x, 1.0, -7.6);
      return { g: g, fan: fan, puck: mat, heat: heat };
    }
    var comp1 = compressor(-4.6), comp2 = compressor(-1.6);
    var tank = cyl(0.75, 2.6, lam(0x3b4f75), 1.6, 0.2, -8.6, 24);
    cyl(0.05, 1.4, C.steel, 1.6, 2.8, -8.6, 8);
    (function(){
      var pts = [[-1.6, 1.4, -7.6], [-1.6, 2.4, -8.6], [1.6, 2.4, -8.6]].map(function(p){ return new THREE.Vector3(p[0], p[1], p[2]); });
      H.scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 30, 0.07, 8, false), lam(C.steel)));
    })();
    /* gauge panel and camera */
    var GX = 3.4, GZ = -6.2;
    box(1.3, 2.1, 0.2, lam(0x1a2a4d), GX, 0, GZ - 0.12, true);
    var gc = document.createElement('canvas'); gc.width = gc.height = 256; var gctx = gc.getContext('2d'), gtex = new THREE.CanvasTexture(gc);
    var gaugeVal = 6.8;
    function drawGauge(){
      var c = gctx; c.clearRect(0, 0, 256, 256);
      c.fillStyle = '#f2f4f8'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill();
      c.strokeStyle = '#2a3654'; c.lineWidth = 8; c.stroke();
      c.lineWidth = 10; c.strokeStyle = '#3ddc97'; c.beginPath(); c.arc(128, 128, 96, Math.PI * 0.75 + 1.5 * Math.PI * 0.6, Math.PI * 0.75 + 1.5 * Math.PI * 0.85); c.stroke();
      c.strokeStyle = '#ff5a4e'; c.beginPath(); c.arc(128, 128, 96, Math.PI * 0.75, Math.PI * 0.75 + 1.5 * Math.PI * 0.5); c.stroke();
      c.fillStyle = '#2a3654'; c.font = '600 22px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('bar', 128, 190);
      for (var i = 0; i <= 10; i++){ var an = Math.PI * 0.75 + 1.5 * Math.PI * i / 10; c.beginPath(); c.moveTo(128 + Math.cos(an) * 104, 128 + Math.sin(an) * 104); c.lineTo(128 + Math.cos(an) * 116, 128 + Math.sin(an) * 116); c.lineWidth = 4; c.strokeStyle = '#2a3654'; c.stroke(); }
      var na = Math.PI * 0.75 + 1.5 * Math.PI * gaugeVal / 10;
      c.strokeStyle = '#111'; c.lineWidth = 7; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(na) * 88, 128 + Math.sin(na) * 88); c.stroke();
      c.fillStyle = '#111'; c.beginPath(); c.arc(128, 128, 12, 0, 7); c.fill();
      gtex.needsUpdate = true;
    }
    drawGauge();
    var gauge = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ map: gtex })); gauge.position.set(GX, 1.5, GZ - 0.01); H.scene.add(gauge);
    cyl(0.06, 2.0, C.steelDark, GX, 0, -4.4, 8);
    var gcam = box(0.3, 0.26, 0.42, lam(0x2350f5), GX, 1.95, -4.55);
    gcam.lookAt(GX, 1.5, GZ);
    var gflash = H.glow('rgba(170,200,255,1)', 1.4, GX, 1.5, GZ + 0.15);
    var beamMat = new THREE.MeshBasicMaterial({ color: 0x8ea6ff, transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    var beam = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.7, 20, 1, true), beamMat);
    beam.position.set(GX, 1.72, -5.35); beam.rotation.x = -Math.PI / 2 + 0.25; H.scene.add(beam);

    /* workshop: on-site AI unit and maintenance screen */
    var unit = box(0.9, 1.5, 0.7, lam(0x101c38), 6.0, 0, -4.4, true);
    var leds = [];
    for (var ul = 0; ul < 4; ul++){ var led = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.05), new THREE.MeshBasicMaterial({ color: C.data, transparent: true, opacity: 0.8 })); led.position.set(0, 0.3 - ul * 0.18, 0.36); unit.add(led); leds.push(led); }
    var sc = document.createElement('canvas'); sc.width = 512; sc.height = 300; var sctx = sc.getContext('2d'), stex = new THREE.CanvasTexture(sc);
    box(0.08, 1.6, 0.08, C.steelDark, 8.2, 0, -5.0);
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.94), new THREE.MeshBasicMaterial({ map: stex })); screen.position.set(8.2, 2.05, -4.92); H.scene.add(screen);
    box(1.7, 1.04, 0.06, lam(0x1a2130), 8.2, 1.53, -4.98);
    function drawScreen(){
      var c = sctx; c.fillStyle = '#0b1424'; c.fillRect(0, 0, 512, 300);
      c.fillStyle = '#8ea6ff'; c.font = '600 22px Inter, sans-serif'; c.fillText('MACHINE HEALTH  ·  LINE 2', 24, 40);
      var rows = [['Filler drive motor', M.filler.s.health], ['Air compressor 2', M.comp.s.health], ['Capper motor', 95], ['Conveyor drive 1', 97], ['Conveyor drive 2', 96]];
      rows.sort(function(a, b){ return a[1] - b[1]; });
      rows.forEach(function(r, i){
        var y = 84 + i * 44, col = r[1] >= 85 ? '#3ddc97' : r[1] >= 60 ? '#ffb547' : '#ff5a4e';
        c.fillStyle = '#eef1f6'; c.font = '600 22px Inter, sans-serif'; c.fillText(r[0], 24, y);
        c.fillStyle = '#13203a'; c.fillRect(300, y - 18, 140, 16);
        c.fillStyle = col; c.fillRect(300, y - 18, 140 * r[1] / 100, 16);
        c.fillStyle = '#eef1f6'; c.font = '600 20px "JetBrains Mono", monospace'; c.fillText(String(r[1]), 452, y - 2);
      });
      stex.needsUpdate = true;
    }
    drawScreen();

    /* people */
    var tech = H.person(7.2, -3.2, -0.6, 0xff9f2e);
    var op = H.person(-10.2, -2.4, 0.4);
    var techHome = new THREE.Vector3(7.2, 0.02, -3.2), techJob = new THREE.Vector3(-11.6, 0.02, 3.9);

    /* bottles riding the line */
    var bottles = [], bGlass = lam(0xcfe3ff, 0.38), bLiquid = lam(C.lemon), bCap = lam(0xf2f4f8);
    for (var bi = 0; bi < 24; bi++){
      var bg = new THREE.Group();
      var liq = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.56, 12), bLiquid); liq.position.y = 0.3; bg.add(liq);
      var gl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.78, 14), bGlass); gl.position.y = 0.39; bg.add(gl);
      var cp = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.1, 10), bCap); cp.position.y = 0.98; bg.add(cp);
      bg.position.set(-11 + bi * 1.15, BELT_Y, 0); H.scene.add(bg); bottles.push(bg);
    }

    /* labels */
    [['Filler', -13, 3.4, 0], ['Capper', -8.2, 2.8, 0], ['Labeller', -3.4, 2.4, 0], ['Conveyor drives', 5, 2.0, 1.3], ['Air compressors', -3.1, 2.6, -7.6], ['Case packer', X1 + 0.9, 2.7, 0]]
      .forEach(function(s){ H.label([0], 'station', s[0], s[1], s[2], s[3]); });
    var lFiller = H.label([1, 4], 'ok', '', -12.8, 1.9, 2.7);
    var lDrive = H.label([1], 'ok', 'Conveyor drive 2 · 2.0 mm/s', 8.5, 1.4, 1.35);
    var lComp = H.label([2], 'ok', '', -1.6, 2.3, -7.6);
    var lCapper = H.label([2], 'ok', 'Capper motor · 51 °C', -8.2, 2.3, -1.6);
    var lGauge = H.label([3], 'ok', '', GX, 2.25, GZ);
    var lTech = H.label([4], 'warn', 'Planned job · bearing check in Sunday window', -11.6, 2.6, 3.9);
    H.label([5], '', 'On-site AI unit · readings stay on site', 6.0, 2.1, -4.4);
    H.label([5], '', 'Maintenance screen · machines ranked by risk', 8.2, 2.85, -4.92);
    H.label([6], 'ok', 'Clip-on sensors · fitted in a maintenance window', -12.8, 1.9, 2.7);
    H.label([6], '', 'Phase 1: warnings only, no control of machines', 6.0, 2.1, -4.4);
    H.label([7], 'later', 'Later: energy use by machine', -3.1, 2.6, -7.6);
    H.label([7], 'later', 'Later: spare parts stock warnings', 8.2, 2.85, -4.92);
    H.label([7], 'later', 'Later: shift reports drafted for a person to check', -3.4, 2.4, 0);

    function setSensor(mat, ring, health, t){
      var col = health >= 85 ? C.ok : health >= 60 ? C.warn : C.alert;
      mat.color.setHex(col);
      if (ring){ ring.material.color.setHex(col); var p = (t * (health >= 85 ? 0.6 : 1.6)) % 1; ring.scale.setScalar(1 + p * 1.6); ring.material.opacity = 0.55 * (1 - p); }
    }
    var gaugeTimer = 0, gaugeFlash = 0, gaugeLow = false, gaugeStep = 0, scrTimer = 0;
    var steps = H.stepEls;
    var tmp = new THREE.Vector3();

    return {
      shots: [
        { p: [6, 17, 25], t: [-2, 0, -3] },
        { p: [-8.4, 3.4, 7.6], t: [-12.8, 0.8, 2.4] },
        { p: [3.0, 4.6, -1.0], t: [-2.2, 1.0, -7.4] },
        { p: [4.6, 2.9, -1.4], t: [GX, 1.5, GZ] },
        { p: [-7.6, 4.4, 8.6], t: [-12.2, 0.8, 2.8] },
        { p: [10.2, 7.4, 0.6], t: [6.8, 1.3, -4.6] },
        { p: [9.5, 7.2, 10.5], t: [-3, 1, -2] },
        { p: [-4, 14, 16], t: [-2, 0.5, -4] },
        { p: [16, 21, 24], t: [0, 0, -2] }
      ],
      update: function(dt, time, act, active){
        var f = M.filler.s, cs = M.comp.s;
        /* machines move */
        carousel.rotation.y -= dt * 0.9;
        capHead.rotation.y += dt * 6; reel.rotation.y += dt * 2.4;
        comp1.fan.rotation.y += dt * 9; comp2.fan.rotation.y += dt * 9;
        stripes.forEach(function(s){ s.position.x += 0.95 * dt; if (s.position.x > X1) s.position.x -= (X1 - X0); });
        bottles.forEach(function(b){ b.position.x += 0.95 * dt; if (b.position.x > X1 - 0.4) b.position.x -= 24 * 1.15; b.visible = b.position.x > -11.2; });
        leds.forEach(function(l, j){ l.material.opacity = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(time * 7 + j * 1.9)); });
        /* filler motor: vibration shake and heat */
        var shake = H.reduced ? 0 : Math.max(0, f.vib - 2.4) * 0.006;
        fMotor.body.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        fMotor.heat.material.opacity = Math.min(0.6, (f.temp - M.filler.temp[0]) / (M.filler.temp[1] - M.filler.temp[0]) * 0.55);
        setSensor(fMotor.puck, fMotor.ring, f.health, time);
        setSensor(cMotor.puck, cMotor.ring, 95, time);
        setSensor(d1.puck, d1.ring, 97, time + 0.3);
        setSensor(d2.puck, d2.ring, 96, time + 0.6);
        comp2.heat.material.opacity = Math.min(0.7, (cs.temp - M.comp.temp[0]) / (M.comp.temp[1] - M.comp.temp[0]) * 0.65);
        comp2.puck.color.setHex(cs.health >= 85 ? C.ok : cs.health >= 60 ? C.warn : C.alert);
        comp1.puck.color.setHex(C.ok);
        /* gauge read by the camera every few seconds */
        gaugeTimer -= dt;
        if (gaugeTimer <= 0){
          gaugeTimer = active === 3 ? 3.2 : 5;
          gaugeLow = active === 3 && Math.random() < 0.35;
          gaugeVal = gaugeLow ? 5.3 + Math.random() * 0.3 : 6.6 + Math.random() * 0.4;
          drawGauge(); gaugeFlash = 1; gaugeStep = 0;
        }
        gaugeFlash = Math.max(0, gaugeFlash - dt * 2.5);
        gflash.material.opacity = gaugeFlash * 0.9; beamMat.opacity = 0.05 + gaugeFlash * 0.2;
        var since = (active === 3 ? 3.2 : 5) - gaugeTimer;
        gaugeStep = since < 0.4 ? 0 : since < 0.9 ? 1 : since < 1.4 ? 2 : 3;
        if (active === 3) steps.forEach(function(el, j){ el.classList.toggle('on', j === gaugeStep); el.classList.toggle('fail', j === 3 && gaugeLow); });
        H.setLabel(lGauge, gaugeLow ? 'warn' : 'ok', 'Air main · ' + gaugeVal.toFixed(1) + ' bar · ' + (gaugeLow ? 'below 6.0, maintenance told' : 'in range'));
        /* live labels */
        var fb = f.health >= 85 ? 'ok' : f.health >= 60 ? 'warn' : 'alert';
        H.setLabel(lFiller, M.filler.done > 0 ? 'ok' : fb, M.filler.done > 0 ? 'Filler drive motor · serviced, back to normal' : 'Filler drive motor · ' + f.vib.toFixed(1) + ' mm/s · ' + Math.round(f.temp) + ' °C');
        var cb = cs.health >= 85 ? 'ok' : cs.health >= 60 ? 'warn' : 'alert';
        H.setLabel(lComp, M.comp.done > 0 ? 'ok' : cb, M.comp.done > 0 ? 'Air compressor 2 · serviced' : 'Air compressor 2 · ' + Math.round(cs.temp) + ' °C · ' + (cs.health >= 85 ? 'normal' : 'running hot'));
        lDrive.hide = false; lCapper.hide = false;
        /* technician walks to the filler motor for the planned job */
        tmp.copy(active === 4 ? techJob : techHome);
        var dx = tmp.x - tech.position.x, dz = tmp.z - tech.position.z, dist = Math.hypot(dx, dz);
        if (dist > 0.05){ var stepLen = Math.min(dist, dt * 3.2); tech.position.x += dx / dist * stepLen; tech.position.z += dz / dist * stepLen; tech.rotation.y = Math.atan2(dx, dz); }
        op.rotation.y = 0.4 + Math.sin(time * 0.5) * 0.3;
        scrTimer -= dt; if (scrTimer <= 0){ scrTimer = 1; drawScreen(); }
      }
    };
  }
});
})();
