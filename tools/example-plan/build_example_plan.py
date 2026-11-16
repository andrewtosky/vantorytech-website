"""Builds site/example/plan.html: the example full solution plan for Riverbend Drinks (a made-up company)."""
import re, os
SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'site'))
fonts = '\n'.join(l for l in re.findall(r'@font-face \{[^}]*\}', open(SITE + '/contact.html').read()))

# ---------------- trial path (Gantt) ----------------
WEEKS = ['23 Nov', '30 Nov', '7 Dec', '14 Dec', '21 Dec', '28 Dec', '4 Jan', '11 Jan', '18 Jan', '25 Jan', '1 Feb', '8 Feb', '15 Feb', '22 Feb', '1 Mar']
SHUT = {4, 5}  # site shutdown over Christmas
PHASES = [
  ('Prepare', [
    ('Call and site visit', 'We watch Line 1 run and mark the three camera positions', 'v', 0, 0, '2 h'),
    ('Feasibility check and fixed proposal', 'Lighting and lens tests on your bottles; fixed trial price and targets', 'v', 1, 2, '1 h'),
    ('Sample bottles and fault examples', 'Good bottles plus known faults for each of your three juices', 'c', 3, 3, '4 h'),
  ]),
  ('Build', [
    ('Hardware ordered, built and bench tested', 'Cameras, lights and AI unit staged in Melbourne. Lead time runs through the shutdown', 'v', 3, 7, ''),
    ('Checks trained on your products', 'Cap, fill, label and code models trained and tested off the line', 'v', 6, 8, ''),
  ]),
  ('Install', [
    ('Install stations A and B', 'Two half-day maintenance windows, with your maintenance team', 'b', 8, 8, '4 h'),
    ('Tune and cut false alarms', 'Running on live production, alerts only', 'v', 9, 9, '1 h'),
  ]),
  ('Trial', [
    ('Four-week trial, alerts only', 'Every bottle checked. Weekly report: bottles checked, faults caught, false alarms', 't', 10, 13, ''),
    ('QC lead reviews flagged bottles', 'About 15 minutes a shift, using the line-side screen', 'c', 10, 13, '10 h'),
  ]),
  ('Decide', [
    ('Results review and decision', 'Results against the agreed targets, then the phase 2 option', 'v', 14, 14, '1.5 h'),
  ]),
]
MILESTONES = {2: 'Proposal signed', 10: 'Trial starts', 14: 'Decision'}

def gantt():
    head = '<tr><th class="step" scope="col">Step</th>' + ''.join(
        '<th class="wk%s" scope="col"><span>%s</span><span>%s</span></th>' % (' shut' if i in SHUT else '', w.split()[0], w.split()[1]) for i, w in enumerate(WEEKS)) + '<th class="you" scope="col">Your team</th></tr>'
    ms = '<tr class="ms"><td class="step"></td>' + ''.join(
        '<td class="%s">%s</td>' % ('shut' if i in SHUT else '', ('<span class="dia" title="%s"></span><em>%s</em>' % (MILESTONES[i], MILESTONES[i])) if i in MILESTONES else '') for i in range(len(WEEKS))) + '<td></td></tr>'
    rows = []
    for ph, steps in PHASES:
        rows.append('<tr class="phase"><th colspan="%d" scope="rowgroup">%s</th></tr>' % (len(WEEKS) + 2, ph))
        for t, d, who, a, b, hrs in steps:
            cells = []
            for i in range(len(WEEKS)):
                cls = 'shut' if i in SHUT else ''
                inner = ''
                if a <= i <= b:
                    edge = (' s' if i == a else '') + (' e' if i == b else '')
                    inner = '<i class="bar %s%s"></i>' % (who, edge)
                cells.append('<td class="c %s">%s</td>' % (cls, inner))
            rows.append('<tr><td class="step"><b>%s</b><span>%s</span></td>%s<td class="you">%s</td></tr>' % (t, d, ''.join(cells), hrs or '<span>&ndash;</span>'))
    return '<table><thead>' + head + ms + '</thead><tbody>' + ''.join(rows) + '</tbody></table>'

