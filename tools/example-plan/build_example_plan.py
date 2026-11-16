"""Builds site/example/plan.html: the example full solution plan for Riverbend Drinks (a made-up company)."""
import re, os
SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'site'))
fonts = '\n'.join(l for l in re.findall(r'@font-face \{[^}]*\}', open(SITE + '/contact.html').read()))

# ---------------- trial path ----------------
# One strip across the calendar, then one row per stage. Weeks start Monday 23 Nov 2026.
WEEKS_TOTAL = 15
STRIP = [  # (label, start week, end week, kind)
  ('Visit', 0, 1, 'v'), ('Free check', 1, 4, 'b'), ('Shutdown', 4, 7, 'shut'), ('Prepare', 7, 9, 'v'),
  ('Set-up', 9, 10, 'b'), ('Trial', 10, 14, 't'), ('Decide', 14, 15, 'v'),
]
MONTHS = [('Nov', 0), ('Dec', 1.3), ('Jan', 5.7), ('Feb', 10), ('Mar', 14)]
MILESTONES = [('Trial agreed', 3), ('Trial starts', 10), ('Decision', 14.6)]
STAGES = [  # (dates, title, what happens, who, your time, milestone)
  ('Week of 23 Nov', 'Call and site visit', 'We watch Line 1 run, check the power points and mark where each camera goes.', 'v', '2 hours', ''),
  ('30 Nov to 18 Dec', 'Free feasibility check', 'You send good bottles and known faults for each juice. We show the cameras catching them, then send a fixed price for the trial.', 'b', '4 hours', 'Trial agreed by 18 Dec'),
  ('21 Dec to 8 Jan', 'Your Christmas shutdown', 'Nothing needed from you.', 'shut', 'None', ''),
  ('11 to 22 Jan', 'Prepare the trial kit', 'We set up a loan kit for station B and train the label and code checks on your sample bottles.', 'v', 'None', ''),
  ('27 to 30 Jan', 'Set-up day and tuning', 'One day on site to clamp on and plug in station B while the line runs, then a few days cutting false alarms.', 'b', '3 hours', ''),
  ('2 to 27 Feb', 'Four-week trial, alerts only', 'Every bottle&rsquo;s label and code checked. Your QC lead reviews flagged bottles on the screen, about 15 minutes a shift. A report every Friday.', 't', '10 hours', 'Trial starts 2 Feb'),
  ('2 to 5 Mar', 'Review and decide', 'We go through the results against the agreed targets. If you go ahead, the trial fee comes off the purchase, station B stays and we add station A.', 'v', '1.5 hours', 'Decision by 5 Mar'),
]
WHO = {'v': 'Vantory', 'b': 'Together', 't': 'Trial running', 'shut': 'Site shutdown'}

def path_html():
    pct = lambda w: '%.2f%%' % (w / WEEKS_TOTAL * 100)
    seg = ''.join('<span class="sg %s" style="left:%s;width:%s"><b>%s</b></span>' % (k, pct(a), pct(b - a), l) for l, a, b, k in STRIP)
    ms = ''.join('<span class="mk" style="left:%s"><i></i><em>%s</em></span>' % (pct(w), l) for l, w in MILESTONES)
    mo = ''.join('<span style="left:%s">%s</span>' % (pct(w), m) for m, w in MONTHS)
    strip = '<div class="strip" aria-hidden="true"><div class="months">%s</div><div class="bar">%s</div><div class="marks">%s</div></div>' % (mo, seg, ms)
    rows = []
    for i, (d, t, w, who, you, m) in enumerate(STAGES):
        mtag = '<span class="ms-tag">%s</span>' % m if m else ''
        rows.append('<li class="stg %s"><p class="when">%s</p><span class="dot" aria-hidden="true">%d</span><div class="what"><h3>%s</h3><p>%s</p><p class="tags"><span class="who %s">%s</span><span class="you">Your team: <b>%s</b></span>%s</p></div></li>' % (
            who, d, i + 1, t, w, who, WHO[who], you, mtag))
    return strip + '<ol class="stages">' + ''.join(rows) + '</ol>'

