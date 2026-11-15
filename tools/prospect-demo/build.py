"""Builds the personalised ricotta-tub demo for one prospect from the bottling-line page."""
import json, re, sys

src = None
logo = None

import os
HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) < 3:
    sys.exit('Usage: python3 build.py companies/<slug>.json out/<slug>.html')
CFG = json.load(open(sys.argv[1]))
C = CFG
C.setdefault('headline', 'Every tub of %s checked, not a sample.' % C['productShort'])
C.setdefault('lineType', 'fresh cheese tub line')
C.setdefault('vatsLabel', 'Cheese vats')
C.setdefault('dispatchLabel', 'Chilled dispatch')

def cut(s, start, end):
    i = s.index(start); j = s.index(end, i)
    return s[:i], s[i:j], s[j:]

src = open(os.path.join(HERE, 'base-line.html')).read()
logo = open(os.path.join(HERE, 'vantory-logo.svg')).read()

# ---------- head ----------
s = src.replace('<title>Vantory Bottling Line</title>', '<title>%s</title>\n<meta name="robots" content="noindex, nofollow">' % C['pageTitle'])
s = s.replace('/* Layout: full-bleed 3D bottling line behind;', '/* Layout: personalised prospect demo. Full-bleed 3D ricotta tub line behind;')
extra_css = '''
.prepared{position:fixed;z-index:6;left:0;right:0;top:calc(64px + env(safe-area-inset-top,0px));display:flex;justify-content:center;pointer-events:none}
.prepared span{pointer-events:auto;font:500 12px/1 var(--font);color:var(--muted);background:rgba(11,20,36,.82);border:1px solid var(--line);border-radius:999px;padding:7px 12px}
.prepared b{color:var(--text);font-weight:600}
.range{margin:0;font:600 30px/1.1 var(--font);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.range small{display:block;font:500 13px/1.4 var(--font);color:var(--muted);letter-spacing:0;margin-top:4px}
.est-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}
.est-grid .field label{font-size:12.5px}
.guess{font:500 10.5px/1 var(--mono);color:var(--warn);margin-left:4px}
.tighten{border-top:1px solid var(--line);padding-top:16px;display:flex;flex-direction:column;gap:12px}
.tighten h3{margin:0;font-size:18px;font-weight:650}
.form2{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
.form2 .full{grid-column:1/-1}
.form2 input[type=text],.form2 input[type=email],.form2 select{width:100%;font:500 15px/1.2 var(--font);color:var(--text);background:var(--midnight-2);border:1px solid var(--line);border-radius:10px;padding:11px 12px}
.form2 input[readonly]{color:var(--muted)}
.form2 input:focus,.form2 select:focus{outline:none;border-color:var(--cobalt-soft)}
.pick{display:flex;flex-wrap:wrap;gap:6px}
.pick label{display:inline-flex;align-items:center;gap:6px;font-size:13px;border:1px solid var(--line);background:var(--midnight-2);border-radius:999px;padding:7px 11px;cursor:pointer}
.pick input{accent-color:var(--cobalt)}
.consent2{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;color:var(--muted)}
.consent2 input{margin-top:3px;accent-color:var(--cobalt)}
.status{margin:0;font-size:13.5px;min-height:1.2em}
.status.ok{color:var(--ok)} .status.err{color:#ff8b82}
@media (max-width:760px){ .prepared{display:none} .est-grid,.form2{grid-template-columns:1fr} .range{font-size:24px} }
'''
s = s.replace('@media (max-width:760px){\n  .rail{display:none}', extra_css + '@media (max-width:760px){\n  .rail{display:none}', 1)

# ---------- body ----------
rail = '''<ol class="rail" aria-label="Sections">
  <li><button type="button" data-go="0"><span>Your line</span></button></li>
  <li><button type="button" data-go="1"><span>Lids and seals</span></button></li>
  <li><button type="button" data-go="2"><span>Labels</span></button></li>
  <li><button type="button" data-go="3"><span>Use-by codes</span></button></li>
  <li><button type="button" data-go="4"><span>Foreign objects</span></button></li>
  <li><button type="button" data-go="5"><span>Shift report</span></button></li>
  <li><button type="button" data-go="6"><span>How a trial runs</span></button></li>
  <li><button type="button" data-go="7"><span>Your estimate</span></button></li>
</ol>
<p class="prepared"><span>Prepared for <b>%(company)s</b> by Vantory Technologies · %(preparedOn)s</span></p>''' % C
a, _, b = cut(s, '<ol class="rail"', '<aside class="cam')
s = a + rail + '\n\n' + b
s = s.replace('<span class="live">Camera 1 · after the coder</span>', '<span class="live">Camera 1 · after the coder</span>')
s = s.replace('<dt>Expected</dt><dd>BB 14 MAY 27 L2317</dd>', '<dt>Expected</dt><dd>%s</dd>' % C['code'])
s = s.replace('aria-label="Latest bottle photographed by the inspection camera"', 'aria-label="Latest tub photographed by the inspection camera"')
s = s.replace('Waiting for the next bottle', 'Waiting for the next tub')

