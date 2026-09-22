const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const brand = path.join(root, 'assets/brand');

async function main() {
  const mark = path.join(brand, 's9s-logics-mark.svg');
  const outputs = { 'favicon-32x32.png': 32, 'apple-touch-icon.png': 180,
    'favicon-192.png': 192, 'favicon-512.png': 512,
    'assets/images/favicon-192.png': 192, 'assets/images/srslogics-logo.png': 1024,
    'srs-logics-logo-4096.png': 4096 };
  for (const [file, size] of Object.entries(outputs)) {
    await sharp(mark, { density: 600 }).resize(size, size).png().toFile(path.join(root, file));
  }
  // PNG-compressed ICO entries preserve the canonical SVG without redrawing it.
  const sizes = [16, 32, 48], pngs = [];
  for (const size of sizes) pngs.push(await sharp(mark).resize(size, size).png().toBuffer());
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const pos = 6 + i * 16;
    header[pos] = header[pos + 1] = size;
    header.writeUInt16LE(1, pos + 4); header.writeUInt16LE(32, pos + 6);
    header.writeUInt32LE(pngs[i].length, pos + 8); header.writeUInt32LE(offset, pos + 12);
    offset += pngs[i].length;
  });
  await fs.writeFile(path.join(root, 'favicon.ico'), Buffer.concat([header, ...pngs]));
  await sharp(path.join(brand, 's9s-logics-share.svg')).png().toFile(path.join(root, 'assets/images/og-image.png'));
  const out = path.resolve(root, '../output/brand/s9s-logics');
  await fs.mkdir(out, { recursive: true });
  for (const file of await fs.readdir(brand)) {
    if (!file.endsWith('.svg')) continue;
    await fs.copyFile(path.join(brand, file), path.join(out, file));
    await sharp(path.join(brand, file), { density: 144 }).png().toFile(path.join(out, file.replace('.svg', '.png')));
  }
  for (const size of [32, 64, 192, 256, 512, 1024]) {
    await sharp(mark, { density: 192 }).resize(size, size).png().toFile(path.join(out, `s9s-logics-mark-${size}.png`));
  }
  console.log('Generated website icons, social share image and downloadable S9S logo suite.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
