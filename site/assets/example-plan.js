// Example full plan page: draws the plan from the JSON data block on the page.
(function(){
'use strict';
var d = JSON.parse(document.getElementById('plan-data').textContent);
var $ = function(id){ return document.getElementById(id); };
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
function money(n){ return 'A$' + Math.round(n).toLocaleString('en-AU'); }
function parseDate(s){ var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function fmtDate(dt){ return dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); }
function addDays(dt, n){ var x = new Date(dt); x.setDate(x.getDate() + n); return x; }

if (d.status === 'sample'){ var b = $('banner'); b.hidden = false; b.className = 'draft sample'; b.textContent = 'Example full plan for Riverbend Drinks, a made-up company. Yours is built from your own answers.'; }
else if (d.status === 'draft'){ var b2 = $('banner'); b2.hidden = false; b2.textContent = 'Draft for Vantory review. Not yet sent to the client.'; }

var prepared = parseDate(d.preparedOn);
$('ref').innerHTML = 'Ref ' + esc(d.leadId) + '<br>' + esc(prepared.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }));
$('headline').textContent = d.headline;
$('summary').textContent = d.summary;
$('meta').innerHTML = [['Prepared for', d.client.name], ['Company', d.client.company], ['Site', d.client.site || 'To confirm'], ['Industry', d.industry]]
  .map(function(m){ return '<li><span>' + esc(m[0]) + '</span><b>' + esc(m[1]) + '</b></li>'; }).join('');

/* line diagram */
(function(){
  var st = d.line.stations, n = st.length, W = 880, H = 210, pad = 18, gap = 14;
  var bw = (W - pad * 2 - gap * (n - 1)) / n, y = 70, bh = 62;
  var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Line diagram: ' + esc(st.join(', then ')) + '">'];
  out.push('<rect x="' + pad + '" y="' + (y + bh / 2 - 5) + '" width="' + (W - pad * 2) + '" height="10" rx="5" fill="#D5DBE8"/>');
  for (var i = 0; i < n; i++){
    var x = pad + i * (bw + gap), cam = st[i] === d.line.camera;
    out.push('<g>');
    out.push('<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="10" fill="' + (cam ? '#2350F5' : '#FFFFFF') + '" stroke="' + (cam ? '#2350F5' : '#C3CADB') + '" stroke-width="1.5"/>');
    var words = st[i].split(' '), lines = words.length > 1 && st[i].length > 11 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [st[i]];
    lines.forEach(function(t, k){ out.push('<text x="' + (x + bw / 2) + '" y="' + (y + bh / 2 + 5 + (k - (lines.length - 1) / 2) * 16) + '" text-anchor="middle" font-family="Inter, sans-serif" font-size="13.5" font-weight="600" fill="' + (cam ? '#FFFFFF' : '#0E1530') + '">' + esc(t) + '</text>'); });
    if (i < n - 1) out.push('<path d="M' + (x + bw + 2) + ' ' + (y + bh / 2) + ' l' + (gap - 6) + ' 0 m-5 -5 l5 5 l-5 5" stroke="#8A93A8" stroke-width="1.6" fill="none"/>');
    if (cam){
      var cx = x + bw / 2;
      out.push('<rect x="' + (cx - 17) + '" y="14" width="34" height="22" rx="5" fill="#2350F5"/><circle cx="' + cx + '" cy="25" r="6.5" fill="#FFFFFF"/><circle cx="' + cx + '" cy="25" r="3" fill="#2350F5"/>');
      out.push('<path d="M' + (cx - 14) + ' 38 L' + (cx - 30) + ' ' + y + ' L' + (cx + 30) + ' ' + y + ' L' + (cx + 14) + ' 38 Z" fill="#2350F5" opacity=".14"/>');
      out.push('<text x="' + cx + '" y="' + (y + bh + 24) + '" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#2350F5" font-weight="600">Every pack photographed</text>');
      if (i < n - 1){
        var rx = x + bw + gap / 2;
        out.push('<path d="M' + rx + ' ' + (y + bh / 2 + 6) + ' L' + rx + ' ' + (y + bh + 52) + '" stroke="#14805A" stroke-width="2" stroke-dasharray="4 3"/>');
        out.push('<rect x="' + (rx - 18) + '" y="' + (y + bh + 52) + '" width="36" height="20" rx="4" fill="#14805A"/>');
        out.push('<text x="' + (rx + 26) + '" y="' + (y + bh + 66) + '" font-family="Inter, sans-serif" font-size="12" fill="#14805A" font-weight="600">Flagged packs off the line</text>');
      }
    }
    out.push('</g>');
  }
  out.push('</svg>');
  $('diagram').innerHTML = out.join('');
  $('line-name').textContent = d.line.name + '. ' + d.line.reject + '.';
})();