e = C['est']
main = '''<main>
  <section class="stop hero" data-stop="0" id="line" aria-labelledby="h-line">
    <div class="intro">
      <p class="eyebrow"><span class="dot"></span>For %(company)s · %(site)s</p>
      <h1 id="h-line">%(headline)s</h1>
      <p class="lede">%(heroLede)s</p>
      <ul class="facts">
        <li><b>Every tub</b><span>checked at line speed</span></li>
        <li><b>8 to 12 weeks</b><span>from first call to a working check</span></li>
        <li><b>On site</b><span>the AI runs on a unit beside your line</span></li>
      </ul>
      <p class="hint">Scroll to follow a tub down the line</p>
    </div>
  </section>

  <section class="stop" data-stop="1" id="lids" aria-labelledby="h-lid">
    <div class="panel">
      <p class="eyebrow"><span class="dot"></span>Line check 1</p>
      <h2 id="h-lid">Lids on, seated and sealed</h2>
      <p class="lede">%(lidLede)s</p>
      <ul class="chips"><li>Missing lids</li><li>Lids not seated</li><li>Lifted seals</li></ul>
      <div class="save">
        <p class="save-h">Where it saves money <em>Our guess, for a maker your size</em></p>
        <p class="big"><span class="num" data-to="%(lidsave)d">$%(lidsave_s)s</span><span class="per">returns and complaints a year</span></p>
        <p class="calc">%(packs_s)s tubs a day × %(days)d days × 0.04%% fewer faulty tubs leaving the site × $%(escape)d per return or complaint.</p>
      </div>
    </div>
  </section>

  <section class="stop" data-stop="2" id="labels-check" aria-labelledby="h-label">
    <div class="panel">
      <p class="eyebrow"><span class="dot"></span>Line check 2</p>
      <h2 id="h-label">The right label for the run</h2>
      <p class="lede">%(labelLede)s</p>
      <p class="fact">38%% of Australian food recalls in 2025 were for undeclared allergens, with packaging errors among the main causes. <a href="https://www.foodstandards.gov.au/news/2025-food-recall-statistics-released">FSANZ</a></p>
      <div class="save">
        <p class="save-h">Where it saves money <em>Example</em></p>
        <p class="big"><span class="num" data-to="200000">$200,000</span><span class="per">per recall avoided</span></p>
        <p class="calc">Example cost of one recall for a mid-size maker: product destroyed, retrieval, retailer fees and lost sales. Use your own figure below.</p>
      </div>
    </div>
  </section>

  <section class="stop" data-stop="3" id="codes" aria-labelledby="h-code">
    <div class="panel">
      <p class="eyebrow"><span class="dot"></span>Line check 3</p>
      <h2 id="h-code">Use-by and batch codes, read on every tub</h2>
      <p class="lede">%(codeLede)s</p>
      <ol class="steps" id="steps" aria-label="What happens for each tub">
        <li class="done">Operator sets product and use-by date at changeover</li>
        <li>Sensor sees the tub and the camera takes a photo</li>
        <li>The on-site AI reads the code</li>
        <li>Pass, or red light and photo on screen</li>
      </ol>
      <div class="save">
        <p class="save-h">Where it saves money <em>Our guess, for a maker your size</em></p>
        <p class="big"><span class="num" data-to="%(qcsave)d">$%(qcsave_s)s</span><span class="per">QC time freed a year</span></p>
        <p class="calc">%(hours)d hours a week of manual label and code checks × $%(rate)d/h × 52 weeks, with 60%% handed to the camera.</p>
      </div>
    </div>
  </section>

  <section class="stop" data-stop="4" id="foreign-objects" aria-labelledby="h-obj">
    <div class="panel">
      <p class="eyebrow"><span class="dot"></span>Line check 4</p>
      <h2 id="h-obj">Foreign objects on the conveyor</h2>
      <p class="lede">%(objectLede)s</p>
      <p class="fact">Foreign matter was the most common incident reported by manufacturers in the AFGC recall survey. <a href="https://afgc.org.au/wp-content/uploads/2024/10/AFGC-Victual-Food-Recall-Survey-Report.pdf">AFGC</a></p>
      <div class="save">
        <p class="save-h">Where it saves money <em>Our guess, for a maker your size</em></p>
        <p class="big"><span class="num" data-to="%(pensave)d">$%(pensave_s)s</span><span class="per">retailer penalties a year</span></p>
        <p class="calc">$%(penalty_s)s of chargebacks and rejected deliveries a year × 80%% fewer faulty tubs reaching the retailer.</p>
      </div>
    </div>
  </section>

  <section class="stop" data-stop="5" id="shift-report" aria-labelledby="h-report">
    <div class="panel">
      <p class="eyebrow"><span class="dot"></span>Every shift</p>
      <h2 id="h-report">A report your QC team can file</h2>
      <p class="lede">Each shift ends with a count of every tub checked and every reject, with photos kept as quality records for your food safety audits. Repeat faults on one line raise an alert.</p>
      <div class="report" aria-live="off">
        <div><b id="rp-checked">14,820</b><span>tubs checked</span></div>
        <div><b id="rp-rejects">19</b><span>flagged</span></div>
        <div><b id="rp-rate">0.13%%</b><span>reject rate</span></div>
      </div>
      <div class="bars" id="rp-bars"></div>
      <p class="alertrow">Four lids not seated in fifteen minutes on Line 1. Check the lidder.</p>
      <p class="fine">Example shift. Counts update as tubs pass the camera.</p>
    </div>
  </section>

  <section class="stop" data-stop="6" id="trial" aria-labelledby="h-trial">
    <div class="panel">
      <p class="eyebrow"><span class="dot"></span>How a trial runs</p>
      <h2 id="h-trial">One camera, one line, alerts only</h2>
      <ol class="timeline">
        <li><span class="wk">Week 1</span><div><b>%(visitLine)s</b><span>We watch the tub line run and choose the inspection point.</span></div></li>
        <li><span class="wk">Weeks 2 to 3</span><div><b>Feasibility and proposal</b><span>Fixed trial price, success targets and data handling in writing.</span></div></li>
        <li><span class="wk">Weeks 3 to 6</span><div><b>Images, setup and equipment</b><span>Your QC team shows us good and faulty tubs. We set up the checks and the hardware.</span></div></li>
        <li><span class="wk">Week 7</span><div><b>Install and tune</b><span>Half a day in a maintenance window, rated for washdown areas.</span></div></li>
        <li><span class="wk">Weeks 8 to 12</span><div><b>Four-week trial and review</b><span>We report tubs checked, faults caught and false alarms against the targets.</span></div></li>
      </ol>
      <p class="callout">Our equipment never stops your line. Automatic rejects come in phase two, with your maintenance team.</p>
    </div>
  </section>

  <section class="stop final" data-stop="7" id="estimate" aria-labelledby="h-roi">
    <div class="panel">
      <p class="eyebrow"><span class="dot"></span>Your estimate</p>
      <h2 id="h-roi">What checking every tub could be worth to %(company)s</h2>
      <p class="lede">We started from public information about a maker your size, so the figures marked <span class="guess">GUESS</span> are ours. Change any of them and the range updates.</p>
      <div class="result" aria-live="polite">
        <p class="save-h">Estimated saving <em>Range</em></p>
        <p class="range"><span id="r-range">$0 to $0</span><small>a year, depending on how many faults reach customers today and how often recalls happen</small></p>
        <div class="bars" id="r-bars"></div>
      </div>
      <form class="est-grid" id="roi" novalidate>
        <div class="field"><label for="c-packs">Tubs a day on the busiest line <span class="guess" data-g="c-packs">GUESS</span></label><input id="c-packs" type="number" min="0" step="1000" value="%(packs)d" inputmode="numeric"></div>
        <div class="field"><label for="c-days">Production days a year <span class="guess" data-g="c-days">GUESS</span></label><input id="c-days" type="number" min="0" step="1" value="%(days)d" inputmode="numeric"></div>
        <div class="field"><label for="c-hours">Staff hours a week on label and code checks <span class="guess" data-g="c-hours">GUESS</span></label><input id="c-hours" type="number" min="0" step="1" value="%(hours)d" inputmode="numeric"></div>
        <div class="field"><label for="c-rate">Hourly cost of that staff ($) <span class="guess" data-g="c-rate">GUESS</span></label><input id="c-rate" type="number" min="0" step="1" value="%(rate)d" inputmode="numeric"></div>
        <div class="field"><label for="c-recall">Cost of one recall or withdrawal ($) <span class="guess" data-g="c-recall">GUESS</span></label><input id="c-recall" type="number" min="0" step="10000" value="%(recall)d" inputmode="numeric"></div>
        <div class="field"><label for="c-recalls">Recalls or withdrawals in the past 5 years <span class="guess" data-g="c-recalls">GUESS</span></label><input id="c-recalls" type="number" min="0" step="1" value="%(recalls)d" inputmode="numeric"></div>
        <div class="field"><label for="c-penalty">Retailer penalties and rejected loads a year ($) <span class="guess" data-g="c-penalty">GUESS</span></label><input id="c-penalty" type="number" min="0" step="1000" value="%(penalty)d" inputmode="numeric"></div>
        <div class="field"><label for="c-escape">Cost per faulty tub reaching a customer ($) <span class="guess" data-g="c-escape">GUESS</span></label><input id="c-escape" type="number" min="0" step="1" value="%(escape)d" inputmode="numeric"></div>
      </form>

      <div class="tighten">
        <h3>Get a firmer estimate and a trial plan</h3>
        <p class="lede">Send us a few details and we will reply within one business day with a trial plan for your line, including where the camera goes, dates and indicative costs.</p>
        <form class="form2" id="tighten" novalidate>
          <div class="field"><label for="t-name">Your name</label><input id="t-name" type="text" autocomplete="name"></div>
          <div class="field"><label for="t-role">Your role</label><input id="t-role" type="text" autocomplete="organization-title" placeholder="e.g. Operations manager"></div>
          <div class="field"><label for="t-email">Work email</label><input id="t-email" type="email" autocomplete="email"></div>
          <div class="field"><label for="t-company">Company</label><input id="t-company" type="text" value="%(company)s" readonly></div>
          <div class="field"><label for="t-product">Product on the line</label><input id="t-product" type="text" value="%(formProduct)s"></div>
          <div class="field"><label for="t-checked">How are labels and codes checked today?</label>
            <select id="t-checked"><option value="">Choose one</option><option>Staff check every tub</option><option>Staff check a sample</option><option>We have a camera or vision system</option><option>Not checked regularly</option></select></div>
          <div class="field full"><span class="label" style="font-size:13px;color:var(--muted)">What would you like checked?</span>
            <div class="pick">
              <label><input type="checkbox" name="t-check" value="Lids and seals" checked>Lids and seals</label>
              <label><input type="checkbox" name="t-check" value="Labels" checked>Labels</label>
              <label><input type="checkbox" name="t-check" value="Use-by and batch codes" checked>Use-by and batch codes</label>
              <label><input type="checkbox" name="t-check" value="Foreign objects">Foreign objects</label>
            </div>
          </div>
          <p class="consent2 full"><input type="checkbox" id="t-consent"><label for="t-consent">I agree to Vantory Technologies using these details to reply to me, as set out in the <a href="https://www.vantorytech.com/privacy.html">Privacy Policy</a>.</label></p>
          <div class="full"><button class="btn" type="submit">Send and get my trial plan</button></div>
          <p class="status full" id="t-status" role="status"></p>
        </form>
        <p class="fine">Or reply to %(preparedBy)s directly: <span style="user-select:all">%(contact)s</span></p>
      </div>
    </div>
  </section>
</main>'''

