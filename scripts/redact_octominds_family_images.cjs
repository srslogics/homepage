const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const crop = { left: 0, top: 176, width: 3360, height: 1880 };
const account = [2848, 218, 220, 55];
const childBadge = [2428, 514, 298, 69];
const photoBadge = [2597, 514, 303, 69];
const thumbnail = [2940, 1610, 420, 324];
const updateCount = [1075, 710, 420, 42];
const screens = [
  ['today', '12.39.09', 'Today at School: care notes, school updates and upcoming events', [
    account, [1178, 372, 345, 49], [2428, 396, 299, 68], [1144, 651, 293, 40], [1122, 721, 921, 98]
  ]],
  ['school-updates', '12.39.13', 'School updates and notices', [account, childBadge, [1061, 568, 505, 49], updateCount, thumbnail]],
  ['home-learning', '12.39.28', 'Activities for learning at home', [account, childBadge, updateCount]],
  ['daily-diary', '12.39.41', 'Daily diary and care updates', [account, childBadge, [1060, 568, 248, 49], updateCount, thumbnail]],
  ['calendar', '12.39.47', 'School calendar with event and holiday filters', [account, childBadge, thumbnail]],
  ['photo-gallery', '12.39.52', 'Family photo album view', [account, photoBadge, [905, 710, 526, 42], thumbnail]],
  ['messages', '12.39.56', 'Ask the School: messages and pick-up shortcuts', [account, childBadge, thumbnail]],
  ['child-profile', '12.40.07', 'My Child: profile, school office and teacher links', [
    [1120, 404, 267, 264], [1403, 423, 517, 81], [1402, 513, 273, 133],
    [1121, 713, 314, 72], [2470, 720, 214, 60], [2690, 1157, 50, 34],
    [1101, 1256, 121, 119], [1220, 1269, 151, 56]
  ]],
  ['child-care', '12.40.10', 'My Child: well-being, family access and milestones', [
    [2690, 320, 50, 35], [1101, 424, 121, 113], [1220, 433, 151, 56],
    [1128, 1287, 416, 117], [1616, 1943, 605, 51], thumbnail
  ]],
  ['sign-in', '12.38.42', 'Family Portal sign-in and guest preview', []]
];
const fill = { r: 224, g: 230, b: 222 };

async function main() {
  const [sourceDirectory, outputDirectory] = process.argv.slice(2);
  assert.ok(sourceDirectory && outputDirectory, 'Pass the original screenshot folder and the review output folder.');
  await fs.mkdir(outputDirectory, { recursive: true });
  const reviewed = [];
  for (const [id, time, caption, areas] of screens) {
    const input = path.join(sourceDirectory, `Screenshot 2026-11-26 at ${time}\u202fam.png`);
    const source = await sharp(input).metadata();
    assert.equal(source.width, 3360, id);
    assert.equal(source.height, 2100, id);
    const masks = areas.map(([left, top, width, height]) => ({ left, top: top - crop.top, width, height }));
    const layers = await Promise.all(masks.map(async ({ left, top, width, height }) => ({
      input: await sharp({ create: { width, height, channels: 3, background: fill } }).png().toBuffer(), left, top
    })));
    // Bake the covers into a fresh pixel buffer and export without source metadata.
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
    const file = `projects-octominds-family-${id}-20261126-redacted.png`;
    await fs.writeFile(path.join(outputDirectory, file), result);
    reviewed.push({ file, caption, width: crop.width, height: crop.height, sha256: createHash('sha256').update(result).digest('hex') });
  }
  console.log(JSON.stringify(reviewed, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
