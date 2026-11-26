(function(){
'use strict';
var CFG = /*CFG*/{};
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function(id){ return document.getElementById(id); };
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }

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
  sinceStop = 0;
}
railBtns.forEach(function(b){
  b.addEventListener('click', function(){
    var s = sections[+b.getAttribute('data-go')];
    s.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'start'});
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

/* ---------- floor plan ---------- */
var cv = $('floor'), ctx = cv.getContext('2d');
var W = 1600, H = 1000, scale = 1, ox = 0, oy = 0, dpr = 1;
function resize(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  var mobile = innerWidth < 760;
  var availW = mobile ? innerWidth : innerWidth * 0.66, left = mobile ? 0 : innerWidth * 0.34;
  scale = Math.min(availW / W, innerHeight / H) * (mobile ? 1.05 : 1.08);
  ox = left + (availW - W * scale) / 2;
  oy = (innerHeight - H * scale) / 2 + (mobile ? innerHeight * 0.12 : 20);
}
addEventListener('resize', resize);
resize();

var C = {bg:'#070D1A', floor:'#0B1424', grid:'#101C33', line:'#22324E', text:'#EEF1F6', muted:'#A9B5D0', cobalt:'#2350F5', soft:'#8EA6FF',
  ok:'#3DDC97', warn:'#FFB547', alert:'#FF5A4E', lemon:'#F5D54A', walk:'rgba(61,220,151,.5)'};
var LINE_Y = 430, AISLE_Y = 615, WALK_Y = 715, CROSS_X = 760;
var ST = CFG.stations; // 5 names
var stX = [400, 640, 880, 1120, 1360];
var MACH = CFG.shop;   // [{name, x, w}]
var GANTRY_X = stX[2];
var FOCUS = {0:[850,500,1], 1:[CROSS_X,AISLE_Y,1.9], 2:[GANTRY_X,LINE_Y,1.9], 3:[CFG.shop[0].x + CFG.shop[0].w / 2,220,2], 4:[700,200,1.6], 5:[850,500,1], 7:[stX[4],LINE_Y,1.9]};
var fz = {x:850, y:500, z:1};

function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function label(t, x, y, col, size, align){ ctx.fillStyle = col || C.muted; ctx.font = '600 ' + Math.round((size || 15) * 1.45) + 'px Inter, system-ui, sans-serif'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); }
function pill(t, x, y, kind){
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  var w = ctx.measureText(t).width + 44, col = kind === 'alert' ? C.alert : kind === 'warn' ? C.warn : kind === 'ok' ? C.ok : C.soft;
  rr(x - w / 2, y - 20, w, 40, 20); ctx.fillStyle = 'rgba(7,13,26,.92)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(x - w / 2 + 19, y, 6, 0, 7); ctx.fillStyle = col; ctx.fill();
  ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x + 10, y + 1);
}

function van(x, y, stage, t){
  ctx.save(); ctx.translate(x, y);
  // chassis
  ctx.strokeStyle = '#5B6B8C'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-95, 0); ctx.lineTo(95, 0); ctx.moveTo(95, 0); ctx.lineTo(125, 0); ctx.stroke();
  ctx.fillStyle = '#2A3A5A'; [-40, -15].forEach(function(dx){ rr(dx - 10, -40, 20, 80, 5); ctx.fill(); });
  if (stage >= 1){ rr(-95, -34, 190, 68, 8); ctx.fillStyle = '#1B2A47'; ctx.fill(); ctx.strokeStyle = '#3B4E75'; ctx.lineWidth = 2; ctx.stroke(); }
  if (stage >= 2){ rr(-95, -34, 190, 68, 8); ctx.fillStyle = '#D7DEEA'; ctx.fill(); ctx.strokeStyle = '#8F9CB5'; ctx.stroke();
    ctx.fillStyle = '#B9C4D8'; rr(-60, -22, 60, 44, 6); ctx.fill(); }
  if (stage >= 3){ ctx.fillStyle = '#2350F5'; ctx.fillRect(-95, 24, 190, 6); ctx.fillStyle = '#5E7BFF'; ctx.fillRect(-95, -30, 190, 4); }
  if (stage >= 4){ ctx.fillStyle = '#9AB0D6'; rr(30, -22, 40, 16, 3); ctx.fill(); rr(30, 6, 40, 16, 3); ctx.fill(); }
  ctx.restore();
}
function person(x, y, vest, glasses, alert){
  ctx.save(); ctx.translate(x, y);
  if (alert){ ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.strokeStyle = alert; ctx.lineWidth = 2.5; ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, 7); ctx.fillStyle = vest ? '#F5D54A' : '#6C7A96'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, 7); ctx.fillStyle = '#E9C9A8'; ctx.fill();
  if (glasses){ ctx.fillStyle = '#1A2235'; ctx.fillRect(-5, -2, 10, 3); }
  ctx.restore();
}
function forklift(x, y, dir, alert){
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  if (alert){ ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.fillStyle = 'rgba(255,90,78,.12)'; ctx.fill(); ctx.strokeStyle = C.alert; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
  rr(-34, -20, 52, 40, 6); ctx.fillStyle = '#F5A524'; ctx.fill();
  rr(-26, -13, 22, 26, 4); ctx.fillStyle = '#1A2235'; ctx.fill();
  ctx.fillStyle = '#8F9CB5'; ctx.fillRect(18, -16, 6, 32); ctx.fillRect(24, -12, 30, 5); ctx.fillRect(24, 7, 30, 5);
  ctx.restore();
}
function camera(x, y, ang, spread, len, on){
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, len, ang - spread, ang + spread); ctx.closePath();
  var g = ctx.createRadialGradient(0, 0, 0, 0, 0, len);
  g.addColorStop(0, on ? 'rgba(142,166,255,.28)' : 'rgba(142,166,255,.08)'); g.addColorStop(1, 'rgba(142,166,255,0)');
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fillStyle = on ? C.cobalt : '#2A3A5A'; ctx.fill(); ctx.strokeStyle = C.soft; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}