def m(n): return '{:,}'.format(int(round(n)))
lidsave = e['packs'] * e['days'] * 0.0004 * e['escape']
qcsave = e['hours'] * e['rate'] * 52 * 0.6
pensave = e['penalty'] * 0.8
vals = dict(C, **e)
vals.update(lidsave=lidsave, lidsave_s=m(lidsave), qcsave=qcsave, qcsave_s=m(qcsave), pensave=pensave, pensave_s=m(pensave), packs_s=m(e['packs']), penalty_s=m(e['penalty']))
a, _, b = cut(s, '<main>', '<footer class="note">')
s = a + (main % vals) + '\n\n' + b
a, _, b = cut(s, '<footer class="note">', '<script src=')
s = a + '''<footer class="note">
  <p>Prepared for %(company)s by Vantory Technologies, Melbourne. The line shown is an illustration of a typical %(lineType)s, not a model of your site, and the product labels are generic. Figures marked as guesses are ours, made from public information, and are not results from a client. All amounts in Australian dollars.</p>
  <p>Sources: <a href="https://www.foodstandards.gov.au/news/2025-food-recall-statistics-released">FSANZ, 2025 food recall statistics</a>; <a href="https://afgc.org.au/wp-content/uploads/2024/10/AFGC-Victual-Food-Recall-Survey-Report.pdf">AFGC Product Recall Survey Report</a>.</p>
</footer>

''' % C + b

