// See where your power goes: plant floor seen from above, each area coloured by live kW,
// a cold room door left open, compressors left running after hours, and a live energy meter.
// Runs on assets/sol-core.js.
(function(){
'use strict';
var $ = function(id){ return document.getElementById(id); };

/* ---------- simulated day: 24 hours pass in about 80 seconds ---------- */
var DAY_SECONDS = 80;
var hour = 9.5;
var door = { open: false, t: 0, timer: 10 };
var AREAS = [
  { key: 'proc', name: 'Processing',  x: -14, z: -5, w: 11, d: 9 },
  { key: 'fill', name: 'Filling line', x: -1.5, z: -5, w: 13, d: 9 },
  { key: 'cold', name: 'Cold rooms',  x: 11, z: -5, w: 9, d: 9 },
  { key: 'ware', name: 'Warehouse',   x: -14, z: 6, w: 11, d: 9 },
  { key: 'office', name: 'Office',    x: -1.5, z: 6, w: 13, d: 9 },
  { key: 'air', name: 'Compressed air', x: 11, z: 6, w: 9, d: 9 }
];
function prod(h){
  if (h < 5.5 || h >= 18.5) return 0;
  if (h < 6.5) return h - 5.5;
  if (h >= 17.5) return 18.5 - h;
  return 1;
}
function officeOn(h){ return h >= 7 && h < 17.5 ? 1 : 0; }
// normal day per area, in kW
function normal(key, h){
  var p = prod(h);
  switch (key){
    case 'proc': return 18 + 92 * p;
    case 'fill': return 10 + 128 * p;
    case 'cold': return 78 + 6 * Math.sin(h / 24 * Math.PI * 2 - 1.2);
    case 'ware': return 6 + 22 * p;
    case 'office': return 3 + 15 * officeOn(h);
    case 'air': return 6 + 74 * p;
  }
  return 0;
}
// today: the same, plus the door left open and compressors left running after hours
function today(key, h){
  var v = normal(key, h);
  if (key === 'cold' && door.open) v += 13 * Math.min(1, door.t / 2);
  if (key === 'air' && prod(h) < 0.5) v += 26;
  return v;
}
function total(fn, h){ return AREAS.reduce(function(s, a){ return s + fn(a.key, h); }, 0); }
var NORMAL_CURVE = [], TODAY_CURVE = [];
for (var i = 0; i <= 96; i++){ NORMAL_CURVE.push(total(normal, i / 4)); }
function hh(h){ var H = Math.floor(h) % 24, m = Math.floor((h % 1) * 60); var ap = H >= 12 ? 'pm' : 'am'; var h12 = H % 12 || 12; return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap; }

/* ---------- live meter card ---------- */
var trend = $('w-trend'), tx = trend.getContext('2d');
var lastAlert = '', alertKind = 'ok';
function drawCard(H){
  var W = trend.width, Ht = trend.height;
  tx.fillStyle = '#05080f'; tx.fillRect(0, 0, W, Ht);
  var max = 560;
  function y(v){ return Ht - 14 - v / max * (Ht - 30); }
  tx.strokeStyle = 'rgba(142,166,255,.12)'; tx.lineWidth = 1;
  [6, 12, 18].forEach(function(h){ var x = h / 24 * W; tx.beginPath(); tx.moveTo(x, 8); tx.lineTo(x, Ht - 14); tx.stroke(); });
  tx.fillStyle = '#A9B5D0'; tx.font = '500 16px Inter, sans-serif';
  ['6am', 'noon', '6pm'].forEach(function(s, k){ tx.fillText(s, (k + 1) * 6 / 24 * W + 4, Ht - 2); });
  // normal day
  tx.setLineDash([7, 6]); tx.strokeStyle = 'rgba(169,181,208,.7)'; tx.lineWidth = 2.5; tx.beginPath();
  NORMAL_CURVE.forEach(function(v, k){ var x = k / 96 * W; if (k) tx.lineTo(x, y(v)); else tx.moveTo(x, y(v)); }); tx.stroke(); tx.setLineDash([]);
  // today so far
  tx.strokeStyle = '#8EA6FF'; tx.lineWidth = 3.2; tx.beginPath();
  TODAY_CURVE.forEach(function(p, k){ var x = p[0] / 24 * W; if (k) tx.lineTo(x, y(p[1])); else tx.moveTo(x, y(p[1])); }); tx.stroke();
  var nx = hour / 24 * W, nowV = total(today, hour);
  tx.fillStyle = '#fff'; tx.beginPath(); tx.arc(nx, y(nowV), 6, 0, 7); tx.fill();
  $('w-kw').textContent = Math.round(nowV);
  $('w-time').textContent = hh(hour);
  var nv = total(normal, hour), diff = Math.round((nowV - nv) / nv * 100);
  $('w-vs').textContent = Math.abs(diff) < 2 ? 'In line with a normal day' : Math.abs(diff) + '% ' + (diff > 0 ? 'above' : 'below') + ' a normal day';
  $('w-areas').innerHTML = H.bars(AREAS.map(function(a){
    var v = today(a.key, hour), over = v > normal(a.key, hour) * 1.12 + 3;
    return [a.name, v, over ? '#FFB547' : null];
  }), false, ' kW');
  var al = $('w-alert'), st = $('w-status');
  var msg = '', kind = 'pass', chip = 'Normal';
  if (door.open && door.t > 1.5){ msg = 'Cold room 2 door open ' + Math.round(door.t * 1.5) + ' min · +' + Math.round(13 * Math.min(1, door.t / 2)) + ' kW. Supervisor notified.'; kind = 'fail'; chip = 'Alert'; }
  else if (prod(hour) < 0.5){ msg = 'Compressors drawing ' + Math.round(today('air', hour)) + ' kW at ' + hh(hour) + ' with the line stopped. Check for leaks or a unit left on.'; kind = 'warn'; chip = 'After hours'; }
  else { msg = 'No alerts. Use by area is within its normal range.'; }
  al.textContent = msg; al.className = 'reason ' + (kind === 'pass' ? '' : kind === 'fail' ? 'bad' : 'warn');
  st.textContent = chip; st.className = 'fb-chip ' + kind;
}
var cardTimer = 0, curveTimer = 0, H0 = null;
var STOP_HOURS = { 1: 10.5, 2: 13.5, 3: 22.5, 4: 7.5, 5: 15 };
function tick(dt, time, active){
  var prevHour = hour;
  hour += dt * 24 / DAY_SECONDS;
  if (hour >= 24){ hour -= 24; TODAY_CURVE = []; }
  if (hour < prevHour) TODAY_CURVE = [];
  /* cold room door: opens now and then, more often while that stop is on screen */
  if (door.open && prod(hour) < 0.5){ door.open = false; door.t = 0; }
  if (door.open){ door.t += dt; if (door.t > (active === 1 ? 7 : 5)){ door.open = false; door.t = 0; door.timer = active === 1 ? 4 : 18; } }
  else { door.timer -= dt; if (door.timer <= 0 && prod(hour) > 0.5){ door.open = true; door.t = 0; } }
  curveTimer -= dt;
  if (curveTimer <= 0){ curveTimer = 0.25; TODAY_CURVE.push([hour, total(today, hour)]); }
  cardTimer -= dt;
  if (cardTimer <= 0 && H0){ cardTimer = 0.25; drawCard(H0); }
  if (active === 4 && H0){
    stepT = (stepT + dt) % 4;
    var on = Math.floor(stepT);
    H0.stepEls.forEach(function(el, j){ el.classList.toggle('on', j === on); el.classList.toggle('done', j < on); });
  }
}
function jumpTo(h){
  hour = h; TODAY_CURVE = [];
  for (var k = 0; k <= Math.floor(h * 4); k++){ TODAY_CURVE.push([k / 4, total(today, k / 4)]); }
}
jumpTo(hour);

function drawReport(H){
  var tot = 0, norm = 0, after = 0;
  var week = AREAS.map(function(a){
    var s = 0;
    for (var k = 0; k < 96; k++){ var h = k / 4, v = today(a.key, h) / 4; s += v; norm += normal(a.key, h) / 4; if (prod(h) < 0.5) after += v; }
    tot += s; return [a.name, s * 7];
  });
  $('rp-kwh').textContent = Math.round(tot * 7).toLocaleString('en-AU');
  var d = Math.round((tot - norm) / norm * 100);
  $('rp-vs').textContent = (d > 0 ? '+' : '') + d + '%';
  $('rp-after').textContent = Math.round(after / tot * 100) + '%';
  $('rp-bars').innerHTML = H.bars(week, false, ' kWh');
}
var stepT = 0;

SolPage({
  fog: 0.006,
  widgetStops: [1, 2, 3, 4, 5],
  tick: tick,
  onStop: function(i, H){
    H0 = H;
    if (STOP_HOURS[i] !== undefined) jumpTo(STOP_HOURS[i]);
    door.open = false; door.t = 0; door.timer = i === 1 ? 1.5 : 18;
    if (i === 5) drawReport(H);
  },
  calc: {
    inputs: ['c-bill', 'c-share', 'c-after', 'c-price', 'c-meter', 'c-rate'],
    parts: function(v){
      return [
        ['Refrigeration and air', v['c-bill'] * Math.min(v['c-share'], 100) / 100 * 0.08],
        ['After-hours load', v['c-after'] * 12 * 365 * v['c-price'] * 0.5],
        ['Meter reading', v['c-meter'] * 12 * v['c-rate']]
      ];
    }
  },
  build: function(H){
    H0 = H;
    var THREE = window.THREE, C = H.C, box = H.box, cyl = H.cyl, lam = H.lam;
    H.floor(44, 30, -1.5, 0.5);
    H.wall(-20, -10, 16, -10, 1.2); H.wall(-20, -10, -20, 11, 1.2); H.wall(-20, 11, 16, 11, 1.2); H.wall(16, -10, 16, 11, 1.2);
    H.wall(-20, 0.5, 16, 0.5, 0.6); H.wall(-8.5, -10, -8.5, 11, 0.6); H.wall(5.5, -10, 5.5, 11, 0.6);

    /* area tiles and kW columns */
    var cLow = new THREE.Color(0x1b3a7a), cMid = new THREE.Color(0x2fa37a), cHigh = new THREE.Color(0xffb547), cHot = new THREE.Color(0xff5a4e);
    function heat(t){ var c = new THREE.Color(); if (t < 0.4) c.copy(cLow).lerp(cMid, t / 0.4); else if (t < 0.75) c.copy(cMid).lerp(cHigh, (t - 0.4) / 0.35); else c.copy(cHigh).lerp(cHot, Math.min(1, (t - 0.75) / 0.25)); return c; }
    AREAS.forEach(function(a){
      var mat = new THREE.MeshBasicMaterial({ color: 0x1b3a7a, transparent: true, opacity: 0.38, depthWrite: false });
      var tile = new THREE.Mesh(new THREE.PlaneGeometry(a.w - 0.6, a.d - 0.6), mat); tile.rotation.x = -Math.PI / 2; tile.position.set(a.x, 0.03, a.z); H.scene.add(tile);
      var colMat = new THREE.MeshLambertMaterial({ color: 0x2fa37a, transparent: true, opacity: 0.85 });
      var col = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1, 0.9), colMat); col.position.set(a.x + a.w / 2 - 1.3, 0.5, a.z - a.d / 2 + 1.3); H.scene.add(col);
      a.tile = mat; a.col = col; a.colMat = colMat;
      a.label = H.label([0, 6], 'station', a.name, a.x, 1.4, a.z);
    });
    /* processing tanks */
    [[-17, -7.5], [-14.4, -7.5], [-17, -4.6]].forEach(function(p){ cyl(1.0, 2.6, C.steel, p[0], 0.4, p[1], 24); });
    box(3, 1.2, 1.6, C.steel, -12.2, 0, -3, true);
    /* filling line */
    box(11, 0.18, 0.9, C.belt, -1.5, 0.7, -5, 'faint');
    var fill = cyl(1.3, 0.9, C.steelDark, -5.6, 0, -5, 28);
    box(1.4, 1.1, 1.2, C.steel, -2.4, 0, -6.2, true); box(1.8, 1.2, 1.2, C.steel, 0.6, 0, -6.2, true);
    box(1.8, 1.8, 2.0, C.steel, 3.6, 0, -5, true);
    var bottles = [];
    for (var b = 0; b < 12; b++){ var bt = cyl(0.17, 0.6, lam(0xcfe3ff, 0.5), -6 + b * 0.85, 0.88, -5, 10); bottles.push(bt); }
    /* cold rooms: two insulated boxes, room 2 has the door that gets left open */
    box(3.6, 2.8, 7.4, lam(0x3a6ea8, 0.28), 8.6, 0, -5, true);
    box(3.6, 2.8, 7.4, lam(0x3a6ea8, 0.28), 13.0, 0, -5, true);
    var doorPivot = new THREE.Group(); doorPivot.position.set(11.2, 0, -1.25); H.scene.add(doorPivot);
    var doorMesh = box(1.6, 2.3, 0.12, lam(0xdfe7ff), 0.8, 0, 0, true, doorPivot);
    var coldFog = H.glow('rgba(150,210,255,1)', 3.4, 12.0, 0.8, -0.6);
    var coldUnits = [cyl(0.5, 0.25, C.steelDark, 8.6, 2.8, -5, 20), cyl(0.5, 0.25, C.steelDark, 13.0, 2.8, -5, 20)];
    /* warehouse racks */
    for (var r = 0; r < 3; r++){ box(8, 2.4, 0.9, lam(0x2a3654), -14, 0, 3.4 + r * 2.4, 'faint'); }
    /* office: desks and lights */
    for (var dk = 0; dk < 4; dk++){ box(1.6, 0.75, 0.9, lam(0x3a4766), -5.5 + dk * 2.6, 0, 6, 'faint'); }
    var officeGlow = H.glow('rgba(255,236,190,1)', 9, -1.5, 2.2, 6);
    /* compressed air: two compressors and a receiver tank */
    function compressor(x){
      var g = new THREE.Group(); g.position.set(x, 0, 6.5); H.scene.add(g);
      box(2.0, 1.5, 1.3, lam(0x2a3a5c), 0, 0, 0, true, g);
      var fan = new THREE.Group(); fan.position.set(0, 1.52, 0); g.add(fan);
      fan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 24), lam(0x111a2e)));
      for (var k = 0; k < 4; k++){ var bl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.12), lam(0x8090b0)); bl.rotation.y = k * Math.PI / 4; bl.position.y = 0.04; fan.add(bl); }
      return fan;
    }
    var fans = [compressor(8.6), compressor(11.4)];
    cyl(0.75, 2.4, lam(0x3b4f75), 14.2, 0.2, 7.5, 24);
    var airGlow = H.glow('rgba(255,181,71,1)', 5, 10, 1.4, 6.5);
    /* main switchboard with clip-on meters, and the on-site AI unit */
    var board = box(1.6, 2.2, 0.5, lam(0x1a2a4d), -19.2, 0, 1.6, true); board.rotation.y = Math.PI / 2;
    var meterLeds = [];
    for (var ml = 0; ml < 5; ml++){ var mled = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.1), new THREE.MeshBasicMaterial({ color: C.ok, transparent: true, opacity: 0.8 })); mled.position.set(-0.55 + ml * 0.27, 0.6, 0.26); board.add(mled); meterLeds.push(mled); }
    var unit = box(0.9, 1.5, 0.7, lam(0x101c38), -19.2, 0, -1.4, true);
    var leds = [];
    for (var ul = 0; ul < 4; ul++){ var led = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.05), new THREE.MeshBasicMaterial({ color: C.data, transparent: true, opacity: 0.8 })); led.position.set(0, 0.3 - ul * 0.18, 0.36); unit.add(led); leds.push(led); }
    /* data lines from each area to the switchboard */
    var pulses = [];
    AREAS.forEach(function(a, k){
      var pts = [new THREE.Vector3(a.x, 3.2, a.z), new THREE.Vector3((a.x - 19) / 2, 4.2, (a.z + 1.6) / 2), new THREE.Vector3(-19.2, 2.6, 1.6)];
      var curve = new THREE.CatmullRomCurve3(pts);
      var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.18 }));
      H.scene.add(line);
      var dot = H.glow('rgba(142,166,255,1)', 0.7, 0, 0, 0); dot.material.opacity = 0.9;
      pulses.push({ curve: curve, dot: dot, off: k / AREAS.length, line: line });
    });
    /* people */
    var ops = [H.person(-3, -2.8, 0.4), H.person(-13, -1.6, 2.2), H.person(-3, 4.6, 3.1)];
    var supervisor = H.person(7.4, 0.6, Math.PI * 0.75, 0xff9f2e);

    /* labels */
    var lDoor = H.label([1], 'ok', '', 11.6, 2.9, -0.8);
    var lCold = H.label([1], 'ok', '', 13, 3.6, -5);
    var lAir = H.label([2, 3], 'ok', '', 10, 2.6, 6.5);
    var lAfter = H.label([3], 'warn', '', -1.5, 2.6, -5);
    var lBoard = H.label([4], 'ok', 'Clip-on meters · read every minute', -19.2, 2.9, 1.6);
    H.label([5], '', 'On-site AI unit · data stays on site', -19.2, 2.1, -1.4);
    H.label([6], 'ok', 'Meters fitted at the main board by a licensed electrician', -19.2, 2.9, 1.6);
    H.label([6], '', 'Phase 1: alerts only, no control of equipment', -19.2, 2.1, -1.4);
    H.label([7], 'later', 'Later: motor health from the same meters', 10, 2.6, 6.5);
    H.label([7], 'later', 'Later: warnings before a demand peak', -1.5, 2.6, -5);
    H.label([7], 'later', 'Later: monthly energy report drafted for a person to check', -19.2, 2.1, -1.4);

    var dayBg = new THREE.Color(0x070d1a), nightBg = new THREE.Color(0x03060d);
    return {
      shots: [
        { p: [4, 36, 30], t: [-1.5, 0, 0.5] },
        { p: [6.5, 10.5, 10.0], t: [14.2, 0.2, -2.6] },
        { p: [16.5, 6.8, 15.5], t: [10.6, 0.8, 6.2] },
        { p: [6, 30, 29], t: [-1.5, 0, 0.5] },
        { p: [-12.6, 3.4, -1.6], t: [-19.2, 1.3, 0.8] },
        { p: [-11, 9, 12], t: [-17, 1.2, 0] },
        { p: [8, 32, 33], t: [-1.5, 0, 0.5] },
        { p: [-6, 33, 30], t: [-1.5, 0, 0.5] },
        { p: [14, 40, 36], t: [-1.5, 0, 0.5] }
      ],
      update: function(dt, time, act, active){
        var p = prod(hour), night = 1 - Math.min(1, Math.max(0, (hour < 12 ? hour - 5.5 : 19 - hour)));
        H.hemi.intensity = 1.0 - night * 0.45;
        H.scene.background.copy(dayBg).lerp(nightBg, night); H.scene.fog.color.copy(H.scene.background);
        AREAS.forEach(function(a){
          var v = today(a.key, hour), n = normal(a.key, hour);
          var t = Math.min(1, v / 150);
          var over = v > n * 1.12 + 3;
          a.tile.color.copy(over ? cHot : heat(t)); a.tile.opacity = 0.28 + t * 0.32 + (over ? 0.15 * (0.5 + 0.5 * Math.sin(time * 5)) : 0);
          var hgt = Math.max(0.2, v / 22);
          a.col.scale.y += (hgt - a.col.scale.y) * Math.min(1, dt * 4); a.col.position.y = a.col.scale.y / 2;
          a.colMat.color.copy(over ? cHot : heat(t));
          H.setLabel(a.label, 'station', a.name + ' · ' + Math.round(v) + ' kW');
        });
        /* machines run during production */
        fill.rotation.y -= dt * 0.9 * p;
        bottles.forEach(function(bt){ bt.position.x += dt * 0.9 * p; if (bt.position.x > 3) bt.position.x -= 10.2; });
        var airOn = Math.min(1, p + (p < 0.5 ? 0.6 : 0));
        fans.forEach(function(f){ f.rotation.y += dt * 10 * airOn; });
        airGlow.material.opacity = p < 0.5 ? 0.35 + 0.15 * Math.sin(time * 3) : 0.12;
        coldUnits.forEach(function(u, k){ u.rotation.y += dt * (2 + (door.open && k === 1 ? 6 : 0)); });
        officeGlow.material.opacity = officeOn(hour) * 0.25;
        /* door swing */
        var want = door.open ? -1.25 : 0;
        doorPivot.rotation.y += (want - doorPivot.rotation.y) * Math.min(1, dt * 3);
        coldFog.material.opacity = door.open ? Math.min(0.55, door.t * 0.25) : Math.max(0, coldFog.material.opacity - dt);
        supervisor.position.x += ((door.open && door.t > 2.5 ? 10.2 : 7.4) - supervisor.position.x) * Math.min(1, dt * 1.5);
        ops.forEach(function(o, k){ o.visible = p > 0.3 || k === 2 && officeOn(hour); o.rotation.y += Math.sin(time * 0.6 + k) * dt * 0.3; });
        leds.forEach(function(l, j){ l.material.opacity = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(time * 7 + j * 1.9)); });
        meterLeds.forEach(function(l, j){ l.material.opacity = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(time * 4 + j)); });
        pulses.forEach(function(pl){ var u = (time * 0.35 + pl.off) % 1; pl.curve.getPoint(u, pl.dot.position); var vis = Math.max(act[0] || 0, act[4] || 0, act[5] || 0); pl.dot.material.opacity = 0.9 * vis; pl.line.material.opacity = 0.05 + 0.2 * vis; });
        /* labels */
        H.setLabel(lDoor, door.open ? 'alert' : 'ok', door.open ? 'Cold room 2 door open · ' + Math.round(door.t * 1.5) + ' min' : 'Cold room 2 door closed');
        H.setLabel(lCold, 'ok', 'Refrigeration · ' + Math.round(today('cold', hour)) + ' kW');
        var airV = Math.round(today('air', hour));
        H.setLabel(lAir, p < 0.5 ? 'warn' : 'ok', p < 0.5 ? 'Compressors · ' + airV + ' kW with the line stopped' : 'Compressors · ' + airV + ' kW');
        H.setLabel(lAfter, p < 0.5 ? 'ok' : '', p < 0.5 ? 'Filling line off · ' + Math.round(today('fill', hour)) + ' kW standby' : 'Filling line · running');
        H.setLabel(lBoard, 'ok', 'Clip-on meters · ' + hh(hour));
      }
    };
  }
});
})();
