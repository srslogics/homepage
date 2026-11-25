const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const crop = { left: 0, top: 176, width: 3360, height: 1880 };
const fill = { r: 224, g: 230, b: 232 };
const station = [690, 218, 174, 56];
const thumbnail = [2940, 1630, 420, 291];
const manager = [station, [2870, 210, 248, 73]];
const managerShift = [513, 398, 455, 52];

// Coordinates refer to the original captures, before removing the browser chrome.
const galleries = {
  owner: [
    ['overview', '12.43.24', 'Station overview: fuel sales, shifts and exceptions', [
      station, [565, 1194, 285, 44], [1420, 1194, 298, 44],
      [553, 1410, 415, 132], [1482, 1410, 275, 65]
    ]],
    ['daily-report', '12.43.36', 'Daily report: payment reconciliation and fuel stock movements', [[690, 327, 174, 36]]],
    ['money', '12.43.40', 'Money: customer dues, bank receipts and cash deposits', [station, thumbnail, [2840, 1757, 100, 55]]],
    ['payroll', '12.43.44', 'Payroll: salaries, staff advances and payment history', [station, thumbnail]],
    ['payables', '12.43.47', 'Payables: supplier invoices and business bills', [station, thumbnail]],
    ['operations', '12.43.56', 'Operations: open shifts, tank capacities and low-stock thresholds', [
      [554, 519, 1135, 86], [553, 733, 705, 46]
    ]],
    ['exceptions', '12.44.05', 'Exception inbox: outstanding issues and follow-up notes', [
      station, [554, 794, 579, 40], [775, 884, 561, 43], [730, 960, 51, 45]
    ]],
    ['automation', '12.44.09', 'Automation: alerts, bank reconciliation and recurring drafts', [
      station, thumbnail, [1944, 676, 89, 69], [554, 1738, 550, 47]
    ]],
    ['station-settings', '12.44.15', 'Station settings: selling rates and opening stock', [
      [690, 176, 177, 58], [575, 768, 108, 58], [1918, 768, 116, 58]
    ]],
    ['team', '12.44.19', 'Team: station access and manager accounts', [station, thumbnail, [551, 769, 580, 68]]],
    ['account-security', '12.44.24', 'Account security: verification and recovery settings', [
      station, thumbnail, [550, 680, 322, 60]
    ]],
    ['sign-in', '12.42.27', 'Owner sign-in screen', []],
    ['verification', '12.42.45', 'Owner sign-in verification screen', []]
  ],
  manager: [
    ['meter-stock', '12.44.49', 'Shift entry: meter readings and physical stock', [
      ...manager, managerShift, [550, 1021, 470, 59], [550, 1216, 470, 61]
    ]],
    ['collections', '12.44.51', 'Shift entry: collections and payment reconciliation', [...manager, managerShift, thumbnail]],
    ['deliveries', '12.44.53', 'Shift entry: fuel deliveries and stock movements', [...manager, managerShift, thumbnail]],
    ['expenses', '12.44.58', 'Shift entry: station expenses and cash count', [...manager, managerShift, thumbnail]],
    ['owner-requests', '12.45.06', 'Owner requests: shift corrections and follow-up', [...manager, thumbnail]]
  ]
};

async function main() {
  const [sourceDirectory, outputDirectory] = process.argv.slice(2);
  assert.ok(sourceDirectory && outputDirectory, 'Pass the original screenshot folder and the review output folder.');
  await fs.mkdir(outputDirectory, { recursive: true });
  const reviewed = {};
  for (const [group, screens] of Object.entries(galleries)) {
    reviewed[group] = [];
    for (const [id, time, caption, areas] of screens) {
      const input = path.join(sourceDirectory, `Screenshot 2026-11-26 at ${time}\u202fam.png`);
      const source = await sharp(input).metadata();
      assert.equal(source.width, 3360, id);
      assert.equal(source.height, 2100, id);
      const masks = areas.map(([left, top, width, height]) => ({ left, top: top - crop.top, width, height }));
      const layers = await Promise.all(masks.map(async ({ left, top, width, height }) => ({
        input: await sharp({ create: { width, height, channels: 3, background: fill } }).png().toBuffer(), left, top
      })));
      // Export new, opaque pixels without the original screenshot metadata.
      const pipeline = sharp(input).extract(crop).removeAlpha().toColourspace('srgb');
      if (layers.length) pipeline.composite(layers);
      const result = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      const clean = await sharp(result).metadata();
      assert.equal(clean.width, crop.width);
      assert.equal(clean.height, crop.height);
      assert.equal(clean.hasAlpha, false);
      assert.ok(!clean.exif && !clean.xmp && !clean.iptc && !clean.icc);
      const { data, info } = await sharp(result).raw().toBuffer({ resolveWithObject: true });
      for (const { left, top, width, height } of masks) {
        for (let y = top; y < top + height; y++) {
          for (let x = left; x < left + width; x++) {
            const offset = (y * info.width + x) * info.channels;
            assert.ok(data[offset] === fill.r && data[offset + 1] === fill.g && data[offset + 2] === fill.b, `Non-opaque cover: ${id}`);
          }
        }
      }
      const file = `projects-tuljai-${group}-${id}-20261126-redacted.png`;
      await fs.writeFile(path.join(outputDirectory, file), result);
      reviewed[group].push({ file, caption, width: crop.width, height: crop.height, sha256: createHash('sha256').update(result).digest('hex') });
    }
  }
  console.log(JSON.stringify(reviewed, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