# ---------- script: calculator -> estimate range + tighten form ----------
est_js = r'''/* ---------- estimate range + tighten form ---------- */
function val(id){ var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
function roi(){
  var packs = val('c-packs') * val('c-days');
  function calc(qc, esc, rec, pen){
    return [
      ['QC time', val('c-hours') * 52 * val('c-rate') * qc],
      ['Recall risk', val('c-recalls') / 5 * val('c-recall') * 0.8 * rec],
      ['Retailer penalties', val('c-penalty') * pen],
      ['Faulty tubs', packs * esc * val('c-escape')]
    ];
  }
  var lo = calc(0.4, 0.0002, 0.5, 0.6), hi = calc(0.6, 0.0004, 1, 0.8);
  function sum(p){ return p.reduce(function(s, x){ return s + x[1]; }, 0); }
  function r(n){ return n >= 10000 ? Math.round(n / 1000) * 1000 : Math.round(n / 100) * 100; }
  $('r-range').textContent = fmt(r(sum(lo))) + ' to ' + fmt(r(sum(hi)));
  $('r-bars').innerHTML = barsHTML(hi.map(function(p, i){ return [p[0], (p[1] + lo[i][1]) / 2]; }), true);
}
['c-packs','c-days','c-hours','c-rate','c-recall','c-recalls','c-penalty','c-escape'].forEach(function(id){
  $(id).addEventListener('input', function(){ var g = document.querySelector('[data-g="' + id + '"]'); if (g) g.hidden = true; roi(); });
});
$('roi').addEventListener('submit', function(e){ e.preventDefault(); });
roi();
$('tighten').addEventListener('submit', function(e){
  e.preventDefault();
  var st = $('t-status'); st.className = 'status';
  if (!$('t-name').value.trim()){ st.className = 'status err'; st.textContent = 'Please add your name.'; $('t-name').focus(); return; }
  if (!$('t-email').value.trim() || !$('t-email').checkValidity()){ st.className = 'status err'; st.textContent = 'Please enter a valid work email, like name@company.com.'; $('t-email').focus(); return; }
  if (!$('t-consent').checked){ st.className = 'status err'; st.textContent = 'Please tick the box to agree to our Privacy Policy.'; $('t-consent').focus(); return; }
  var first = $('t-name').value.trim().split(' ')[0];
  /* On vantorytech.com this sends the form, the estimate inputs and "page: for/<slug>" to the enquiries sheet and Web3Forms, and a trial plan is drafted within the hour. */
  st.className = 'status ok';
  st.textContent = 'Thanks, ' + first + '. This is a preview, so nothing was sent. On the live page your details go straight to the Vantory team.';
});

'''
a, _, b = cut(s, '/* ---------- calculator ---------- */', '/* ---------- shift report ---------- */')
s = a + est_js + b
s = s.replace("var report = { checked: 18240, cats: { 'Fill and caps': 9, 'Labels': 7, 'Date codes': 4, 'Foreign objects': 2 } };",
              "var report = { checked: 14820, cats: { 'Lids and seals': 8, 'Labels': 6, 'Use-by codes': 4, 'Foreign objects': 1 } };")

