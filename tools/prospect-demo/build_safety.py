"""Builds a safety-floor demo page (2D factory plan) for prospects without a packing line.

Preview: python3 build_safety.py companies/jayco.json out/jayco.html
Publish: python3 build_safety.py companies/jayco.json --publish <slug>-<code>
"""
import json, os, re, sys, html
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, '..', '..', 'site'))
cfg = json.load(open(sys.argv[1]))
e = html.escape
base = open(os.path.join(HERE, 'base-line.html')).read()
basecss = re.search(r'<style>\n(.*?)</style>', base, re.S).group(1)
basecss = re.sub(r'^/\* Layout:.*?\*/\n', '', basecss)
logo = open(os.path.join(HERE, 'vantory-logo.svg')).read().strip()
tpl = open(os.path.join(HERE, 'safety-floor.html')).read()
js = open(os.path.join(HERE, 'safety-floor.js')).read()
jscfg = {k: cfg[k] for k in ['machines', 'report', 'stations', 'shop', 'shopLabel', 'lineLabel', 'yardLabel', 'nearWhere', 'zoneWhere', 'ppeWhere', 'okWhere', 'machPill', 'machFeed']}
js = js.replace('/*CFG*/{}', json.dumps(jscfg, ensure_ascii=False))
rep = {
 'TITLE': e(cfg['pageTitle']), 'COMPANY': e(cfg['company']), 'SHORT': e(cfg['short']), 'HEADLINE': e(cfg['headline']),
 'HEROLEDE': e(cfg['heroLede']), 'FORKLEDE': e(cfg['forkLede']), 'ZONELEDE': e(cfg['zoneLede']), 'PPELEDE': e(cfg['ppeLede']),
 'MACHLEDE': e(cfg['machLede']), 'MACHALERT': e(cfg['machAlert']), 'VISIT': e(cfg['visit']),
 'AREAS': ''.join('<option>%s</option>' % e(a) for a in cfg['areas']),
 'LATER': '\n        '.join('<li><b>%s</b><span>%s</span></li>' % (e(a), e(b)) for a, b in cfg['later']),
 'LOGO': logo, 'BASECSS': basecss,
}
s = tpl
for k, v in rep.items():
    s = s.replace('{{%s}}' % k, v)
for banned in ['—', '–', 'ADTTech', 'China', 'Suzhou']:
    assert banned not in s.replace(basecss, '') and banned not in js, banned
if len(sys.argv) > 3 and sys.argv[2] == '--publish':
    slug = sys.argv[3]
    company = cfg['company']
    send = r'''var data = {token: 'vantory-site-2026', subject: 'Demo page enquiry: %s', from_name: 'Vantory demo page', page: 'for/%s',
    name: name, role: $('t-role').value.trim(), email: email, company: $('t-company').value, area: $('t-area').value,
    checks_wanted: Array.prototype.map.call(document.querySelectorAll('input[name="t-check"]:checked'), function(c){ return c.value; }).join(', '),
    notes: $('t-notes').value.trim()};
  var btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; st.className = 'status'; st.textContent = 'Sending...';
  fetch('https://script.google.com/macros/s/AKfycbzi5j4yWk1y53HibXQxnsSc7mN-UivqlgG_SugqmqijTkWoIpDJs4at8_8Il_UaR8Ui/exec', {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(data)})
    .then(function(r){ return r.json(); })
    .then(function(res){ if (!res || !res.ok) throw new Error(res && res.message ? res.message : 'not sent');
      st.className = 'status ok'; st.textContent = 'Thanks, ' + first + '. We have your details and will email you a trial plan within one business day.'; })
    .catch(function(err){ st.className = 'status err'; st.textContent = 'Sorry, that did not send (' + (err && err.message ? err.message : 'no reply') + '). Please try again, or email enquiries@vantorytech.com.'; })
    .then(function(){ btn.disabled = false; });
  return;''' % (company.replace("'", "\\'"), slug)
    js = js.replace('/*SEND*/', send)
    contact = open(os.path.join(SITE, 'contact.html')).read()
    fonts = '\n'.join(re.findall(r'@font-face \{[^}]*\}', contact))
    s = s.replace('<style>', '<style>\n' + fonts + '\n', 1)
    s = s.replace('<meta name="robots" content="noindex, nofollow">',
        '<meta name="robots" content="noindex, nofollow">\n<script src="/assets/plausible-init.js"></script>\n'
        '<script async src="https://plausible.io/js/pa-cBmSDXMl1zdkkjd0z-Frh.js"></script>', 1)
    s = s.replace('{{THREE}}', '<script src="/assets/three-r128.min.js"></script>')
    s = s.replace('<script>\n{{JS}}\n</script>', '<script src="/assets/for-%s.js"></script>' % slug)
    s = ('<!DOCTYPE html>\n<html lang="en-AU">\n<head>\n<meta charset="utf-8">\n'
         '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
         '<link rel="icon" href="/assets/vantory-favicon.svg" type="image/svg+xml">\n' + s + '\n</html>\n')
    assert '<script>' not in s and '{{' not in s
    os.makedirs(os.path.join(SITE, 'for', slug), exist_ok=True)
    open(os.path.join(SITE, 'for', slug, 'index.html'), 'w').write(s)
    open(os.path.join(SITE, 'assets', 'for-%s.js' % slug), 'w').write(js)
    print('wrote site/for/%s/' % slug)
else:
    s = s.replace('{{THREE}}', '<script src="%s"></script>' % os.path.join(SITE, 'assets', 'three-r128.min.js'))
    s = s.replace('{{JS}}', js)
    s = '<!DOCTYPE html>\n<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + s + '</html>'
    assert '{{' not in s
    open(sys.argv[2], 'w').write(s)
    print('wrote', sys.argv[2])
