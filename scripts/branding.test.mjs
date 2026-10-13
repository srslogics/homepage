import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { knowledge, instructions } from '../server/assistant-knowledge.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const legal = 'SS49 D1T1TECH (OPC) PRIVATE LIMITED';
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.html'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('social previews use the company logo or a visible case-study image with matching dimensions', async () => {
  const image = 'https://ss49d1t1tech.in/assets/brand/ss49-mark.png?v=20261007-share';
  const png = await readFile(new URL('../assets/brand/ss49-mark.png', import.meta.url));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 512);
  assert.equal(png.readUInt32BE(20), 512);
  assert.ok(png.length < 300000);
  let checked = 0;
  for (const file of files) {
    const html = await read(file);
    if (!html.includes('<meta property="og:image"')) continue;
    const evidence = html.match(/<img data-search-image\s[^>]+>/)?.[0];
    const attribute = name => evidence?.match(new RegExp(`${name}="([^"]+)"`))?.[1];
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
    const expectedImage = evidence ? new URL(attribute('src'), canonical).href : image;
    const expectedAlt = evidence ? attribute('alt') : 'SS49 D1T1TECH company logo';
    assert.ok((await readFile(new URL(`..${new URL(expectedImage).pathname}`, import.meta.url))).length > 0, file);
    for (const property of ['og:image', 'og:image:secure_url']) {
      assert.ok(html.includes(`<meta property="${property}" content="${expectedImage}">`), file);
    }
    assert.ok(html.includes(`<meta name="twitter:image" content="${expectedImage}">`), file);
    assert.ok(html.includes(`<meta property="og:image:type" content="${evidence ? 'image/jpeg' : 'image/png'}">`), file);
    assert.ok(html.includes(`<meta property="og:image:alt" content="${expectedAlt}">`), file);
    assert.ok(html.includes(`<meta name="twitter:image:alt" content="${expectedAlt}">`), file);
    for (const dimension of ['width', 'height']) {
      assert.ok(html.includes(`<meta property="og:image:${dimension}" content="${evidence ? attribute(dimension) : '512'}">`), file);
    }
    assert.ok(html.includes(`<meta name="twitter:card" content="${evidence ? 'summary_large_image' : 'summary'}">`), file);
    checked++;
  }
  assert.equal(checked, 30, 'all non-redirect pages should have social preview metadata');
});

test('company identity links are not confused with the founder and fonts are compact', async () => {
  for (const file of ['index.html', 'about/index.html']) {
    const html = await read(file);
    assert.ok(html.includes('rel="me" href="https://www.linkedin.com/company/ss49d1t1tech/"'));
    assert.ok(html.includes('rel="me" href="https://www.instagram.com/ss49tech/"'));
    assert.doesNotMatch(html, /rel="me" href="https:\/\/www\.(linkedin|instagram)\.com\/(in\/)?shubhamsinghvr\//);
  }
  const font = await readFile(new URL('../assets/fonts/manrope-variable.woff2', import.meta.url));
  const original = await readFile(new URL('../assets/fonts/manrope-variable.ttf', import.meta.url));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  assert.ok(font.length < original.length / 2, 'font download reduced by more than half');
  assert.ok((await read('assets/css/enterprise.css')).includes('manrope-variable.woff2'));
});

test('8L Marketing is consistently listed as contracted work, not deployed proof', async () => {
  for (const file of ['index.html', 'us/index.html', 'projects/index.html', 'regions/index.html', 'assets/js/assistant.js', 'llms.txt', 'llms-full.txt']) {
    assert.ok((await read(file)).includes('8L Marketing'), file);
  }
  const project = knowledge.projects.find(project => project.client.includes('8L Marketing'));
  assert.equal(project.status, 'Contracted development');
  assert.equal(project.market, 'United States');
  assert.equal(project.engagement, 'Nine-month development contract');
  assert.ok((await read('projects/index.html')).includes('id="8l-marketing"'));
});

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  Object.values(value).forEach(child => walk(child, visit));
}

