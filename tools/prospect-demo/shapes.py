"""Pack shapes and wording for prospect demo pages.

Each page sets "shape" in its JSON (tub, tray, pouch, flatbag, carton, block, bottle)
and can override any wording key under "vocab". Defaults are the original tub wording.
"""

# 3D size (metres in scene units) and 2D camera-inset layout per shape
SHAPES = {
    'tub':    dict(kind='cyl'),
    'bottle': dict(kind='bottle'),
    'tray':   dict(kind='box', w=0.52, h=0.12, d=0.36, lid='film', label='top'),
    'flatbag':dict(kind='box', w=0.52, h=0.09, d=0.34, lid='end', label='top'),
    'pouch':  dict(kind='box', w=0.34, h=0.50, d=0.18, lid='strip', label='front'),
    'carton': dict(kind='box', w=0.62, h=0.20, d=0.30, lid='cover', label='top'),
    'block':  dict(kind='box', w=0.30, h=0.13, d=0.20, lid='cover', label='top'),
}

# 2D inset: top, bot, width top, width bottom, label y, label h, code y
INSET = {
    'tub':    (120, 300, 214, 168, 150, 92, 272),
    'bottle': (70, 316, 150, 150, 150, 100, 296),
    'tray':   (150, 290, 236, 220, 172, 74, 272),
    'flatbag':(150, 290, 236, 236, 172, 74, 272),
    'pouch':  (96, 312, 190, 200, 140, 110, 284),
    'carton': (140, 296, 236, 224, 168, 80, 274),
    'block':  (150, 290, 210, 210, 172, 74, 272),
}

VOCAB = {
    'unit': 'tub', 'units': 'tubs',
    'c1': 'Lids and seals', 'c1h': 'Lids on, seated and sealed',
    'chips': ['Missing lids', 'Lids not seated', 'Lifted seals'],
    'r1': ['Lid not seated', 'Lid missing', 'Seal lifted'],
    'tag1': 'LID', 'ok': 'Lid, label and code OK',
    'lidder': 'Lidder', 'filler': 'Tub filler', 'coder': 'Use-by coder',
    'alert': 'Four lids not seated in fifteen minutes on Line 1. Check the lidder.',
    'c2': 'Labels',
    'codes': 'Use-by codes', 'codesLong': 'Use-by and batch codes', 'code1': 'Use-by code',
    'codeLower': 'use-by date', 'codeShort': 'use-by', 'smudge': 'USE BY 0? D?C 2? L3?',
    'wrongCode': 'Wrong year: 25 printed, 26 expected',
    'audits': 'food safety audits', 'retailer': 'retailer',
    'labelWrong': 'Wrong label: %(wrong)s on a %(right)s run',
    'r2': ['Label crooked: 5° off', 'Label torn', 'Label missing'],
    'tag2': 'LABEL', 'tag3': 'CODE',
}

