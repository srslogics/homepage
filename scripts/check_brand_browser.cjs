const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tmp/ss49-review');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.html'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});

async function main() {
  await fs.mkdir(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const failures = [];
  const results = [];
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    let errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const file of files) {
        errors = [];
        await page.goto(`${origin}/${file}`, { waitUntil: 'networkidle' });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].filter(img => img.getAttribute('src')).map(async img => {
            img.loading = 'eager';
            try { await img.decode(); } catch {}
          }));
        });
        const state = await page.evaluate(() => {
          const brand = document.querySelector('.site-header .brand');
          const rect = brand?.getBoundingClientRect();
          const toggle = document.querySelector('.nav-toggle');
          const toggleVisible = toggle && getComputedStyle(toggle).display !== 'none';
          const brandText = brand?.querySelector('.brand-tag').getBoundingClientRect();
          const titleOverflow = [...document.querySelectorAll('h1,h2,h3')].filter(el => {
            if (!el.checkVisibility()) return false;
            const range = document.createRange();
            range.selectNodeContents(el);
            return [...range.getClientRects()].some(r => r.left < -1 || r.right > innerWidth + 1);
          }).map(el => el.textContent);
          return {
            title: document.title,
            overflow: document.documentElement.scrollWidth > innerWidth,
            broken: [...document.images].filter(img => img.getAttribute('src') && !img.naturalWidth).map(img => img.src),
            brandOverlap: !!(toggleVisible && brandText && brandText.right > toggle.getBoundingClientRect().left - 3),
            logoMissing: !!(brand && !getComputedStyle(brand, '::before').backgroundImage.includes('ss49-wordmark.svg')),
            brandOutside: !!(rect && (rect.left < 0 || rect.right > innerWidth)),
            titleOverflow,
            oldBrand: /S9S Logics|D1g1tech/i.test(document.body.innerText),
            themeMissing: !document.querySelector('link[href*="enterprise.css"]') || !document.fonts.check('500 16px Manrope')
          };
        });
        if (state.overflow || state.broken.length || state.brandOverlap || state.logoMissing || state.brandOutside || state.titleOverflow.length || state.oldBrand || state.themeMissing || errors.length) {
          failures.push({ file, width, ...state, errors });
        }
        results.push({ file, width, title: state.title });
        if (['index.html', 'about/index.html', 'projects/index.html', 'assistant/index.html'].includes(file)) {
          await page.screenshot({ path: path.join(output, `${file.replaceAll('/', '-').replace('.html', '')}-${width}.png`) });
        }
      }
      await page.goto(origin, { waitUntil: 'networkidle' });
      if (width < 1281) {
        await page.locator('.nav-toggle').click();
        if (await page.locator('.nav-toggle').getAttribute('aria-expanded') !== 'true') failures.push({ width, menu: 'did not open' });
        if (!await page.locator('.site-nav').isVisible()) failures.push({ width, menu: 'not visible' });
        await page.locator('.site-nav a').first().focus();
        await page.keyboard.press('Escape');
        if (await page.locator('.nav-toggle').getAttribute('aria-expanded') !== 'false') failures.push({ width, menu: 'Escape did not close' });
        if (!await page.locator('.nav-toggle').evaluate(el => el === document.activeElement)) failures.push({ width, menu: 'focus not restored' });
      }
      const faq = page.locator('.faq-list details').first();
      const initiallyOpen = await faq.evaluate(el => el.open);
      await faq.locator('summary').click();
      if (await faq.evaluate(el => el.open) === initiallyOpen) failures.push({ width, faq: 'did not toggle' });
      await faq.locator('summary').click();
      if (await faq.evaluate(el => el.open) !== initiallyOpen) failures.push({ width, faq: 'did not toggle back' });
      await page.locator('.site-footer').screenshot({ path: path.join(output, `footer-${width}.png`) });

      await page.goto(`${origin}/projects/#knp-signature`, { waitUntil: 'networkidle' });
      const launcher = page.locator('[data-gallery-title="KNP Signature"]');
      await launcher.click();
      if (!await page.locator('#project-lightbox').isVisible()) failures.push({ width, gallery: 'did not open' });
      await page.keyboard.press('ArrowRight');
      if (await page.locator('#lightbox-counter').innerText() !== '2 / 8') failures.push({ width, gallery: 'navigation failed' });
      await page.keyboard.press('Escape');
      if (await page.locator('#project-lightbox').isVisible()) failures.push({ width, gallery: 'did not close' });
      if (!await launcher.evaluate(el => el === document.activeElement)) failures.push({ width, gallery: 'focus not restored' });

      await page.goto(`${origin}/assistant/`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Show me your work', exact: true }).click();
      const conversation = await page.locator('.assistant-log').innerText();
      if (!conversation.includes('KNP Signature')) failures.push({ width, assistant: 'guided answer missing' });
      await page.locator('#brief-goal').fill('Connect our purchasing and approvals.');
      await page.locator('#brief-users').fill('Operations and finance');
      await page.locator('#brief-form button[type="submit"]').click();
      if (!await page.locator('#brief-review').isVisible()) failures.push({ width, brief: 'review missing' });
      const brief = await page.locator('#brief-output').inputValue();
      if (!brief.includes('SS49 D1T1TECH (OPC) PRIVATE LIMITED') || !brief.includes('Connect our purchasing and approvals.')) failures.push({ width, brief: 'review content missing' });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push({ width, brief: 'review overflow' });
      await page.locator('#edit-brief').click();
      if (await page.locator('#brief-goal').inputValue() !== 'Connect our purchasing and approvals.') failures.push({ width, brief: 'notes not preserved' });
      console.log(`Checked all ${files.length} pages at ${width}px.`);
    }
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ checked: results.length, failures, results }, null, 2));
    console.log(JSON.stringify({ checked: results.length, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