test('all public pages use the current identity, with the legal name in every footer', async () => {
  for (const file of files) {
    const html = await read(file);
    assert.doesNotMatch(html, /S9S\s?Logics|D1g1tech|20260922-s9s/i, file);
    if (html.includes('class="site-footer"')) {
      const footer = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)[0];
      assert.ok(footer.includes(`2026 ${legal}.`), `${file}: legal footer`);
    }
    for (const [tag] of html.matchAll(/<a class="brand"[^>]*>/g)) {
      assert.ok(tag.includes(`aria-label="${legal} home"`), `${file}: accessible brand name`);
    }
    for (const [, value] of html.matchAll(/<span class="brand-name">([^<]*)<\/span>/g)) {
      assert.equal(value, 'D1T1TECH', file);
    }
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      walk(JSON.parse(json), node => {
        if (['Organization', 'ProfessionalService'].includes(node['@type']) && node['@id'] === 'https://ss49d1t1tech.in/#organization') {
          assert.equal(node.name, legal, file);
          assert.equal(node.legalName, legal, file);
          assert.deepEqual(node.alternateName, ['SS49', 'SS49 D1T1TECH', 'SS49 Tech'], file);
          assert.equal(node.logo, 'https://ss49d1t1tech.in/assets/brand/ss49-mark.png', file);
        }
      });
    }
  }
});

test('homepage declares short website names without changing the primary brand', async () => {
  const html = await read('index.html');
  const nodes = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json));
  const websites = nodes.filter(node => node['@type'] === 'WebSite');
  assert.equal(websites.length, 1);
  assert.equal(websites[0].name, 'SS49 D1T1TECH');
  assert.deepEqual(websites[0].alternateName, ['SS49', 'SS49 Tech']);
  assert.equal(websites[0].url, 'https://ss49d1t1tech.in/');
  assert.equal(websites[0].publisher['@id'], 'https://ss49d1t1tech.in/#organization');
});

test('manifests agree on the legal company name and short app name', async () => {
  for (const file of ['manifest.json', 'site.webmanifest']) {
    const manifest = JSON.parse(await read(file));
    assert.equal(manifest.name, legal);
    assert.equal(manifest.short_name, 'SS49');
    for (const icon of manifest.icons) assert.match(icon.src, /20261006-ss49$/);
  }
});

test('assistant and machine-readable briefs state the corrected official identity', async () => {
  assert.ok(knowledge.company.includes(legal));
  assert.ok(instructions.includes(legal));
  assert.doesNotMatch(instructions, /S9S Logics/);
  for (const file of ['llms.txt', 'llms-full.txt', 'assets/js/assistant.js']) {
    assert.ok((await read(file)).includes(legal), file);
  }
});

test('primary domain and email are current while reviews and the service endpoint stay valid', async () => {
  const home = await read('index.html');
  assert.ok(home.includes('rel="canonical" href="https://ss49d1t1tech.in/"'));
  assert.ok(home.includes('founder@ss49d1t1tech.in'));
  assert.equal(knowledge.contact.email, 'founder@ss49d1t1tech.in');
  assert.equal(knowledge.contact.instagram, 'https://www.instagram.com/ss49tech/');
  for (const file of [...files, 'assets/js/assistant.js', 'llms.txt', 'llms-full.txt']) {
    assert.ok(!(await read(file)).includes('shubhamsingh@srslogics.com'), `${file}: stale contact email`);
  }
  assert.ok(!home.includes('https://www.instagram.com/srslogics/'));
  assert.ok(home.includes('https://www.instagram.com/ss49tech/'));
  const oldReviews = JSON.parse(await read('scripts/fixtures/client-review-quotes.json'));
  const reviews = await read('client-reviews/index.html');
  const quotations = html => [...html.matchAll(/<p>“[^]*?”<\/p>/g)].map(([text]) => text);
  assert.ok(oldReviews.length > 0);
  const expected = oldReviews.map(quote => quote.replace('SRS Logics developed both our website and poultry operations application with a clear understanding of our business. ', ''));
  assert.deepEqual(quotations(reviews), expected);
  assert.ok(reviews.includes("Excerpt from the client's review."));
  assert.ok((await read('assets/js/assistant-config.js')).includes('https://srs-logics-assistant.onrender.com/api/assistant'));
});

