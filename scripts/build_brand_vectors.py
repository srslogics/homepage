"""Build the S9S identity from the site's established mark and installed fonts."""
from pathlib import Path
from fontTools.ttLib import TTFont, TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/brand'
OUT.mkdir(parents=True, exist_ok=True)
SERIF = TTFont('/System/Library/Fonts/Supplemental/Georgia Bold.ttf')
SANS = TTCollection('/System/Library/Fonts/Avenir Next.ttc').fonts[2]

def lettering(value, font, size, x, baseline, color, width=None):
    scale = size / font['head'].unitsPerEm
    cmap, glyphs = font.getBestCmap(), font.getGlyphSet()
    advance = sum(font['hmtx'][cmap[ord(c)]][0] for c in value) * scale
    if width:
        scale *= width / advance
        advance = width
    paths, cursor = [], x
    for char in value:
        name = cmap[ord(char)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, cursor, baseline)))
        paths.append(f'<path fill="{color}" d="{pen.getCommands()}"/>')
        cursor += font['hmtx'][name][0] * scale
    return ''.join(paths), advance

def svg(title, width, height, content):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{title}"><title>{title}</title>{content}</svg>\n'

letters, _ = lettering('S9S', SERIF, 178, 86, 321, '#edf5fc', 340)
mark = '''<defs><linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#102a46"/><stop offset="1" stop-color="#06101c"/></linearGradient><linearGradient id="accent"><stop offset="0" stop-color="#8ad9f7"/><stop offset="1" stop-color="#4ea8d8"/></linearGradient></defs>
<rect width="512" height="512" rx="108" fill="url(#background)"/>
<path d="M76 113h120M316 399h120" stroke="url(#accent)" stroke-width="18" stroke-linecap="round"/>
<circle cx="414" cy="105" r="15" fill="#8ad9f7"/><circle cx="98" cy="407" r="10" fill="#4ea8d8"/>''' + letters
mark_svg = svg('S9S Logics', 512, 512, mark)
for target in [ROOT / 'favicon.svg', ROOT / 'assets/images/favicon.svg', OUT / 's9s-logics-mark.svg']:
    target.write_text(mark_svg)
for variant, color, bg in [('primary', '#102a43', ''), ('reverse', '#edf5fc', '<rect width="1250" height="256" fill="#06101c"/>')]:
    name, _ = lettering('S9S Logics', SANS, 112, 274, 140, color)
    tag, _ = lettering('CUSTOM SOFTWARE SYSTEMS', SANS, 25, 280, 197, '#586f86' if variant == 'primary' else '#8ad9f7')
    content = bg + f'<g transform="translate(24 24) scale(.40625)">{mark}</g>' + name + tag
    (OUT / f's9s-logics-{variant}.svg').write_text(svg('S9S Logics - custom software systems', 1250, 256, content))
for variant, color in [('one-color', '#102a43'), ('white', '#ffffff')]:
    word, _ = lettering('S9S Logics', SANS, 112, 20, 140, color)
    (OUT / f's9s-logics-{variant}.svg').write_text(svg('S9S Logics', 800, 180, word))
name, _ = lettering('S9S Logics', SANS, 46, 168, 114, '#102a43')
line1, _ = lettering('Software built around', SERIF, 66, 72, 304, '#102a43')
line2, _ = lettering('your business.', SERIF, 66, 72, 387, '#1d64c8')
tag, _ = lettering('CUSTOM SOFTWARE SYSTEMS', SANS, 22, 72, 461, '#40566f')
url, _ = lettering('srslogics.com', SANS, 24, 72, 564, '#40566f')
og = '<rect width="1200" height="630" fill="#eef4fb"/><rect x="72" y="176" width="1056" height="2" fill="#adc6e3"/>'
og += f'<g transform="translate(72 56) scale(.14)">{mark}</g>' + name + line1 + line2 + tag + url
(OUT / 's9s-logics-share.svg').write_text(svg('S9S Logics - Software built around your business', 1200, 630, og))
print(f'Created outlined S9S logos and share artwork in {OUT}')