$('checks').innerHTML = d.checks.map(function(c){
  return '<li><span class="tag' + (c.phase === 'Trial' ? '' : ' later') + '">' + (c.phase === 'Trial' ? 'In the trial' : 'Later') + '</span><b>' + esc(c.name) + '</b><span>' + esc(c.why) + '</span></li>';
}).join('');

/* trial path chart */
(function(){
  var start = parseDate(d.path.start), steps = d.path.steps;
  var weeks = Math.max.apply(null, steps.map(function(s){ return s.to; }));
  var head = '<tr><th>Step</th>';
  for (var w = 1; w <= weeks; w++) head += '<th class="wk">' + fmtDate(addDays(start, (w - 1) * 7)).replace(' ', '<br>') + '</th>';
  head += '</tr>';
  var rows = steps.map(function(s){
    var r = '<tr><td class="step"><b>' + esc(s.title) + '</b><span>' + esc(s.detail) + '</span><br><span class="dates">' + fmtDate(addDays(start, (s.from - 1) * 7)) + ' to ' + fmtDate(addDays(start, s.to * 7 - 3)) + '</span></td>';
    for (var w2 = 1; w2 <= weeks; w2++){
      var on = w2 >= s.from && w2 <= s.to;
      var cls = s.who === 'client' ? 'bar client' : s.who === 'trial' ? 'bar trial' : 'bar';
      r += '<td class="cell">' + (on ? '<div class="' + cls + '" style="border-radius:' + (w2 === s.from ? '4px' : '0') + ' ' + (w2 === s.to ? '4px 4px' : '0 0') + ' ' + (w2 === s.from ? '4px' : '0') + '"></div>' : '') + '</td>';
    }
    return r + '</tr>';
  }).join('');
  $('gantt').innerHTML = '<table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
  var end = addDays(start, weeks * 7 - 3);
  $('path-sub').textContent = 'About ' + weeks + ' weeks from our first call on ' + fmtDate(start) + ' to a reviewed trial by ' + end.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) + '. Our equipment never stops your line: installation fits a maintenance window.';
})();

/* costs */
(function(){
  var c = d.costs, lo = 0, hi = 0;
  function row(it){
    var amt = it.tbc ? '<td class="amt tbc">' + esc(it.tbc) + '</td>' : '<td class="amt">' + money(it.low) + ' to ' + money(it.high) + '</td>';
    if (!it.tbc){ lo += it.low; hi += it.high; }
    return '<tr><td class="item">' + esc(it.item) + '<span>' + esc(it.detail || '') + '</span></td>' + amt + '</tr>';
  }
  var html = '<thead><tr><th>For the trial</th><th class="amt">Indicative, ex GST</th></tr></thead><tbody>' + c.items.map(row).join('');
  html += '<tr class="total"><td class="item">Trial hardware</td><td class="amt">' + money(lo) + ' to ' + money(hi) + '</td></tr></tbody>';
  if (c.later && c.later.length){
    html += '<thead><tr><th style="padding-top:22px">After the trial, if you go ahead</th><th></th></tr></thead><tbody>' + c.later.map(row).join('') + '</tbody>';
  }
  $('costs').innerHTML = html;
  $('cost-note').textContent = c.note;
})();

$('assumptions').innerHTML = d.assumptions.map(function(a){ return '<li>' + esc(a) + '</li>'; }).join('');
$('confirm').innerHTML = d.confirm.map(function(a){ return '<li>' + esc(a) + '</li>'; }).join('');
$('fine').textContent = 'Prepared by Vantory Technologies, Melbourne, from the details in your enquiry. All amounts in Australian dollars, excluding GST. This plan is an estimate, not a quote or contract; figures are confirmed in writing before any commitment.';
})();
