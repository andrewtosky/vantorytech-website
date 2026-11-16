// Example full plan: the savings estimate. Same assumptions as the 3D preview's estimate.
(function () {
  'use strict';
  var form = document.getElementById('s-form');
  if (!form) return;
  var INVEST_LOW = 24200 + 9000 + 6000, INVEST_HIGH = 38900 + 14000 + 9000; // trial plus phase 2
  function v(id) { var n = parseFloat(document.getElementById(id).value); return isFinite(n) && n > 0 ? n : 0; }
  function money(n) { return 'A$' + Math.round(n).toLocaleString('en-AU'); }
  function k(n) { return Math.round(n / 1000) + 'k'; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function update() {
    var parts = [
      ['Faulty bottles reaching customers', v('s-packs') * v('s-days') * 0.0004 * v('s-esc')],
      ['Staff time freed from manual checks', v('s-hours') * v('s-rate') * 52 * 0.6],
      ['Lower recall risk', v('s-recall') * v('s-recalls') / 5 * 0.8],
      ['Fewer retailer penalties', v('s-pen') * 0.8]
    ];
    var total = parts.reduce(function (a, p) { return a + p[1]; }, 0);
    var lo = Math.round(total * 0.8 / 1000) * 1000, hi = Math.round(total * 1.2 / 1000) * 1000;
    document.getElementById('s-range').textContent = money(lo) + ' to ' + money(hi);
    var kpi = document.getElementById('kpi-save');
    if (kpi) kpi.textContent = 'A$' + k(lo) + '\u2013' + k(hi);
    var max = Math.max.apply(null, parts.map(function (p) { return p[1]; })) || 1;
    document.getElementById('s-bars').innerHTML = parts.map(function (p) {
      return '<li><span>' + esc(p[0]) + '</span><b>' + money(p[1]) + '</b><i style="width:' + Math.max(2, p[1] / max * 100).toFixed(1) + '%"></i></li>';
    }).join('');
    var pb = document.getElementById('s-payback');
    if (total > 0) {
      var a = Math.max(1, Math.round(INVEST_LOW / (hi / 12))), b = Math.round(INVEST_HIGH / (lo / 12));
      pb.innerHTML = 'Pays back in about <b>' + a + ' to ' + b + ' months</b>, counting the trial and phase 2.';
    } else pb.textContent = '';
  }
  form.addEventListener('input', update);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  update();
})();

// Example full plan: the moving line diagram. Bottles run along the belt, each camera
// station checks them as they pass through, and flagged bottles are lifted off (trial) or blown into the bin (phase 2).
(function () {
  'use strict';
  var svg = document.getElementById('line-svg');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var wrap = svg.parentNode;
  var gB = document.getElementById('bottles'), gC = document.getElementById('cases');
  var Y1 = 150, Y2 = 380, CX = 940, CY = 265, R = 115, L1 = 900, ARC = Math.PI * R;
  function at(s) {
    if (s <= L1) return [40 + s, Y1];
    if (s <= L1 + ARC) { var t = -Math.PI / 2 + (s - L1) / R; return [CX + R * Math.cos(t), CY + R * Math.sin(t)]; }
    return [CX - (s - L1 - ARC), Y2];
  }
  function sx(x) { return L1 + ARC + (CX - x); } // distance along the belt for an x on the lower run
  var S_A = 315, S_B = sx(800), S_REJ = sx(680), S_PACK = sx(560), S_END_CASE = sx(330), S_C = sx(420);
  var SPEED = 72, GAP = 32, mode = 'trial', paused = false, visible = true;
  var bottles = [], cases = [], n = 0, packed = 0, checked = 1240, flagged = 0, last = 0, acc = GAP;
  var REASONS_A = ['Cap not seated', 'Fill below the line', 'Cap crooked'];
  var REASONS_B = ['Wrong best-before', 'Label crooked', 'Wrong label for the run'];
  var timers = {};

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pulse(id, cls, ms) {
    var e = document.getElementById(id); if (!e) return;
    e.classList.add(cls);
    clearTimeout(timers[id + cls]);
    timers[id + cls] = setTimeout(function () { e.classList.remove(cls); }, ms);
  }
  function popup(letter, text) {
    var g = document.getElementById('pop-' + letter); if (!g) return;
    g.querySelector('text').textContent = text;
    pulse('pop-' + letter, 'on', 1600);
  }
  function seen(letter, bad, reason) {
    var st = document.getElementById('cone-' + letter).parentNode.querySelector('.st');
    if (st) { st.classList.add(bad ? 'flag' : 'on'); setTimeout(function () { st.classList.remove('on', 'flag'); }, bad ? 700 : 220); }
    pulse('cone-' + letter, 'on', 260);
    pulse('net-' + letter, 'on', 260);
    if (bad) { pulse('light-' + letter, 'bad', 1500); popup(letter, reason); pulse('net-S', 'on', 600); }
  }
  function screen() {
    document.getElementById('scr-count').textContent = 'Checked ' + checked.toLocaleString('en-AU');
    document.getElementById('scr-flag').textContent = 'Flagged ' + flagged;
  }
  function addBottle(s) {
    var g = el('g', { 'class': 'bt' }, gB);
    el('circle', { 'class': 'body', r: 9 }, g);
    el('circle', { 'class': 'cap', r: 4 }, g);
    var i = n++;
    var b = { s: s, g: g, i: i, bad: false, out: 0, doneA: false, doneB: false, doneR: false,
      failA: i % 14 === 6 ? REASONS_A[(i / 14 | 0) % 3] : '', failB: i % 19 === 11 ? REASONS_B[(i / 19 | 0) % 3] : '' };
    bottles.push(b);
    return b;
  }
  function place(b) {
    var p = at(b.s), x = p[0], y = p[1], op = 1;
    if (b.out > 0) {
      if (b.lift === 'hand') { y += (b.s < L1 ? -1 : 1) * b.out * 0.9; op = Math.max(0, 1 - b.out / 34); }
      else { y -= b.out * 1.2; x = 680 + (x - 680) * Math.max(0, 1 - b.out / 30); op = Math.max(0, 1 - b.out / 52); }
    }
    b.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
    b.g.style.opacity = op;
  }
  function addCase() {
    var g = el('g', { 'class': 'case' }, gC);
    el('rect', { x: -15, y: -10, width: 30, height: 20, rx: 3 }, g);
    var c = { s: S_PACK + 40, g: g, i: packed++, done: false };
    cases.push(c);
  }
  function step(dt) {
    var d = SPEED * dt;
    acc += d;
    while (acc >= GAP) { acc -= GAP; addBottle(acc); }
    for (var k = bottles.length - 1; k >= 0; k--) {
      var b = bottles[k];
      if (b.out > 0) { b.out += d; place(b); if (b.out > 60) { b.g.remove(); bottles.splice(k, 1); } continue; }
      b.s += d;
      if (!b.doneA && b.s >= S_A) { b.doneA = true; if (b.failA) { b.bad = true; b.g.classList.add('bad'); flagged++; screen(); } seen('A', !!b.failA, b.failA); }
      if (!b.doneB && b.s >= S_B) {
        b.doneB = true; checked++;
        if (!b.bad && b.failB) { b.bad = true; b.g.classList.add('bad'); flagged++; seen('B', true, b.failB); } else seen('B', false);
        screen();
      }
      if (b.bad && mode === 'trial' && !b.lift && (b.doneB ? b.s >= S_B + 46 : b.s >= S_A + 46)) { b.lift = 'hand'; b.out = 0.01; }
      if (b.bad && mode === 'p2' && !b.doneR && b.s >= S_REJ) { b.doneR = true; b.lift = 'jet'; b.out = 0.01; pulse('net-R', 'on', 400); }
      if (b.s >= S_PACK) {
        b.g.remove(); bottles.splice(k, 1);
        if (!b.bad && b.i % 6 === 0) addCase();
        continue;
      }
      place(b);
    }
    for (var j = cases.length - 1; j >= 0; j--) {
      var c = cases[j];
      c.s += d;
      if (!c.done && c.s >= S_C) {
        c.done = true;
        if (mode === 'p2') {
          var bad = c.i % 9 === 4;
          if (bad) c.g.classList.add('bad');
          seen('C', bad, 'Bottle missing in case');
        }
      }
      if (c.s >= S_END_CASE) { c.g.remove(); cases.splice(j, 1); continue; }
      var p = at(c.s);
      c.g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')');
    }
  }
  function frame(t) {
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    if (!paused && visible) step(dt);
    requestAnimationFrame(frame);
  }
  // fill the belt so it starts mid-shift
  function prime() { for (var t = 0; t < 26; t += 0.05) step(0.05); }

  var note = document.getElementById('sim-note');
  var NOTES = {
    trial: 'A flagged bottle lights the tower light and shows on the screen. Your team lifts it off the line.',
    p2: 'Flagged bottles are blown into the reject bin, and station C checks every case before it is sealed.'
  };
  document.querySelectorAll('.sim-mode button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      mode = btn.getAttribute('data-mode');
      document.querySelectorAll('.sim-mode button').forEach(function (o) { o.setAttribute('aria-pressed', o === btn ? 'true' : 'false'); });
      wrap.classList.toggle('p2', mode === 'p2');
      document.getElementById('rej-sub').textContent = mode === 'p2' ? 'air jet on' : 'phase 2';
      note.textContent = NOTES[mode];
    });
  });
  var pauseBtn = document.getElementById('sim-pause');
  pauseBtn.addEventListener('click', function () {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Play' : 'Pause';
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(svg);
  }
  screen();
  prime();
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) { paused = true; pauseBtn.textContent = 'Play'; pauseBtn.setAttribute('aria-pressed', 'true'); }
  requestAnimationFrame(frame);
})();
