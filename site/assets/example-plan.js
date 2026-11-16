// Example full plan: the savings estimate. Same assumptions as the 3D preview's estimate.
(function () {
  'use strict';
  var form = document.getElementById('s-form');
  if (!form) return;
  var INVEST_LOW = 46000 + 9000 + 12000, INVEST_HIGH = 70000 + 14000 + 18000; // trial plus phase 2
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
