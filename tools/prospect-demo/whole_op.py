"""Whole-operation wording for large multi-line, multi-plant prospects (Andrew, 27 Nov 2026):
pitch every line and plant in one system, never one plant or one line.
Used by build.py when a company JSON has "wholeOperation": true. Also runnable on published pages:
python3 whole_op.py site/for/<slug>/index.html [--sites breweries]
"""
import re, sys

def apply(s, sites='plants'):
    s = s.replace('<h2 id="h-trial">One camera, one line, alerts only</h2>',
                  '<h2 id="h-trial">Every line and %s, one system</h2>' % {'plants': 'plant', 'sites': 'site', 'breweries': 'brewery'}.get(sites, sites))
    s = re.sub(r'We watch the [a-z ]+ line run and choose the inspection point\.',
               'We walk your lines with your team and map where checks are needed across your %s.' % sites, s)
    s = s.replace('<p class="callout">Our equipment never stops your line. Automatic rejects come in phase two, with your maintenance team.</p>',
                  '<p class="callout">Our equipment never stops your lines. Every camera across your lines and %s reports into one system, with one dashboard and one shift report. Automatic rejects come in phase two, with your maintenance team.</p>' % sites)
    return s

if __name__ == '__main__':
    f = sys.argv[1]
    sites = sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == '--sites' else 'plants'
    s = open(f).read(); n = apply(s, sites)
    assert n != s and 'One camera, one line' not in n and 'choose the inspection point' not in n, f
    open(f, 'w').write(n); print('updated', f)