# ---------- camera inset drawing (side view of a tub) ----------
draw_js = r'''/* ---------- camera inset drawing ---------- */
var shot = $('shot'), sx = shot.getContext('2d');
var CODE_OK = '%(code)s', CODE_WRONG = '%(codeWrong)s';
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
  var g = sx.createRadialGradient(W / 2, H * 0.5, 20, W / 2, H * 0.5, 260);
  g.addColorStop(0, '#2a3346'); g.addColorStop(1, '#0a0e16');
  sx.fillStyle = g; sx.fillRect(0, 0, W, H);
  sx.fillStyle = '#1a2130'; sx.fillRect(0, H - 60, W, 60);
  if (!it) return;
  if (it.kind === 'object'){
    sx.save(); sx.translate(W / 2, H - 90); sx.rotate(-0.3);
    if (it.defect === 'glove'){ sx.fillStyle = '#3b7bff'; rr(-46, -16, 92, 34, 14); sx.fill(); sx.fillStyle = '#2b5fd0'; rr(-46, -16, 30, 34, 10); sx.fill(); }
    else { sx.fillStyle = '#9aa6bb'; sx.beginPath(); sx.arc(0, 0, 26, 0, Math.PI * 2); sx.fill(); sx.fillStyle = '#1a2130'; sx.beginPath(); sx.arc(0, 0, 11, 0, Math.PI * 2); sx.fill(); }
    sx.restore();
    tagBox(W / 2 - 70, H - 140, 140, 92, true, 'FOREIGN OBJECT');
    return;
  }
  var d = it.defect || '', cx = W / 2, top = 120, bot = 300, wt = 214, wb = 168;
  /* tub body */
  sx.fillStyle = '#eef1f6';
  sx.beginPath(); sx.moveTo(cx - wt / 2, top); sx.lineTo(cx + wt / 2, top); sx.lineTo(cx + wb / 2, bot); sx.lineTo(cx - wb / 2, bot); sx.closePath(); sx.fill();
  sx.strokeStyle = 'rgba(0,0,0,.18)'; sx.lineWidth = 2; sx.stroke();
  /* lid */
  if (d === 'lidMissing'){
    sx.fillStyle = '#fbf7ee'; sx.beginPath(); sx.ellipse(cx, top, wt / 2, 16, 0, 0, Math.PI * 2); sx.fill();
    sx.fillStyle = '#efe8d6'; sx.beginPath(); sx.ellipse(cx - 20, top - 2, 40, 6, 0, 0, Math.PI * 2); sx.fill();
  } else {
    sx.save(); sx.translate(cx, top - 6);
    if (d === 'lidSkew'){ sx.translate(10, -10); sx.rotate(-0.16); }
    if (d === 'sealLifted'){ sx.translate(0, -10); }
    sx.fillStyle = '%(lid)s'; rr(-wt / 2 - 8, -14, wt + 16, 24, 6); sx.fill();
    sx.fillStyle = 'rgba(255,255,255,.18)'; sx.fillRect(-wt / 2 - 4, -11, wt + 8, 4);
    sx.restore();
    if (d === 'sealLifted'){ sx.strokeStyle = '#d9d2bd'; sx.lineWidth = 3; sx.beginPath(); sx.moveTo(cx + 30, top - 2); sx.lineTo(cx + 96, top - 14); sx.stroke(); }
  }
  /* label band */
  var ly = 150, lh = 92;
  if (d !== 'labelMissing'){
    sx.save(); sx.translate(cx, ly + lh / 2);
    if (d === 'labelCrooked') sx.rotate(-0.09);
    var wrong = d === 'labelWrong';
    sx.fillStyle = wrong ? '%(wrongLabel)s' : '%(label)s';
    var half = (wt + wb) / 4 - 4;
    if (d === 'labelTorn'){ sx.beginPath(); sx.moveTo(-half, -lh / 2); sx.lineTo(half, -lh / 2); sx.lineTo(half, 6); sx.lineTo(40, 18); sx.lineTo(14, 2); sx.lineTo(-10, 24); sx.lineTo(-40, 10); sx.lineTo(-half, 28); sx.closePath(); sx.fill(); }
    else sx.fillRect(-half, -lh / 2, half * 2, lh);
    sx.fillStyle = wrong ? '#24476b' : '%(labelInk)s';
    sx.textAlign = 'center';
    sx.font = '600 11px Inter, sans-serif'; sx.fillText(wrong ? '%(wrongTop)s' : '%(labelTop)s', 0, -20);
    sx.font = '700 19px Inter, sans-serif'; sx.fillText(wrong ? '%(wrongMain)s' : '%(labelMain)s', 0, 2);
    sx.font = '600 12px Inter, sans-serif'; sx.fillText('%(labelSize)s', 0, 22);
    sx.restore();
  }
  /* code */
  var cy = 272;
  if (d !== 'codeMissing'){
    sx.save(); sx.font = '600 11.5px "JetBrains Mono", monospace'; sx.textAlign = 'center';
    if (d === 'codeSmudged'){ sx.filter = 'blur(2.2px)'; sx.fillStyle = 'rgba(20,20,20,.75)'; sx.fillText('USE BY 0? D?C 2? L3?', cx, cy); }
    else { sx.fillStyle = '#121212'; sx.fillText(d === 'codeWrong' ? CODE_WRONG : CODE_OK, cx, cy); }
    sx.restore();
  }
  tagBox(cx - wt / 2 - 12, top - 32, wt + 24, 46, /^(lid|seal)/.test(d), /^(lid|seal)/.test(d) ? 'LID' : null);
  tagBox(cx - 92, ly - 8, 184, lh + 16, /^label/.test(d), /^label/.test(d) ? 'LABEL' : null);
  tagBox(cx - 82, cy - 17, 164, 25, /^code/.test(d), /^code/.test(d) ? 'CODE' : null);
  if (!d){ sx.fillStyle = '#3DDC97'; sx.font = '700 15px "JetBrains Mono", monospace'; sx.textAlign = 'left'; sx.fillText('PASS', 10, 24); }
}
drawShot(null);

var REASONS = {
  lidSkew: ['Lid not seated', 'Lids and seals'],
  lidMissing: ['Lid missing', 'Lids and seals'],
  sealLifted: ['Seal lifted', 'Lids and seals'],
  labelMissing: ['Label missing', 'Labels'],
  labelCrooked: ['Label crooked: 5° off', 'Labels'],
  labelTorn: ['Label torn', 'Labels'],
  labelWrong: ['Wrong label: %(wrongMain_t)s on a %(labelMain_t)s run', 'Labels'],
  codeSmudged: ['Use-by code unreadable', 'Use-by codes'],
  codeMissing: ['Use-by code missing', 'Use-by codes'],
  codeWrong: ['Wrong year: 25 printed, 26 expected', 'Use-by codes'],
  glove: ['Foreign object: blue glove fragment', 'Foreign objects'],
  washer: ['Foreign object: loose washer', 'Foreign objects']
};
''' % dict(C, wrongMain_t=C['wrongMain'].title(), labelMain_t=C['labelMain'].title())
a, _, b = cut(s, '/* ---------- camera inset drawing ---------- */', 'var camChecked = 0;')
s = a + draw_js + b
s = s.replace("var code = it.kind === 'object' ? '-' : it.defect === 'codeMissing' ? 'No code found' : it.defect === 'codeSmudged' ? 'Unreadable' : it.defect === 'codeWrong' ? 'BB 14 MAY 26 L2317' : CODE_OK;",
              "var code = it.kind === 'object' ? '-' : it.defect === 'codeMissing' ? 'No code found' : it.defect === 'codeSmudged' ? 'Unreadable' : it.defect === 'codeWrong' ? CODE_WRONG : CODE_OK;")
