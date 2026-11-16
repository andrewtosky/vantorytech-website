// Shared engine for the solutions sub-pages (not used by food and beverage, which runs on fb-line.js).
// Scroll stops, stop rail, active panel, count-up numbers, bar rows, calculator, 3D scene setup,
// floating labels and the camera rig. Each page script calls SolPage({...}) with its own scene,
// live widget and calculator. Needs assets/vendor/three.r128.min.js loaded first.
(function(){
'use strict';
window.SolPage = function(cfg){
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function(n){ return '$' + Math.round(n).toLocaleString('en-AU'); };
  var num = function(n){ return Math.round(n).toLocaleString('en-AU'); };
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function smooth(t){ return t * t * (3 - 2 * t); }
  var $ = function(id){ return document.getElementById(id); };
  var H = { reduced: reduced, fmt: fmt, num: num, clamp: clamp, smooth: smooth, $: $ };

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
  function barsHTML(parts, money, unit){
    var max = Math.max.apply(null, parts.map(function(p){ return p[1]; })) || 1;
    return parts.map(function(p){
      var v = money ? fmt(p[1]) : num(p[1]) + (unit || '');
      return '<div class="row"><span>' + p[0] + '</span><span class="track"><span class="fill" style="width:' + (p[1] / max * 100).toFixed(1) + '%' + (p[2] ? ';background:' + p[2] : '') + '"></span></span><span class="val">' + v + '</span></div>';
    }).join('');
  }
  H.bars = barsHTML;

  /* ---------- calculator ---------- */
  function val(id){ var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
  if (cfg.calc){
    var runCalc = function(){
      var v = {}; cfg.calc.inputs.forEach(function(id){ v[id] = val(id); });
      var parts = cfg.calc.parts(v);
      $('r-total').textContent = fmt(parts.reduce(function(s, p){ return s + p[1]; }, 0));
      $('r-bars').innerHTML = barsHTML(parts, true);
    };
    cfg.calc.inputs.forEach(function(id){ $(id).addEventListener('input', runCalc); });
    $('roi').addEventListener('submit', function(e){ e.preventDefault(); });
    runCalc();
  }

  /* ---------- active stop ---------- */
  var widget = $('widget');
  var activeStop = -1;
  var stepEls = Array.prototype.slice.call(document.querySelectorAll('#steps li'));
  H.stepEls = stepEls;
  function setActive(i){
    activeStop = i;
    panels.forEach(function(p, j){ if (p) p.classList.toggle('is-active', j === i); });
    railBtns.forEach(function(b, j){ b.classList.toggle('on', j === i); if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    if (widget) widget.classList.toggle('off', cfg.widgetStops.indexOf(i) < 0);
    if (cfg.onStop) cfg.onStop(i, H);
    countUp(i);
  }
  H.active = function(){ return activeStop; };

  /* ---------- no WebGL: panels, widget and calculator still work ---------- */
  var canvas = $('scene'), renderer;
  try {
    if (!window.THREE) throw new Error('no three');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.documentElement.classList.add('no-webgl');
    measure();
    var fb = function(){ var a = Math.round(stopFloat()); if (a !== activeStop) setActive(a); };
    addEventListener('scroll', fb, { passive: true });
    addEventListener('resize', function(){ measure(); fb(); });
    fb();
    if (cfg.tick){
      var last = performance.now(), t = 0;
      (function loop(now){
        var dt = Math.min((now - last) / 1000, 0.05); last = now;
        if (!document.hidden){ t += dt * (reduced ? 0.35 : 1); cfg.tick(dt * (reduced ? 0.35 : 1), t, activeStop); }
        requestAnimationFrame(loop);
      })(last);
    }
    addEventListener('load', measure);
    return;
  }

  /* ---------- 3D scene ---------- */
  var narrow = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.5 : 2));
  var scene = new THREE.Scene();
  var BG = 0x070d1a;
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, cfg.fog || 0.011);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  var hemi = new THREE.HemisphereLight(0xdfe7ff, 0x0b1424, 1.0); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffffff, 0.55); sun.position.set(12, 30, 18); scene.add(sun);
  H.scene = scene; H.camera = camera; H.hemi = hemi; H.sun = sun;

  var C = { steel: 0xaeb9cc, steelDark: 0x7d8aa3, belt: 0x232d44, floor: 0x0f1a2f, wall: 0x1b2c50, edge: 0x8ea6ff, data: 0x6f9bff, ok: 0x3ddc97, warn: 0xffb547, alert: 0xff5a4e, lemon: 0xf5d54a };
  H.C = C;
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
  function glow(color, size, x, y, z, parent){
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(color, color.replace(/[\d.]+\)$/, '0)')), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.set(x, y, z); s.scale.set(size, size, 1); (parent || scene).add(s); return s;
  }
  function wall(x0, z0, x1, z1, h){
    var dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
    var m = box(L, h, 0.2, lam(C.wall, 0.35), (x0 + x1) / 2, 0, (z0 + z1) / 2, true);
    m.rotation.y = -Math.atan2(dz, dx); return m;
  }
  function person(x, z, ry, vest){
    var g = new THREE.Group(); g.position.set(x, 0.02, z); g.rotation.y = ry || 0;
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 1.1, 12), lam(vest || 0xf2f4f8)); body.position.y = 0.88; g.add(body);
    var legs = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 8), lam(0x2a3654)); legs.position.y = 0.18; g.add(legs);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), lam(0xd9b59a)); head.position.y = 1.62; g.add(head);
    var hat = new THREE.Mesh(new THREE.SphereGeometry(0.215, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xffffff)); hat.position.y = 1.64; g.add(hat);
    scene.add(g); g.userData.body = body; return g;
  }
  H.lam = lam; H.box = box; H.cyl = cyl; H.radialTex = radialTex; H.glow = glow; H.wall = wall; H.person = person;
  H.edgeMat = edgeMat; H.edgeFaint = edgeFaint;
  H.floor = function(w, d, x, z){
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), lam(0x0a1222)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    var hall = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lam(C.floor)); hall.rotation.x = -Math.PI / 2; hall.position.set(x, 0.01, z); scene.add(hall);
    var grid = new THREE.GridHelper(w, w, 0x1c2c4d, 0x142240); grid.scale.set(1, 1, d / w); grid.position.set(x, 0.02, z); scene.add(grid);
  };

  /* ---------- floating labels ---------- */
  var labelRoot = $('labels');
  var labels = [];
  function mkLabel(stops, cls){
    var el = document.createElement('div'); el.className = 'tag3d ' + (cls || ''); el.innerHTML = '<i></i><span></span>'; labelRoot.appendChild(el);
    var l = { el: el, txt: el.lastChild, stops: stops, pos: new THREE.Vector3(), state: cls || '', text: '', w: 0, manual: false };
    labels.push(l); return l;
  }
  function setLabel(l, state, text){ if (l.state !== state){ l.el.className = 'tag3d ' + state; l.state = state; } if (l.text !== text){ l.txt.textContent = text; l.text = text; l.w = 0; } }
  H.label = function(stops, cls, text, x, y, z){ var l = mkLabel(stops, cls); setLabel(l, cls || '', text || ''); l.pos.set(x || 0, y || 0, z || 0); return l; };
  H.setLabel = setLabel;

  var built = cfg.build(H);
  var shots = built.shots.map(function(s){ return { p: new THREE.Vector3().fromArray(s.p), t: new THREE.Vector3().fromArray(s.t) }; });
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
  var clock = new THREE.Clock(), time = 0, act = [];
  var proj = new THREE.Vector3();
  var blockers = [];
  var scrimEl = $('scrim');
  var heroIntro = sections[0].querySelector('.intro');
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
    if (active !== activeStop) setActive(active);

    if (cfg.tick) cfg.tick(dt * speed, time, activeStop);
    built.update(dt * speed, time, act, activeStop);

    blockers = [ (activeStop === 0 ? heroIntro : panels[activeStop]).getBoundingClientRect() ];
    if (widget && !widget.classList.contains('off')) blockers.push(widget.getBoundingClientRect());
    scrimEl.style.opacity = (0.35 + 0.65 * (act[0] || 0)).toFixed(2);
    labels.forEach(function(l){ placeLabel(l, l.hide ? 0 : labelAct(l)); });

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('load', measure);
};
})();
