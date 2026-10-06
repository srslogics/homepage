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
        if (['Organization', 'ProfessionalService'].includes(node['@type']) && node['@id'] === 'https://srslogics.com/#organization') {
          assert.equal(node.name, legal, file);
          assert.equal(node.legalName, legal, file);
          assert.ok(node.alternateName.includes('SrS Logics'), file);
          assert.equal(node.logo, 'https://srslogics.com/assets/brand/ss49-mark.png', file);
        }
      });
    }
  }
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

test('contacts, canonical URLs, historical reviews and public endpoint are preserved', async () => {
  const home = await read('index.html');
  assert.match(home, /rel="canonical" href="https:\/\/srslogics.com\/"/);
  assert.ok(home.includes('shubhamsingh@srslogics.com'));
  assert.ok(home.includes('https://www.instagram.com/srslogics/'));
  const oldReviews = execFileSync('git', ['show', 'HEAD:client-reviews/index.html'], { cwd: root, encoding: 'utf8' });
  const reviews = await read('client-reviews/index.html');
  const quotations = html => [...html.matchAll(/<p>“[^]*?”<\/p>/g)].map(([text]) => text);
  assert.ok(quotations(oldReviews).length > 0);
  assert.deepEqual(quotations(reviews), quotations(oldReviews));
  assert.ok((await read('assets/js/assistant-config.js')).includes('https://srs-logics-assistant.onrender.com/api/assistant'));
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