# ---------------- costs ----------------
def money(n): return 'A$' + format(n, ',')
TRIAL = [
  ('Hardware', [
    ('Industrial cameras and lenses', '3 cameras: 1 at station A, 2 at station B to read labels all the way round', '3 &times; A$3,000 to A$4,500', 9000, 13500),
    ('Lighting', 'Backlight for fill level at A; two bar lights at B', '', 3000, 5000),
    ('Mounts, hoods and washdown enclosures', 'Stainless brackets and IP65 housings for both stations', '2 stations', 4000, 6000),
    ('On-site AI unit', 'Runs all checks beside the line. Takes up to 6 cameras, so station C needs no second unit', '', 4000, 6500),
    ('Sensors, tower lights and line-side screen', 'Bottle triggers, a red/green light per station and one screen for the QC lead', '', 2000, 3000),
  ]),
  ('Set-up and trial', [
    ('Setting up the checks', 'Teaching the system your 3 juices, labels, codes and known faults', '', 8000, 12000),
    ('Install and commissioning', 'Two half-day windows on site, licensed electrician included', '', 6000, 9000),
    ('Four-week trial and weekly reports', 'Remote monitoring, tuning and a results review on site', '', 4000, 6000),
  ]),
  ('Software', [
    ('Software licence, first 12 months', 'Covers 3 cameras, updates and new labels as you add products', '', 6000, 9000),
  ]),
]
LATER = [
  ('Automatic reject', '2 air-jet rejectors and reject bins, connected to your line controller', 9000, 14000),
  ('Station C: case check', '1 camera over the case packer: missing or fallen bottles before a case is sealed', 12000, 18000),
  ('Software and support from year 2', 'For 4 cameras, including new products and labels', 7500, 11000),
]
def costs():
    out = ['<table class="costs"><thead><tr><th scope="col">Item</th><th scope="col" class="amt">Low</th><th scope="col" class="amt">High</th></tr></thead>']
    lo_t = hi_t = 0
    for grp, items in TRIAL:
        lo_g = sum(i[3] for i in items); hi_g = sum(i[4] for i in items)
        lo_t += lo_g; hi_t += hi_g
        out.append('<tbody><tr class="grp"><th scope="rowgroup" colspan="3">%s</th></tr>' % grp)
        for name, det, unit, lo, hi in items:
            u = '<em>%s</em>' % unit if unit else ''
            out.append('<tr><td class="item"><b>%s</b><span>%s</span>%s</td><td class="amt">%s</td><td class="amt">%s</td></tr>' % (name, det, u, money(lo), money(hi)))
        out.append('<tr class="sub"><td>%s subtotal</td><td class="amt">%s</td><td class="amt">%s</td></tr></tbody>' % (grp, money(lo_g), money(hi_g)))
    out.append('<tbody><tr class="total"><td>Trial total, excluding GST</td><td class="amt">%s</td><td class="amt">%s</td></tr></tbody></table>' % (money(lo_t), money(hi_t)))
    later = ['<table class="costs later"><thead><tr><th scope="col">After the trial, if you go ahead</th><th scope="col" class="amt">Low</th><th scope="col" class="amt">High</th></tr></thead><tbody>']
    for name, det, lo, hi in LATER:
        later.append('<tr><td class="item"><b>%s</b><span>%s</span></td><td class="amt">%s</td><td class="amt">%s</td></tr>' % (name, det, money(lo), money(hi)))
    later.append('</tbody></table>')
    return ''.join(out), ''.join(later), lo_t, hi_t
COSTS, LATER_T, TLO, THI = costs()
assert (TLO, THI) == (46000, 70000), (TLO, THI)

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
    cone = '<path class="cone" d="M%d %d L%d %d L%d %d L%d %d Z"/>' % (x - 10, cam_y + 12 * d, x + 10, cam_y + 12 * d, x + 40, cone_y0 + 6 * d, x - 40, cone_y0 + 6 * d)
    camicons = ''
    offs = [0] if cams == 1 else [-16, 16]
    for o in offs:
        camicons += '<g class="cam"><rect x="%d" y="%d" width="22" height="16" rx="3"/><circle cx="%d" cy="%d" r="4.5"/></g>' % (x + o - 11, cam_y - 8, x + o, cam_y)
    badge = '<g class="badge"><circle cx="%d" cy="%d" r="13"/><text x="%d" y="%d">%s</text></g>' % (x + 52, cam_y, x + 52, cam_y + 5, letter)
    body = '<g class="%s"><rect x="%d" y="%d" width="104" height="54" rx="9"/><text x="%d" y="%d" class="ml">%s</text><text x="%d" y="%d" class="ms">%s</text></g>' % (cls, x - 52, y - 27, x, y - 1, label, x, y + 15, sub)
    return '<g>' + cone + camicons + badge + body + '</g>'