s = s.replace("'Fill, cap, label and code OK'", "'Lid, label and code OK'")
s = s.replace("camEl.classList.toggle('off', !(i >= 1 && i <= 5));", "camEl.classList.toggle('off', !(i >= 1 && i <= 5));")

# ---------- scene: vats instead of tanks ----------
vats = r'''/* cheese vats */
var stirrers = [];
[[-23.5, -8.3], [-23.5, -4.4]].forEach(function(p){
  var vat = new THREE.Group(); vat.position.set(p[0], 0, p[1]); scene.add(vat);
  box(6.4, 0.9, 0.14, C.steel, 0, 0.6, -1.25, 'faint', vat); box(6.4, 0.9, 0.14, C.steel, 0, 0.6, 1.25, 'faint', vat);
  box(0.14, 0.9, 2.5, C.steel, -3.2, 0.6, 0, 'faint', vat); box(0.14, 0.9, 2.5, C.steel, 3.2, 0.6, 0, 'faint', vat);
  box(6.4, 0.12, 2.5, C.steelDark, 0, 0.6, 0, false, vat);
  var curd = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 2.3), lam(0xf7f2e4)); curd.rotation.x = -Math.PI / 2; curd.position.y = 1.25; vat.add(curd);
  [[-2.8, -1.0], [2.8, -1.0], [-2.8, 1.0], [2.8, 1.0]].forEach(function(l){ box(0.12, 0.6, 0.12, C.steelDark, l[0], 0, l[1], false, vat); });
  var st = new THREE.Group(); st.position.set(0, 1.4, 0); vat.add(st);
  box(5.6, 0.08, 0.08, C.steelDark, 0, 0, 0, false, st); box(0.08, 0.6, 0.08, C.steelDark, -2.6, -0.3, 0, false, st); box(0.08, 0.6, 0.08, C.steelDark, 2.6, -0.3, 0, false, st);
  stirrers.push(st);
});
(function(){
  var pts = [[-20.2, 1.2, -4.4], [-19.6, 1.2, -4.4], [-19.6, 2.6, -2.6], [-19.6, 2.6, 0], [-19.6, 2.2, 0]].map(function(p){ return new THREE.Vector3(p[0], p[1], p[2]); });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 40, 0.1, 8, false), lam(C.steel)));
})();
'''
a, _, b = cut(s, '/* processing tanks + pipes */', '/* cold room */')
s = a + vats + b