# ---------------- costs ----------------
def money(n): return 'A$' + format(n, ',')
TRIAL = [  # one station on loaned equipment
  ('Loan of the camera kit for 6 weeks', '2 cameras, lights, clamp-on mounts, AI unit, tower light and screen. We take it back if you stop', 800, 1200),
  ('Setting up the label and code checks', 'Teaching the system your 3 juices, labels and best-before codes', 2500, 3000),
  ('Set-up day on site', 'Clamp on, plug in and test station B while the line runs', 800, 1000),
  ('Four-week trial, weekly reports and results review', 'Remote monitoring, tuning and a review on site', 1400, 1800),
]
BUY = [  # both stations, owned by the client
  ('Hardware', [
    ('Industrial cameras and lenses', '3 cameras: 2 at station B, 1 at station A', '3 &times; A$1,200 to A$1,500', 3600, 4500),
    ('Lighting', 'Two bar lights at B; a backlight for fill level at A', '', 1200, 1600),
    ('Clamp-on mounts and washdown covers', 'Both stations. No drilling, welding or wiring', '', 900, 1100),
    ('On-site AI unit', 'Runs every check beside the line and plugs into a power point. Takes up to 6 cameras', '', 3500, 4000),
    ('Plug-in power hub, sensors, tower lights and screen', 'One hub powers the cameras over their data cables, so nothing is hardwired', '', 1500, 1800),
  ]),
  ('Set-up and software', [
    ('Setting up station A', 'Cap and fill checks. Station B&rsquo;s checks carry over from the trial', '', 2000, 2500),
    ('Set-up day for station A', 'Clamp on and plug in while the line runs', '', 800, 1000),
    ('Software licence, first 12 months', 'Covers 3 cameras, updates and new labels as you add products', '', 4000, 4500),
  ]),
]
def money(n): return 'A$' + format(n, ',')
def costs():
    tlo = sum(i[2] for i in TRIAL); thi = sum(i[3] for i in TRIAL)
    t = ['<table class="costs"><thead><tr><th scope="col">Step 2: the trial</th><th scope="col" class="amt">Low</th><th scope="col" class="amt">High</th></tr></thead><tbody>']
    for name, det, lo, hi in TRIAL:
        t.append('<tr><td class="item"><b>%s</b><span>%s</span></td><td class="amt">%s</td><td class="amt">%s</td></tr>' % (name, det, money(lo), money(hi)))
    t.append('</tbody><tbody><tr class="total"><td>Trial fee, excluding GST</td><td class="amt">%s</td><td class="amt">%s</td></tr></tbody></table>' % (money(tlo), money(thi)))
    blo = bhi = 0
    p = ['<table class="costs"><thead><tr><th scope="col">Step 3: if you go ahead</th><th scope="col" class="amt">Low</th><th scope="col" class="amt">High</th></tr></thead>']
    for grp, items in BUY:
        p.append('<tbody><tr class="grp"><th scope="rowgroup" colspan="3">%s</th></tr>' % grp)
        for name, det, unit, lo, hi in items:
            u = '<em>%s</em>' % unit if unit else ''
            p.append('<tr><td class="item"><b>%s</b><span>%s</span>%s</td><td class="amt">%s</td><td class="amt">%s</td></tr>' % (name, det, u, money(lo), money(hi)))
            blo += lo; bhi += hi
        p.append('</tbody>')
    p.append('<tbody><tr class="sub"><td>Purchase total, excluding GST</td><td class="amt">%s</td><td class="amt">%s</td></tr>' % (money(blo), money(bhi)))
    p.append('<tr class="sub credit"><td>Less your trial fee</td><td class="amt">&minus;%s</td><td class="amt">&minus;%s</td></tr>' % (money(tlo), money(thi)))
    p.append('<tr class="total"><td>Left to pay after the trial</td><td class="amt">%s</td><td class="amt">%s</td></tr></tbody></table>' % (money(blo - tlo), money(bhi - thi)))
    return ''.join(t), ''.join(p), tlo, thi, blo, bhi
TRIAL_T, BUY_T, TLO, THI, BLO, BHI = costs()
assert (TLO, THI, BLO, BHI) == (5500, 7000, 17500, 21000), (TLO, THI, BLO, BHI)