def box_js(p):
    """three.js for a box-shaped pack, same interface as the tub (cap, label, code, liquid)."""
    w, h, d = p['w'], p['h'], p['d']
    lid, lab = p['lid'], p['label']
    js = ['var SW = %s, SH = %s, SD = %s, TH = SH;' % (w, h, d),
          'var gTub = new THREE.BoxGeometry(SW, SH, SD); gTub.translate(0, SH / 2, 0);',
          'var gCurd = new THREE.PlaneGeometry(SW - 0.04, SD - 0.04);']
    if lid == 'film':
        js.append('var gLid = new THREE.BoxGeometry(SW + 0.02, 0.012, SD + 0.02); lidMat.transparent = true; lidMat.opacity = 0.55;')
    elif lid == 'end':
        js.append('var gLid = new THREE.BoxGeometry(0.07, SH + 0.02, SD + 0.01); gLid.translate(SW / 2 - 0.035, -SH / 2 + 0.0, 0);')
    elif lid == 'strip':
        js.append('var gLid = new THREE.BoxGeometry(SW + 0.01, 0.06, SD + 0.01);')
    else:
        js.append('var gLid = new THREE.BoxGeometry(SW + 0.02, 0.05, SD + 0.02);')
    if lab == 'top':
        js.append('var gLabel = new THREE.PlaneGeometry(SW * 0.62, SD * 0.62); var gLabelTorn = new THREE.PlaneGeometry(SW * 0.34, SD * 0.62);')
        js.append('var gCode = new THREE.PlaneGeometry(SW * 0.5, 0.03);')
    else:
        js.append('var gLabel = new THREE.PlaneGeometry(SW * 0.8, SH * 0.45); var gLabelTorn = new THREE.PlaneGeometry(SW * 0.42, SH * 0.45);')
        js.append('var gCode = new THREE.PlaneGeometry(SW * 0.6, 0.03);')
    js.append('var flagGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(Math.max(SW, 0.5) + 0.14, SH + 0.32, SD + 0.24));')
    js.append('function makeBottle(){')
    js.append('  var g = new THREE.Group();')
    js.append('  g.add(new THREE.Mesh(gTub, tubMat));')
    js.append('  var liquid = new THREE.Mesh(gCurd, curdMat); liquid.rotation.x = -Math.PI / 2; liquid.position.y = SH + 0.002; g.add(liquid);')
    js.append('  var cap = new THREE.Mesh(gLid, lidMat); cap.position.y = TH + 0.02; g.add(cap);')
    if lab == 'top':
        js.append('  var lg = new THREE.Group(); lg.position.set(-SW * 0.08, SH + 0.03, -SD * 0.04); lg.rotation.x = -Math.PI / 2; g.add(lg);')
        js.append('  var label = new THREE.Mesh(gLabel, labelMat); lg.add(label);')
        js.append('  var code = new THREE.Mesh(gCode, codeMat); code.rotation.x = -Math.PI / 2; code.position.set(-SW * 0.08, SH + 0.031, SD * 0.4); g.add(code);')
    else:
        js.append('  var label = new THREE.Mesh(gLabel, labelMat); label.position.set(0, SH * 0.55, SD / 2 + 0.003); g.add(label);')
        js.append('  var code = new THREE.Mesh(gCode, codeMat); code.position.set(0, SH * 0.16, SD / 2 + 0.004); g.add(code);')
    js.append('  var flag = new THREE.LineSegments(flagGeo, new THREE.LineBasicMaterial({ color: C.alert, transparent: true, opacity: 0 })); flag.position.y = SH / 2; g.add(flag);')
    js.append('  scene.add(g);')
    js.append("  return { kind: 'bottle', g: g, liquid: liquid, cap: cap, label: label, code: code, flag: flag, x: 0, defect: null, checked: false, out: null, t: 0 };")
    js.append('}')
    return '\n'.join(js) + '\n'