# ---------- line constants + filler + lidder ----------
s = s.replace("var BELT_Y = 0.85, X_START = -17.2, X_FILLER = -19.5, X_CAP = -14.2,", "var BELT_Y = 0.85, X_START = -17.2, X_FILLER = -19.2, X_CAP = -14.2,")
s = s.replace("var SPEED = 0.95, SPACING = 1.15;", "var SPEED = 0.85, SPACING = 0.95;")
filler = r'''/* tub filler: hopper over a filling head */
var filler = new THREE.Group(); filler.position.set(X_FILLER, 0, 0); scene.add(filler);
box(2.4, 1.0, 1.6, C.steelDark, 0, 0, 0, true, filler);
var hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.35, 1.1, 24, 1, true), new THREE.MeshLambertMaterial({ color: C.steel, side: THREE.DoubleSide }));
hopper.position.set(0, 2.25, 0); filler.add(hopper);
var hopperTop = new THREE.Mesh(new THREE.CircleGeometry(0.92, 24), lam(0xf7f2e4)); hopperTop.rotation.x = -Math.PI / 2; hopperTop.position.set(0, 2.7, 0); filler.add(hopperTop);
cyl(0.12, 0.5, C.steel, 0, 1.2, 0, 12, filler);
var carousel = new THREE.Group(); filler.add(carousel);
for (var tsi = 0; tsi < 4; tsi++){ cyl(0.26, 0.06, C.steel, 0, 2.95 + tsi * 0.07, -1.4 + tsi * 0.0, 16, carousel); }
'''
a, _, b = cut(s, '/* filler carousel */', '/* capper */')
s = a + filler + b
lidder = r'''/* lidder: lid magazine over the belt */
box(1.6, 1.2, 1.4, C.steel, X_CAP, 0, -1.25, true);
box(0.5, 0.25, 1.9, C.steel, X_CAP, 2.15, -0.5, 'faint');
var capHead = new THREE.Group(); capHead.position.set(X_CAP, 1.55, 0); scene.add(capHead);
for (var lz = 0; lz < 6; lz++){ var lidc = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.05, 20), lam(new THREE.Color('%(lid)s').getHex())); lidc.position.y = lz * 0.07; capHead.add(lidc); }
''' % C
a, _, b = cut(s, '/* capper */', '/* labeller */')
s = a + lidder + b
s = s.replace("c.fillText('LINE 2  ·  CHANGEOVER SET 06:00', 24, 42);", "c.fillText('LINE 1  ·  CHANGEOVER SET 05:30', 24, 42);")
s = s.replace("c.fillText('Sparkling Lemon 600 mL', 24, 92);", "c.fillText('%s', 24, 92);" % C['productName'].capitalize())
s = s.replace("box(1.8, 2.0, 2.4, lam(0x2350f5), 4.0, 0.4, 0, true, truck);", "box(1.8, 2.0, 2.4, lam(0x2350f5), 4.0, 0.4, 0, true, truck);\nbox(0.6, 0.6, 1.6, lam(0x9fb3d6), -3.2, 2.6, 0, false, truck);")

