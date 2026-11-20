"""Turns a built demo page into a live page for vantorytech.com/for/<slug>/.

Usage: python3 publish.py out/<slug>.html <slug> "<Company name>"

Writes site/for/<slug>/index.html and site/assets/for-<slug>.js. The site's
security rules block outside scripts, Google Fonts and inline scripts, so this:
- swaps Google Fonts for the site's own Inter fonts,
- loads three.js from site/assets/three-r128.min.js,
- moves the page script into site/assets/for-<slug>.js,
- adds the site's visitor analytics,
- sends the trial-plan form through Web3Forms, tagged "page: for/<slug>".
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, '..', '..', 'site'))
src, slug, company = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src).read()

# fonts
contact = open(os.path.join(SITE, 'contact.html')).read()
fonts = '\n'.join(re.findall(r'@font-face \{[^}]*\}', contact))
assert fonts, 'no @font-face rules found in contact.html'
s = re.sub(r'<link rel="preconnect"[^>]*>\n?', '', s)
s = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n?', '', s)
s = s.replace('<style>', '<style>\n' + fonts + '\n', 1)

# analytics, after the robots tag
s = s.replace('<meta name="robots" content="noindex, nofollow">',
              '<meta name="robots" content="noindex, nofollow">\n<script src="/assets/plausible-init.js"></script>\n'
              '<script async src="https://plausible.io/js/pa-cBmSDXMl1zdkkjd0z-Frh.js"></script>', 1)
s = s.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')

# three.js
s = s.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
              '<script src="/assets/three-r128.min.js"></script>')

# a full document (the base page is a fragment the preview host wraps)
assert not s.lstrip().lower().startswith('<!doctype')
s = ('<!DOCTYPE html>\n<html lang="en-AU">\n<head>\n<meta charset="utf-8">\n'
     '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
     '<link rel="icon" href="/assets/vantory-favicon.svg" type="image/svg+xml">\n' + s + '\n</html>\n')

# page script out to a file
m = re.search(r'<script>\n?(.*?)</script>', s, re.S)
js = m.group(1)

old_start = js.index("  /* On vantorytech.com this sends")
old_end = js.index("});", old_start)
send = r'''  var st2 = st, btn = this.querySelector('button[type="submit"]');
  var data = new FormData();
  data.append('token', 'vantory-site-2026');
  data.append('subject', 'Demo page enquiry: %(company)s');
  data.append('from_name', 'Vantory demo page');
  data.append('page', 'for/%(slug)s');
  data.append('name', $('t-name').value.trim());
  data.append('role', $('t-role').value.trim());
  data.append('email', $('t-email').value.trim());
  data.append('company', $('t-company').value);
  data.append('product', $('t-product').value.trim());
  data.append('checked_today', $('t-checked').value);
  data.append('checks_wanted', Array.prototype.map.call(document.querySelectorAll('input[name="t-check"]:checked'), function(c){ return c.value; }).join(', '));
  ['c-packs','c-days','c-hours','c-rate','c-recall','c-recalls','c-penalty','c-escape'].forEach(function(id){ data.append(id.slice(2), $(id).value); });
  data.append('estimate', $('r-range').textContent);
  btn.disabled = true; st2.className = 'status'; st2.textContent = 'Sending...';
  fetch('https://script.google.com/macros/s/AKfycbzi5j4yWk1y53HibXQxnsSc7mN-UivqlgG_SugqmqijTkWoIpDJs4at8_8Il_UaR8Ui/exec', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.fromEntries(data)) })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || !res.ok) throw new Error(res && res.message ? res.message : 'not sent');
      st2.className = 'status ok';
      st2.textContent = 'Thanks, ' + first + '. We have your details and will email you a trial plan within one business day.';
    })
    .catch(function(err){
      st2.className = 'status err';
      st2.textContent = 'Sorry, that did not send (' + (err && err.message ? err.message : 'no reply') + '). Please try again, or email enquiries@vantorytech.com.';
    })
    .then(function(){ btn.disabled = false; });
''' % {'company': company.replace("'", "\\'"), 'slug': slug}
js = js[:old_start] + send + js[old_end:]
assert 'This is a preview' not in js

s = s[:m.start()] + '<script src="/assets/for-%s.js"></script>' % slug + s[m.end():]
assert '<script>' not in s, 'an inline script is left'
assert 'googleapis' not in s and 'cdnjs' not in s

os.makedirs(os.path.join(SITE, 'for', slug), exist_ok=True)
open(os.path.join(SITE, 'for', slug, 'index.html'), 'w').write(s)
open(os.path.join(SITE, 'assets', 'for-%s.js' % slug), 'w').write(js)
print('wrote site/for/%s/index.html and site/assets/for-%s.js' % (slug, slug))