# ---------------- line diagram ----------------
def machine(x, y, w, label, sub=''):
    t = '<g class="m"><rect x="%d" y="%d" width="%d" height="54" rx="9"/><text x="%d" y="%d" class="ml">%s</text>' % (x - w // 2, y - 27, w, x, y + (0 if sub else 5), label)
    if sub: t += '<text x="%d" y="%d" class="ms">%s</text>' % (x, y + 15, sub)
    return t + '</g>'
def station(x, y, letter, label, sub, later=False, up=True, cams=1):
    cls = 'st later' if later else 'st'
    cone_y0 = y - 27 if up else y + 27
    cam_y = y - 78 if up else y + 78
    d = 1 if up else -1
    cone = '<path class="cone" id="cone-%s" d="M%d %d L%d %d L%d %d L%d %d Z"/>' % (letter, x - 10, cam_y + 12 * d, x + 10, cam_y + 12 * d, x + 40, cone_y0 + 6 * d, x - 40, cone_y0 + 6 * d)
    camicons = ''
    for o in ([0] if cams == 1 else [-16, 16]):
        camicons += '<g class="cam"><rect x="%d" y="%d" width="22" height="16" rx="3"/><circle cx="%d" cy="%d" r="4.5"/></g>' % (x + o - 11, cam_y - 8, x + o, cam_y)
    badge = '<g class="badge"><circle cx="%d" cy="%d" r="13"/><text x="%d" y="%d">%s</text></g>' % (x + 52, cam_y, x + 52, cam_y + 5, letter)
    light = '<g class="tower"><rect x="%d" y="%d" width="10" height="26" rx="3"/><circle class="lt" id="light-%s" cx="%d" cy="%d" r="4"/></g>' % (x - 82, cam_y - 13, letter, x - 77, cam_y)
    body = '<g class="%s"><rect x="%d" y="%d" width="104" height="54" rx="9"/><text x="%d" y="%d" class="ml">%s</text><text x="%d" y="%d" class="ms">%s</text></g>' % (cls, x - 52, y - 27, x, y - 1, label, x, y + 15, sub)
    pop_y = cam_y - 34 if up else cam_y + 22
    pop = '<g class="pop" id="pop-%s"><rect x="%d" y="%d" width="150" height="26" rx="13"/><text x="%d" y="%d"></text></g>' % (letter, x - 75, pop_y, x, pop_y + 17)
    return '<g>' + cone + camicons + badge + light + body + '</g>', pop

def diagram():
    W, H = 1040, 520
    y1, y2 = 150, 380
    pops = []
    p = ['<svg id="line-svg" viewBox="0 0 %d %d" role="img" aria-labelledby="dg-t dg-d" xmlns="http://www.w3.org/2000/svg"><title id="dg-t">Line 1 layout with camera stations</title><desc id="dg-d">Bottles run left to right past the filler, capper, station A, labeller and date coder, turn, then run right to left past station B, the reject point, the case packer, station C and the palletiser. An on-site AI unit in the middle connects to every station and to a line-side screen.</desc>' % (W, H)]
    p.append('<defs><pattern id="belt" width="18" height="22" patternUnits="userSpaceOnUse"><rect width="18" height="22" fill="#E3E8F2"/><path d="M5 5 L11 11 L5 17" fill="none" stroke="#C3CBDB" stroke-width="2"/></pattern><pattern id="beltL" width="18" height="22" patternUnits="userSpaceOnUse"><rect width="18" height="22" fill="#E3E8F2"/><path d="M13 5 L7 11 L13 17" fill="none" stroke="#C3CBDB" stroke-width="2"/></pattern><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#E9EDF5" stroke-width="1"/></pattern></defs>')
    p.append('<rect width="%d" height="%d" fill="url(#grid)"/>' % (W, H))
    p.append('<rect x="40" y="%d" width="900" height="22" rx="4" fill="url(#belt)"/>' % (y1 - 11))
    p.append('<rect x="80" y="%d" width="860" height="22" rx="4" fill="url(#beltL)"/>' % (y2 - 11))
    p.append('<path d="M940 %d a 115 115 0 0 1 0 %d" fill="none" stroke="#E3E8F2" stroke-width="22"/>' % (y1, y2 - y1))
    ai = (520, 265)
    for nid, (x, y) in [('A', (330, y1 - 78)), ('B', (800, y2 + 78)), ('C', (420, y2 + 78)), ('R', (680, y2 - 40))]:
        p.append('<path class="net" id="net-%s" d="M%d %d L%d %d"/>' % (nid, ai[0], ai[1], x, y))
    p.append('<path class="net" id="net-S" d="M%d %d L%d %d"/>' % (ai[0], ai[1], 760, 265))
    # moving bottles and cases sit on the belt, under the machines
    p.append('<g id="bottles"></g><g id="cases"></g>')
    p.append('<text x="40" y="%d" class="lab">BOTTLE INFEED</text>' % (y1 - 40))
    p.append(machine(130, y1, 100, 'Filler', '3 juices'))
    p.append(machine(240, y1, 90, 'Capper'))
    g, pop = station(355, y1, 'A', 'Cap and fill', '1 camera &middot; after trial', later=True); p.append(g); pops.append(pop)
    p.append(machine(500, y1, 100, 'Labeller'))
    p.append(machine(630, y1, 110, 'Date coder', 'BB and batch'))
    p.append('<text x="780" y="%d" class="speed">&asymp; 50 bottles a minute</text>' % (y1 - 30))
    g, pop = station(800, y2, 'B', 'Label and code', '2 cameras', up=False, cams=2); p.append(g); pops.append(pop)
    p.append('<g class="rej" id="rej"><rect x="640" y="%d" width="80" height="54" rx="9"/><text x="680" y="%d" class="ml">Reject</text><text x="680" y="%d" class="ms" id="rej-sub">later</text></g>' % (y2 - 27, y2 - 1, y2 + 15))
    p.append('<g class="bin"><rect x="656" y="%d" width="48" height="26" rx="5"/><text x="680" y="%d">bin</text></g>' % (y2 - 66, y2 - 49))
    p.append(machine(540, y2, 110, 'Case packer', '12 per case'))
    g, pop = station(420, y2, 'C', 'Case check', '1 camera &middot; later', later=True, up=False); p.append(g); pops.append(pop)
    p.append(machine(270, y2, 110, 'Palletiser'))
    p.append('<text x="80" y="%d" class="lab">CHILLED DISPATCH</text>' % (y2 + 44))
    p.append('<g class="ai" id="ai"><rect x="%d" y="%d" width="150" height="62" rx="11"/><text x="%d" y="%d" class="ml w">On-site AI unit</text><text x="%d" y="%d" class="ms w">plugs into a power point</text></g>' % (ai[0] - 75, ai[1] - 31, ai[0], ai[1] - 3, ai[0], ai[1] + 15))
    p.append('<g class="scr"><rect x="760" y="236" width="128" height="58" rx="8"/><text x="824" y="256" class="ml">Line-side screen</text><text x="824" y="274" class="ms" id="scr-count">Checked 0</text><text x="824" y="288" class="ms flagtxt" id="scr-flag">Flagged 0</text></g>')
    p.extend(pops)
    p.append('</svg>')
    return ''.join(p)

STATIONS = [
  ('B', 'Label and code', 'After the date coder', '2 cameras on one clamp-on frame, front and back, so the label is read all the way round', ['Wrong label for the run', 'Label crooked, torn or missing', 'Best-before date and batch code missing, smudged or wrong'], 'Trial'),
  ('A', 'Cap and fill', 'After the capper', '1 camera on a clamp-on mount, side view with a backlight', ['Cap missing or not seated', 'Cap crooked', 'Fill below the line'], 'After trial'),
  ('C', 'Case check', 'Over the case packer', '1 camera, top view, clamp-on and plug-in', ['Missing or fallen bottles in a case', 'Wrong count before sealing'], 'Later'),
]
def station_cards():
    o = []
    for l, n, where, cam, faults, ph in STATIONS:
        o.append('<article class="stc%s"><header><span class="bdg">%s</span><div><b>%s</b><span>%s</span></div><em class="%s">%s</em></header><p>%s</p><ul>%s</ul></article>' % (
            ' later' if ph != 'Trial' else '', l, n, where, {'Trial': 'tr', 'After trial': 'at'}.get(ph, 'ph2'), ph, cam, ''.join('<li>%s</li>' % f for f in faults)))
    return ''.join(o)

logo_dark = '<img src="/assets/vantory-logo-dark.svg" alt="Vantory Technologies" width="190" height="31">'
ARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

css = open(os.path.join(os.path.dirname(__file__), 'example-plan.css')).read()
body = open(os.path.join(os.path.dirname(__file__), 'example-plan-body.html')).read()
for k, v in {'{{LOGO}}': logo_dark, '{{DIAGRAM}}': diagram(), '{{STATIONS}}': station_cards(), '{{PATH}}': path_html(), '{{TRIALCOSTS}}': TRIAL_T, '{{BUYCOSTS}}': BUY_T, '{{ARR}}': ARR}.items():
    assert k in body, k
    body = body.replace(k, v)
page = '''<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Example Full Plan · Vantory Technologies</title>
<meta name="description" content="An example of the free full solution plan from Vantory Technologies: 3D preview, line layout with camera stations, trial timeline, indicative costs and savings.">
<link rel="icon" href="/assets/vantory-favicon.svg" type="image/svg+xml">
<script src="/assets/plausible-init.js"></script>
<script async src="https://plausible.io/js/pa-cBmSDXMl1zdkkjd0z-Frh.js"></script>
<style>
''' + fonts + '\n' + css + '''</style>
</head>
<body>
''' + body + '''
<script src="/assets/example-plan.js"></script>
</body>
</html>
'''
os.makedirs(SITE + '/example', exist_ok=True)
open(SITE + '/example/plan.html', 'w').write(page)
print('example plan', len(page))