def diagram():
    W, H = 1040, 520
    y1, y2 = 150, 380
    p = ['<svg viewBox="0 0 %d %d" role="img" aria-labelledby="dg-t dg-d" xmlns="http://www.w3.org/2000/svg"><title id="dg-t">Line 1 layout with camera stations</title><desc id="dg-d">Bottles run left to right past the filler, capper, station A, labeller and date coder, turn, then run right to left past station B, the reject point, the case packer, station C and the palletiser. An on-site AI unit in the middle connects to every station and to a line-side screen.</desc>' % (W, H)]
    p.append('<defs><pattern id="belt" width="18" height="22" patternUnits="userSpaceOnUse"><rect width="18" height="22" fill="#E3E8F2"/><path d="M5 5 L11 11 L5 17" fill="none" stroke="#C3CBDB" stroke-width="2"/></pattern><pattern id="beltL" width="18" height="22" patternUnits="userSpaceOnUse"><rect width="18" height="22" fill="#E3E8F2"/><path d="M13 5 L7 11 L13 17" fill="none" stroke="#C3CBDB" stroke-width="2"/></pattern><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#E9EDF5" stroke-width="1"/></pattern></defs>')
    p.append('<rect width="%d" height="%d" fill="url(#grid)"/>' % (W, H))
    # conveyors
    p.append('<rect x="40" y="%d" width="900" height="22" rx="4" fill="url(#belt)"/>' % (y1 - 11))
    p.append('<rect x="80" y="%d" width="860" height="22" rx="4" fill="url(#beltL)"/>' % (y2 - 11))
    p.append('<path d="M940 %d a 115 115 0 0 1 0 %d" fill="none" stroke="#E3E8F2" stroke-width="22"/>' % (y1, y2 - y1))
    # network lines (drawn first)
    ai = (520, 265)
    for (x, y) in [(330, y1 - 78), (800, y2 + 78), (420, y2 + 78), (680, y2 - 40)]:
        p.append('<path class="net" d="M%d %d L%d %d"/>' % (ai[0], ai[1], x, y))
    p.append('<path class="net" d="M%d %d L%d %d"/>' % (ai[0], ai[1], 760, 265))
    # row 1, left to right
    p.append('<text x="40" y="%d" class="lab">BOTTLE INFEED</text>' % (y1 - 40))
    p.append(machine(130, y1, 100, 'Filler', '3 juices'))
    p.append(machine(240, y1, 90, 'Capper'))
    p.append(station(330 + 25, y1, 'A', 'Cap and fill', '1 camera'))
    p.append(machine(500, y1, 100, 'Labeller'))
    p.append(machine(630, y1, 110, 'Date coder', 'BB and batch'))
    p.append('<text x="780" y="%d" class="speed">&asymp; 50 bottles a minute</text>' % (y1 - 30))
    # row 2, right to left
    p.append(station(800, y2, 'B', 'Label and code', '2 cameras', up=False, cams=2))
    p.append('<g class="rej"><rect x="640" y="%d" width="80" height="54" rx="9"/><text x="680" y="%d" class="ml">Reject</text><text x="680" y="%d" class="ms">phase 2</text></g>' % (y2 - 27, y2 - 1, y2 + 15))
    p.append('<g class="bin"><rect x="656" y="%d" width="48" height="26" rx="5"/><text x="680" y="%d">bin</text></g>' % (y2 - 66, y2 - 49))
    p.append(machine(540, y2, 110, 'Case packer', '12 per case'))
    p.append(station(420, y2, 'C', 'Case check', '1 camera &middot; phase 2', later=True, up=False))
    p.append(machine(270, y2, 110, 'Palletiser'))
    p.append('<text x="80" y="%d" class="lab">CHILLED DISPATCH</text>' % (y2 + 44))
    # AI unit and screen
    p.append('<g class="ai"><rect x="%d" y="%d" width="150" height="62" rx="11"/><text x="%d" y="%d" class="ml w">On-site AI unit</text><text x="%d" y="%d" class="ms w">footage stays on site</text></g>' % (ai[0] - 75, ai[1] - 31, ai[0], ai[1] - 3, ai[0], ai[1] + 15))
    p.append('<g class="scr"><rect x="760" y="240" width="120" height="50" rx="8"/><text x="820" y="262" class="ml">Line-side screen</text><text x="820" y="278" class="ms">+ tower lights</text></g>')
    p.append('</svg>')
    return ''.join(p)

STATIONS = [
  ('A', 'Cap and fill', 'After the capper', '1 camera, side view with a backlight', ['Cap missing or not seated', 'Cap crooked', 'Fill below the line'], 'Trial'),
  ('B', 'Label and code', 'After the date coder', '2 cameras, front and back, so the label is read all the way round', ['Wrong label for the run', 'Label crooked, torn or missing', 'Best-before date and batch code missing, smudged or wrong'], 'Trial'),
  ('C', 'Case check', 'Over the case packer', '1 camera, top view', ['Missing or fallen bottles in a case', 'Wrong count before sealing'], 'Phase 2'),
]
def station_cards():
    o = []
    for l, n, where, cam, faults, ph in STATIONS:
        o.append('<article class="stc%s"><header><span class="bdg">%s</span><div><b>%s</b><span>%s</span></div><em class="%s">%s</em></header><p>%s</p><ul>%s</ul></article>' % (
            ' later' if ph != 'Trial' else '', l, n, where, 'ph2' if ph != 'Trial' else 'tr', ph, cam, ''.join('<li>%s</li>' % f for f in faults)))
    return ''.join(o)

logo_dark = '<img src="/assets/vantory-logo-dark.svg" alt="Vantory Technologies" width="190" height="31">'
ARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

css = open(os.path.join(os.path.dirname(__file__), 'example-plan.css')).read()
body = open(os.path.join(os.path.dirname(__file__), 'example-plan-body.html')).read()
for k, v in {'{{LOGO}}': logo_dark, '{{DIAGRAM}}': diagram(), '{{STATIONS}}': station_cards(), '{{GANTT}}': gantt(), '{{COSTS}}': COSTS, '{{LATER}}': LATER_T, '{{ARR}}': ARR}.items():
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
