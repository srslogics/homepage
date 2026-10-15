const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const crop = { left: 0, top: 176, width: 2880, height: 1580 };
const identity = [2480, 200, 250, 105];
const overlay = [2470, 1320, 410, 320];
const screens = [
  { id: 'overview', time: '5.55.43', caption: 'Inventory overview and setup checklist', masks: [identity] },
  { id: 'sign-in', time: '5.55.22', caption: 'Staff sign-in with mobile number and PIN', masks: [] },
  { id: 'guided-setup', time: '5.55.52', caption: 'Guided setup: create a preschool centre', masks: [identity, [850, 1080, 360, 45], [1475, 1080, 205, 45]] },
  { id: 'items', time: '5.55.56', caption: 'Item catalogue, search, and stock filters', masks: [identity, overlay] },
  { id: 'stock-movements', time: '5.55.59', caption: 'Stock receipts, issues, returns, and corrections', masks: [identity, overlay] },
  { id: 'transfers', time: '5.56.09', caption: 'Transfers between storage locations within a centre', masks: [identity] },
  { id: 'centers-storage', time: '5.56.15', caption: 'Centres, categories, and storage locations', masks: [identity, overlay] },
  { id: 'reports', time: '5.56.21', caption: 'Stock balance export and stock-status filters', masks: [identity, [2810, 1320, 70, 320]] },
  { id: 'account', time: '5.56.24', caption: 'Account role and centre access', masks: [identity, overlay, [935, 800, 360, 55], [935, 902, 360, 55], [935, 1005, 360, 55]] }
];
const fill = { r: 224, g: 230, b: 222 };

async function main() {
  const sourceDirectory = process.argv[2];
  assert.ok(sourceDirectory, 'Pass the local directory containing the nine original screenshots.');
  const reviewed = [];
  for (const screen of screens) {
    const input = path.join(sourceDirectory, `Screenshot 2026-10-15 at ${screen.time}\u202fpm.png`);
    const metadata = await sharp(input).metadata();
    assert.equal(metadata.width, 2880, `Unexpected source width: ${screen.id}`);
    assert.equal(metadata.height, 1800, `Unexpected source height: ${screen.id}`);
    const masks = screen.masks.map(([left, top, width, height]) => ({ left, top: top - crop.top, width, height }));
    const layers = [];
    for (const mask of masks) {
      const input = await sharp({ create: { width: mask.width, height: mask.height, channels: 3, background: fill } }).png().toBuffer();
      layers.push({ input, left: mask.left, top: mask.top });
    }
    // Flatten opaque masks into pixels; never rely on CSS, blur, or a removable layer.
    const output = await sharp(input).extract(crop).removeAlpha().composite(layers).png({ compressionLevel: 9 }).toBuffer();
    const clean = await sharp(output).metadata();
    assert.equal(clean.hasAlpha, false);
    assert.ok(!clean.exif && !clean.xmp && !clean.iptc && !clean.icc, 'Public images must not retain source metadata.');
    const pixels = await sharp(output).raw().toBuffer({ resolveWithObject: true });
    for (const mask of masks) {
      for (let y = mask.top; y < mask.top + mask.height; y++) {
        for (let x = mask.left; x < mask.left + mask.width; x++) {
          const offset = (y * pixels.info.width + x) * pixels.info.channels;
          assert.equal(pixels.data[offset], fill.r);
          assert.equal(pixels.data[offset + 1], fill.g);
          assert.equal(pixels.data[offset + 2], fill.b);
        }
      }
    }
    const file = `projects-octominds-${screen.id}-20261015-redacted.png`;
    await fs.writeFile(path.join(root, 'assets/images', file), output);
    reviewed.push({ file, caption: screen.caption, width: crop.width, height: crop.height, sha256: createHash('sha256').update(output).digest('hex') });
  }
  // Remove only the untracked public copies from the initial gallery addition.
  // Original screenshots stay in the caller's source directory, outside this site.
  for (const screen of screens) {
    await fs.rm(path.join(root, 'assets/images', `projects-octominds-${screen.id}-20261015.png`), { force: true });
  }
  console.log(JSON.stringify(reviewed, null, 2));
  console.error('Inspect all nine outputs before updating the privacy-reviewed fixture.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