/* simple timeline helpers */
var t = 0, sinceStop = 0, last = performance.now(), fired = {};
function once(key){ if (fired[key]) return false; fired[key] = true; return true; }

function draw(dt){
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
  var sc = scale, tx = ox, ty = oy;
  if (innerWidth < 760){
    var f = FOCUS[stop] || [W / 2, H / 2, 1];
    fz.x += (f[0] - fz.x) * 0.06; fz.y += (f[1] - fz.y) * 0.06; fz.z += (f[2] - fz.z) * 0.06;
    sc = innerWidth / W * fz.z;
    tx = innerWidth / 2 - fz.x * sc; ty = innerHeight * 0.56 - fz.y * sc;
  }
  ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * tx, dpr * ty);

  // building
  rr(180, 80, 1340, 840, 18); ctx.fillStyle = C.floor; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
  for (var gx = 220; gx < 1520; gx += 60){ ctx.beginPath(); ctx.moveTo(gx, 82); ctx.lineTo(gx, 918); ctx.stroke(); }
  for (var gy = 120; gy < 920; gy += 60){ ctx.beginPath(); ctx.moveTo(182, gy); ctx.lineTo(1518, gy); ctx.stroke(); }

  // machine shop
  label(CFG.shopLabel, 200, 112, C.muted, 14, 'left');
  MACH.forEach(function(m, i){
    var warn = stop === 4 && m.warn;
    rr(m.x, 140, m.w, 110, 10); ctx.fillStyle = '#13203A'; ctx.fill(); ctx.strokeStyle = warn ? C.warn : C.line; ctx.lineWidth = warn ? 3 : 2; ctx.stroke();
    label(m.name, m.x + m.w / 2, 195, C.text, 15);
    if (stop === 4){
      var hc = m.warn ? C.warn : C.ok;
      ctx.beginPath(); ctx.arc(m.x + m.w - 18, 158, 7, 0, 7); ctx.fillStyle = hc; ctx.fill();
      if (m.warn){ ctx.beginPath(); ctx.arc(m.x + m.w - 18, 158, 12 + 5 * Math.sin(t * 5), 0, 7); ctx.strokeStyle = C.warn; ctx.lineWidth = 2; ctx.stroke(); }
    }
  });
  // exclusion box around the panel saw (PPE area)
  var saw = MACH[0];
  if (stop === 3){ ctx.setLineDash([8, 6]); rr(saw.x - 14, 128, saw.w + 28, 168, 12); ctx.strokeStyle = C.lemon; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); label('Glasses and hearing protection zone', saw.x + saw.w / 2, 312, C.lemon, 13); }

  // assembly line
  label(CFG.lineLabel, 200, 312, C.muted, 14, 'left');
  ctx.fillStyle = '#0E1A30'; ctx.fillRect(260, LINE_Y - 60, 1220, 120);
  ctx.strokeStyle = '#1D2C49'; ctx.lineWidth = 2; ctx.strokeRect(260, LINE_Y - 60, 1220, 120);
  ST.forEach(function(n, i){
    ctx.strokeStyle = '#22324E'; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(stX[i] + 120, LINE_Y - 60); ctx.lineTo(stX[i] + 120, LINE_Y + 60); ctx.stroke(); ctx.setLineDash([]);
    var later = i === 4 && stop === 7;
    label(n, stX[i], LINE_Y - 78, later ? C.lemon : C.muted, 13);
  });
  // vans indexing along the line
  var cyc = 7, phase = (t % cyc) / cyc, k = Math.floor(t / cyc);
  var move = phase > 0.8 ? (phase - 0.8) / 0.2 : 0, ease = move * move * (3 - 2 * move);
  for (var i = -1; i < 5; i++){
    var x = (i >= 0 ? stX[i] : 160) + ease * 240;
    var stage = i + (ease > 0.5 ? 1 : 0);
    if (x < 260 || x > 1500) continue;
    van(x, LINE_Y, Math.max(0, i), t);
  }
  // finished van check (next step)
  if (stop === 7){
    var ex = stX[4];
    ctx.setLineDash([8, 6]); rr(ex - 120, LINE_Y - 64, 240, 128, 12); ctx.strokeStyle = C.lemon; ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
    camera(ex, LINE_Y - 110, Math.PI / 2, 0.55, 150, true);
    pill('Next step: finished van check', ex, LINE_Y + 92, 'warn');
  }

  // gantry over station 3
  var gOn = stop === 2;
  ctx.strokeStyle = '#F5D54A'; ctx.lineWidth = 4; ctx.globalAlpha = .8;
  ctx.beginPath(); ctx.moveTo(GANTRY_X - 110, LINE_Y - 95); ctx.lineTo(GANTRY_X - 110, LINE_Y + 95); ctx.moveTo(GANTRY_X + 110, LINE_Y - 95); ctx.lineTo(GANTRY_X + 110, LINE_Y + 95); ctx.stroke();
  ctx.globalAlpha = 1;
  var hoistY = LINE_Y + Math.sin(t * 0.8) * 50;
  ctx.fillStyle = '#F5D54A'; ctx.fillRect(GANTRY_X - 110, hoistY - 5, 220, 10);
  rr(GANTRY_X - 26, hoistY - 18, 52, 36, 6); ctx.fillStyle = '#C9A93A'; ctx.fill();
  if (gOn){
    ctx.save(); ctx.beginPath(); ctx.rect(GANTRY_X - 110, LINE_Y - 95, 220, 190); ctx.clip();
    ctx.strokeStyle = 'rgba(255,90,78,.35)'; ctx.lineWidth = 6;
    for (var s = -300; s < 300; s += 26){ ctx.beginPath(); ctx.moveTo(GANTRY_X + s, LINE_Y - 95); ctx.lineTo(GANTRY_X + s + 190, LINE_Y + 95); ctx.stroke(); }
    ctx.restore();
    label('Exclusion zone while the load moves', GANTRY_X, LINE_Y - 112, C.alert, 13);
  }

  // forklift aisle and pedestrian walkway
  ctx.fillStyle = '#0D182C'; ctx.fillRect(200, AISLE_Y - 45, 1300, 90);
  ctx.strokeStyle = '#F5D54A'; ctx.lineWidth = 2; ctx.setLineDash([18, 12]);
  ctx.beginPath(); ctx.moveTo(200, AISLE_Y - 45); ctx.lineTo(1500, AISLE_Y - 45); ctx.moveTo(200, AISLE_Y + 45); ctx.lineTo(1500, AISLE_Y + 45); ctx.stroke(); ctx.setLineDash([]);
  label('Forklift aisle', 210, AISLE_Y - 62, C.muted, 13, 'left');
  ctx.strokeStyle = C.walk; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(200, WALK_Y - 22); ctx.lineTo(1500, WALK_Y - 22); ctx.moveTo(200, WALK_Y + 22); ctx.lineTo(1500, WALK_Y + 22); ctx.stroke();
  label('Pedestrian walkway', 210, WALK_Y + 40, C.muted, 13, 'left');
  // zebra crossing
  ctx.fillStyle = 'rgba(238,241,246,.18)';
  for (var zy = AISLE_Y - 42; zy < AISLE_Y + 42; zy += 14) ctx.fillRect(CROSS_X - 32, zy, 64, 8);

  // dispatch yard
  label(CFG.yardLabel, 200, 800, C.muted, 14, 'left');
  for (var b = 0; b < 4; b++){ rr(320 + b * 300, 820, 220, 70, 8); ctx.fillStyle = '#101C33'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke(); }

  // forklift: back and forth along the aisle
  var fc = 16, fp = (t % fc) / fc, fdir = fp < 0.5 ? 1 : -1;
  var fx = fp < 0.5 ? 280 + fp * 2 * 1140 : 1420 - (fp - 0.5) * 2 * 1140;
  // pedestrian crossing timed to meet the forklift going right
  var cross = (fp > 0.1 && fp < 0.34) ? (fp - 0.1) / 0.24 : -1;
  var px = CROSS_X, py = cross >= 0 ? WALK_Y - cross * (WALK_Y - LINE_Y - 90) : WALK_Y;
  var dist = Math.hypot(fx - px, AISLE_Y - py);
  var near = cross >= 0 && dist < 120 && py < AISLE_Y + 50 && py > AISLE_Y - 60;
  var showNear = (stop === 1 || stop === 5) && near;
  forklift(fx, AISLE_Y, fdir, showNear);
  if (stop === 1 && near && once('near' + Math.floor(t / fc))){ push('alert', 'Near miss: forklift and person', CFG.nearWhere, 'near'); }
  if (showNear) pill('Near miss · ' + Math.round(dist / 40 * 10) / 10 + ' m', fx, AISLE_Y - 92, 'alert');

  // walkers on the walkway
  for (var w = 0; w < 3; w++){
    var wx = 260 + ((t * 38 + w * 430) % 1220);
    person(wx, WALK_Y + (w % 2 ? 8 : -8), true, true);
  }
  // crossing person
  person(px, py, true, true, showNear ? C.alert : null);

  // zone entry: person steps under the gantry while the hoist moves
  var zc = 12, zp = (t % zc) / zc;
  var zx = GANTRY_X + 150 - (zp < 0.5 ? zp * 2 : (1 - zp) * 2) * 170, zy = LINE_Y + 72;
  var inZone = zx < GANTRY_X + 110 && zx > GANTRY_X - 110;
  person(zx, zy, true, true, stop === 2 && inZone ? C.alert : null);
  if (stop === 2 && inZone){ pill('Person in zone · hoist moving', GANTRY_X, LINE_Y + 122, 'alert'); if (once('zone' + Math.floor(t / zc))) push('alert', 'Person under moving load', CFG.zoneWhere, 'zone'); }

  // PPE: operator at the saw without glasses
  var ppeBad = (Math.floor(t / 5) % 2) === 0;
  var sx = saw.x + saw.w / 2 + Math.sin(t * 0.7) * 30;
  person(sx, 272, true, !ppeBad, stop === 3 && ppeBad ? C.warn : null);
  if (stop === 3 && ppeBad){ pill('No safety glasses', sx, 230, 'warn'); if (once('ppe' + Math.floor(t / 10))) push('warn', 'No safety glasses', CFG.ppeWhere, 'ppe'); }
  // another operator near the router
  person(MACH[1].x + MACH[1].w / 2, 272, true, true);

  // machine alert
  if (stop === 4){
    var wm = MACH.filter(function(m){ return m.warn; })[0];
    if (wm){ pill(CFG.machPill, wm.x + wm.w / 2, 112, 'warn'); if (once('mach' + Math.floor(t / 20))) push('warn', CFG.machFeed, wm.name, null); }
  }

  // heat spots for the report
  if (stop === 5){
    [[CROSS_X, AISLE_Y, 1], [GANTRY_X, LINE_Y + 60, .7], [saw.x + saw.w / 2, 260, .55], [1300, 850, .4]].forEach(function(h){
      var g = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 130 * h[2]);
      g.addColorStop(0, 'rgba(255,90,78,' + (.5 * h[2]) + ')'); g.addColorStop(1, 'rgba(255,90,78,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h[0], h[1], 130 * h[2], 0, 7); ctx.fill();
    });
  }

  // cameras
  var cams = [
    [CROSS_X, AISLE_Y + 120, -Math.PI / 2, 0.75, 220, stop === 1 || stop === 5],
    [GANTRY_X + 190, LINE_Y - 120, Math.PI * 0.75, 0.6, 250, stop === 2],
    [saw.x + saw.w + 50, 300, -Math.PI * 0.85, 0.6, 200, stop === 3],
    [1440, AISLE_Y + 100, Math.PI, 0.5, 260, stop === 1],
    [700, 790, -Math.PI / 2, 0.6, 160, false]
  ];
  cams.forEach(function(c){ camera(c[0], c[1], c[2], c[3], c[4], c[5]); });
}

/* idle trickle so the feed is never empty */
var idle = 0;
function frame(now){
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!reduced){ t += dt; clock += dt * 6; }
  sinceStop += dt; idle += dt;
  if (idle > 9 && stop >= 1 && stop <= 5){ idle = 0; push('ok', 'Walkway clear', CFG.okWhere, null); }
  draw(dt);
  requestAnimationFrame(frame);
}
if (reduced) t = 3.4;
push('ok', 'Cameras online', CFG.okWhere, null);
changed(); onScroll();
requestAnimationFrame(frame);

/* ---------- trial form ---------- */
var form = $('trial-form');
form.addEventListener('submit', function(e){
  e.preventDefault();
  var st = $('t-status'), name = $('t-name').value.trim(), email = $('t-email').value.trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ st.className = 'status err'; st.textContent = 'Please add your name and a work email.'; return; }
  var first = name.split(' ')[0];
  /*SEND*/
  st.className = 'status ok'; st.textContent = 'This is a preview. On the live page this sends your details to Vantory.';
});
})();