BOTTLE_JS = '''var BR = 0.15, BH = 0.5, TH = BH;
var gTub = new THREE.CylinderGeometry(BR, BR * 0.96, BH, 22); gTub.translate(0, BH / 2, 0);
var gCurd = new THREE.CircleGeometry(0.05, 12);
var gLid = new THREE.CylinderGeometry(0.065, 0.075, 0.1, 16);
var gLabel = new THREE.CylinderGeometry(BR + 0.004, BR * 0.96 + 0.004, 0.22, 22, 1, true);
var gLabelTorn = new THREE.CylinderGeometry(BR + 0.004, BR * 0.96 + 0.004, 0.22, 22, 1, true, 0, Math.PI * 0.6);
var gCode = new THREE.PlaneGeometry(0.16, 0.03);
var gShoulder = new THREE.CylinderGeometry(0.07, BR, 0.1, 22); gShoulder.translate(0, BH + 0.05, 0);
var flagGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.6, 0.9, 0.6));
function makeBottle(){
  var g = new THREE.Group();
  g.add(new THREE.Mesh(gTub, tubMat)); g.add(new THREE.Mesh(gShoulder, tubMat));
  var liquid = new THREE.Mesh(gCurd, curdMat); liquid.rotation.x = -Math.PI / 2; liquid.position.y = BH + 0.1; g.add(liquid);
  var cap = new THREE.Mesh(gLid, lidMat); cap.position.y = TH + 0.02; g.add(cap);
  var label = new THREE.Mesh(gLabel, labelMat); label.position.y = 0.26; g.add(label);
  var code = new THREE.Mesh(gCode, codeMat); code.position.set(0, 0.07, BR + 0.006); g.add(code);
  var flag = new THREE.LineSegments(flagGeo, new THREE.LineBasicMaterial({ color: C.alert, transparent: true, opacity: 0 })); flag.position.y = 0.32; g.add(flag);
  scene.add(g);
  return { kind: 'bottle', g: g, liquid: liquid, cap: cap, label: label, code: code, flag: flag, x: 0, defect: null, checked: false, out: null, t: 0 };
}
'''

def geometry_js(shape):
    p = SHAPES[shape]
    if p['kind'] == 'box':
        return box_js(p)
    if p['kind'] == 'bottle':
        return BOTTLE_JS
    return None

def apply_vocab(s, V, C):
    """Swap the tub wording in the finished page for this page's wording."""
    D = VOCAB
    pairs = [
        ("<li>Missing lids</li><li>Lids not seated</li><li>Lifted seals</li>", ''.join('<li>%s</li>' % x for x in V['chips'])),
        (D['c1h'], V['c1h']), (D['c1'], V['c1']), (D['alert'], V['alert']),
        ("'Lid not seated'", "'%s'" % V['r1'][0]), ("'Lid missing'", "'%s'" % V['r1'][1]), ("'Seal lifted'", "'%s'" % V['r1'][2]),
        ("'Label crooked: 5° off'", "'%s'" % V['r2'][0]), ("'Label torn'", "'%s'" % V['r2'][1]), ("'Label missing'", "'%s'" % V['r2'][2]),
        ("? 'LID' :", "? '%s' :" % V['tag1']), ("? 'LABEL' :", "? '%s' :" % V['tag2']), ("? 'CODE' :", "? '%s' :" % V['tag3']),
        (D['ok'], V['ok']), ("['Lidder',", "['%s'," % V['lidder']), ("['Tub filler',", "['%s'," % V['filler']),
        ("['Use-by coder',", "['%s'," % V['coder']),
        (D['codesLong'], V['codesLong']), (D['codes'], V['codes']),
        ("'Use-by code unreadable'", "'%s unreadable'" % V['code1']), ("'Use-by code missing'", "'%s missing'" % V['code1']),
        (D['smudge'], V['smudge']), (D['wrongCode'], V['wrongCode']),
        ('product and use-by date at changeover', 'product and %s at changeover' % V['codeLower']),
        ('product and use-by set at changeover', 'product and %s set at changeover' % V['codeShort']),
        ('food safety audits', V['audits']),
        ('faulty tubs reaching the retailer', 'faulty tubs reaching the %s' % V['retailer']),
        ("'Labels'", "'%s'" % V['c2']), ('<span>Labels</span>', '<span>%s</span>' % V['c2']),
        ('value="Labels" checked>Labels<', 'value="%s" checked>%s<' % (V['c2'], V['c2'])),
    ]
    for a, b in pairs:
        if a != b:
            s = s.replace(a, b)
    if V['units'] != 'tubs':
        import re
        # visible words only: whole words, lower and title case
        for a, b in (('tubs', V['units']), ('tub', V['unit']), ('Tubs', V['units'].capitalize()), ('Tub', V['unit'].capitalize())):
            s = re.sub(r'(?<![A-Za-z_.$])%s(?![A-Za-z_])' % a, b, s)
    return s