# ---------- tubs instead of bottles ----------
tubs = r'''/* ---------- tubs ---------- */
var tubMat = lam(0xf1f4f9);
var lidMat = lam(new THREE.Color('%(lid)s').getHex());
var curdMat = lam(0xfbf7ee);
var labelMat = new THREE.MeshLambertMaterial({ color: new THREE.Color('%(label)s').getHex(), side: THREE.DoubleSide });
var labelWrongMat = new THREE.MeshLambertMaterial({ color: new THREE.Color('%(wrongLabel)s').getHex(), side: THREE.DoubleSide });
var codeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
var codeSmudgeMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.45 });
var RT = 0.27, RB = 0.215, TH = 0.32;
var gTub = new THREE.CylinderGeometry(RT, RB, TH, 20); gTub.translate(0, TH / 2, 0);
var gCurd = new THREE.CircleGeometry(RT - 0.02, 20);
var gLid = new THREE.CylinderGeometry(RT + 0.02, RT + 0.02, 0.05, 20);
var gLabel = new THREE.CylinderGeometry(RT - 0.012, RB + 0.03, 0.15, 20, 1, true);
var gLabelTorn = new THREE.CylinderGeometry(RT - 0.012, RB + 0.03, 0.15, 20, 1, true, 0, Math.PI * 1.1);
var gCode = new THREE.PlaneGeometry(0.22, 0.035);
var flagGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.72, 0.6, 0.72));
function makeBottle(){
  var g = new THREE.Group();
  g.add(new THREE.Mesh(gTub, tubMat));
  var liquid = new THREE.Mesh(gCurd, curdMat); liquid.rotation.x = -Math.PI / 2; liquid.position.y = TH - 0.015; g.add(liquid);
  var cap = new THREE.Mesh(gLid, lidMat); cap.position.y = TH + 0.02; g.add(cap);
  var label = new THREE.Mesh(gLabel, labelMat); label.position.y = 0.19; g.add(label);
  var code = new THREE.Mesh(gCode, codeMat); code.position.set(0, 0.065, RB + 0.035); code.rotation.x = -0.17; g.add(code);
  var flag = new THREE.LineSegments(flagGeo, new THREE.LineBasicMaterial({ color: C.alert, transparent: true, opacity: 0 })); flag.position.y = 0.26; g.add(flag);
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
  1: ['lidSkew', 'lidMissing', 'sealLifted'],
  2: ['labelWrong', 'labelCrooked', 'labelTorn', 'labelMissing'],
  3: ['codeWrong', 'codeSmudged', 'codeMissing'],
  any: ['lidSkew', 'labelCrooked', 'labelWrong', 'codeSmudged', 'codeWrong', 'sealLifted', 'labelTorn', 'lidMissing']
};
var poolIdx = 0;
function pick(stop){ var pool = POOLS[stop] || POOLS.any; poolIdx = (poolIdx + 1) %% 997; return pool[poolIdx %% pool.length]; }
function roll(stop){ return Math.random() < (stop >= 1 && stop <= 3 ? 0.22 : 0.1) ? pick(stop) : null; }
function dress(b){
  var d = b.defect || '';
  b.cap.rotation.z = d === 'lidSkew' ? 0.35 : 0; b.cap.position.x = d === 'lidSkew' ? 0.06 : 0;
  b.cap.position.y = TH + (d === 'lidSkew' ? 0.07 : d === 'sealLifted' ? 0.06 : 0.02);
  b.cap.rotation.x = d === 'sealLifted' ? 0.12 : 0;
  b.label.material = d === 'labelWrong' ? labelWrongMat : labelMat;
  b.label.geometry = d === 'labelTorn' ? gLabelTorn : gLabel;
  b.label.rotation.z = d === 'labelCrooked' ? 0.16 : 0;
  b.code.material = d === 'codeSmudged' ? codeSmudgeMat : codeMat;
}
''' % C
a, mid, b = cut(s, '/* ---------- bottles ---------- */', 'var bottles = [];')
s = a + tubs + b
s = s.replace("b.cap.visible = b.x > X_CAP && b.defect !== 'capMissing';", "b.cap.visible = b.x > X_CAP && b.defect !== 'lidMissing';")
s = s.replace("if (packed % 6 === 0 && palletState", "if (packed % 12 === 0 && palletState")
s = s.replace("det.pos.copy(lastFlagged.g.position).setY(lastFlagged.g.position.y + (lastFlagged.kind === 'object' ? 0.7 : 1.5));",
              "det.pos.copy(lastFlagged.g.position).setY(lastFlagged.g.position.y + (lastFlagged.kind === 'object' ? 0.7 : 1.0));")
s = s.replace("'Phase 2: air jet rejects flagged bottles' : 'Phase 1: staff remove flagged bottles'", "'Phase 2: air jet rejects flagged tubs' : 'Phase 1: staff remove flagged tubs'")

# ---------- labels ----------
s = s.replace("['Filler', X_FILLER, 3.2], ['Capper', X_CAP, 2.8], ['Labeller', X_LABEL, 2.4], ['Date coder', X_CODE, 2.6], ['Camera check', X_CAM, 3.0], ['Case packer', X_PACK + 0.9, 2.6], ['Dispatch', 21.5, 3.6]",
              "['%s', -23.5, 2.2], ['Tub filler', X_FILLER, 3.4], ['Lidder', X_CAP, 2.8], ['Labeller', X_LABEL, 2.4], ['Use-by coder', X_CODE, 2.6], ['Camera check', X_CAM, 3.0], ['Case packer', X_PACK + 0.9, 2.6], ['%s', 21.5, 3.6]" % (C['vatsLabel'], C['dispatchLabel']))
s = s.replace("setLabel(scrLab, '', 'Line screen · product and date set at changeover');", "setLabel(scrLab, '', 'Line screen · product and use-by set at changeover');")
a, _, b = cut(s, 'var laterLabs = [', '/* ---------- camera rig ---------- */')
s = a + 'var laterLabs = [];\n\n' + b
s = s.replace("{ p: [-4, 13, 13], t: [-17, 0.5, -1.5] },\n", "")
s = s.replace("{ p: [-6, 14, 17], t: [-21, 0.5, -1] },\n", "")
s = s.replace("coldGlow.material.opacity = 0.1 + 0.05 * Math.sin(time * 1.5) + 0.1 * act[7];", "coldGlow.material.opacity = 0.1 + 0.05 * Math.sin(time * 1.5);\n  stirrers.forEach(function(st, j){ st.position.x = Math.sin(time * 0.5 + j * 1.3) * 0.5; });")
s = s.replace("carousel.rotation.y -= dt * speed * 0.9;\n", "")
s = s.replace("capHead.rotation.y += dt * speed * 6;\n", "")
s = s.replace("laterLabs.forEach(function(l){ placeLabel(l, act[7]); });\n", "")

s = s.replace('aria-label="What happens to a flagged bottle"', 'aria-label="What happens to a flagged tub"')
s = s.replace('{{LOGO}}', logo)
open(sys.argv[2], 'w').write(s)
print('ok', len(s))