test('former brand appears only in approved rebrand explanations, never as current identity', async () => {
  for (const file of [...files, 'llms.txt', 'llms-full.txt', 'robots.txt', 'sitemap.xml', 'server/assistant-knowledge.mjs', 'assets/brand/ss49-share.svg']) {
    const source = await read(file);
    assert.doesNotMatch(source, /s9s[ -]?logics|srslogics\.com/i, file);
    if (['index.html', 'about/index.html'].includes(file)) {
      assert.match(source, /formerly SrS Logics/i, file);
      assert.doesNotMatch(source.match(/<title>(.*?)<\/title>/)[1], /SrS Logics/i, file);
    } else {
      assert.doesNotMatch(source, /srs[ -]?logics/i, file);
    }
  }
  for (const file of files) {
    const html = await read(file);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
    if (html.includes('class="site-footer"')) {
      const footer = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)[0];
      if (footer.includes('href="tel:+919270925106"')) {
        assert.ok(footer.includes('https://www.instagram.com/ss49tech/'), file);
        assert.ok(footer.includes('https://www.linkedin.com/company/ss49d1t1tech/'), file);
        assert.ok(footer.includes('https://share.google/ye9MjSSmT0RUikH2d'), file);
      }
    }
    assert.equal(new URL(canonical).origin, 'https://ss49d1t1tech.in', file);
    const og = html.match(/property="og:url" content="([^"]+)"/);
    if (og) assert.equal(og[1], canonical, file);
    for (const [, url] of html.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)) {
      assert.equal(new URL(url).origin, 'https://ss49d1t1tech.in', file);
    }
  }
  const sitemap = await read('sitemap.xml');
  for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    assert.equal(new URL(url).origin, 'https://ss49d1t1tech.in');
    const file = `${new URL(url).pathname.slice(1)}index.html`;
    assert.ok(files.includes(file), `sitemap route exists: ${file}`);
    assert.ok((await read(file)).includes(`rel="canonical" href="${url}"`), file);
  }
  assert.ok((await read('robots.txt')).includes('Sitemap: https://ss49d1t1tech.in/sitemap.xml'));
  assert.ok((await read('server/.env.example')).includes('ASSISTANT_ALLOWED_ORIGINS=https://ss49d1t1tech.in,https://www.ss49d1t1tech.in'));
});

test('the former brand has a visible explanation with an accessible homepage link', async () => {
  const about = (await read('about/index.html')).split('<main>')[1].split('</main>')[0];
  assert.ok(about.includes('id="rebrand"'));
  assert.ok(about.includes('What happened to SrS Logics?'));
  assert.ok(about.includes('SrS Logics is now known as SS49 D1T1TECH.'));
  assert.ok((await read('index.html')).includes('href="about/#rebrand"'));
});

test('current logo wrappers and rebuild paths cannot regenerate the old mark', async () => {
  for (const file of ['favicon.svg', 'assets/images/favicon.svg', 'assets/brand/ss49-wordmark.svg']) {
    const svg = await read(file);
    assert.ok(svg.includes(legal), file);
    assert.ok(svg.includes('data:image/png;base64,'), file);
    assert.ok(Buffer.byteLength(svg) < 100000, `${file}: optimized web asset`);
  }
  const css = await read('assets/css/main.css');
  assert.ok(css.includes('ss49-wordmark.svg?v=20261006-ss49'));
  for (const file of ['scripts/build_brand_assets.cjs', 'scripts/build_brand_vectors.py', 'scripts/generate_favicons.py']) {
    assert.doesNotMatch(await read(file), /S9S|s9s-logics/, file);
  }
});
