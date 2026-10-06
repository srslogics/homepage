const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const brand = path.join(root, 'assets/brand');
const legalName = 'SS49 D1T1TECH (OPC) PRIVATE LIMITED';

function svg(width, height, content, viewBox = `0 0 ${width} ${height}`) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" role="img" aria-label="${legalName}"><title>${legalName}</title>${content}</svg>\n`;
}

async function main() {
  // Optimize the approved, non-interlocking artwork for the web without redrawing it.
  const wordmarkSource = await fs.readFile(path.join(brand, 'ss49-wordmark-source.png'));
  const avatarSource = await fs.readFile(path.join(brand, 'ss49-avatar-source.png'));
  const wordmarkWeb = await sharp(wordmarkSource).resize(724).png({ palette: true, colours: 16, dither: 0 }).toBuffer();
  const avatarWeb = await sharp(avatarSource).resize(256).png({ palette: true, colours: 16, dither: 0 }).toBuffer();
  const wordmarkImage = `<image width="1448" height="1086" href="data:image/png;base64,${wordmarkWeb.toString('base64')}"/>`;
  const avatarImage = `<image width="1254" height="1254" href="data:image/png;base64,${avatarWeb.toString('base64')}"/>`;
  const wordmark = svg(1312, 424, wordmarkImage, '72 328 1312 424');
  const mark = svg(512, 512, avatarImage, '0 0 1254 1254');
  await fs.writeFile(path.join(brand, 'ss49-wordmark.svg'), wordmark);
  for (const file of ['favicon.svg', 'assets/images/favicon.svg', 'assets/brand/ss49-mark.svg']) {
    await fs.writeFile(path.join(root, file), mark);
  }
  const outputs = {
    'favicon-32x32.png': 32, 'apple-touch-icon.png': 180,
    'favicon-192.png': 192, 'favicon-512.png': 512,
    'assets/images/favicon-192.png': 192, 'assets/images/srslogics-logo.png': 1024,
    'assets/brand/ss49-mark.png': 512, 'srs-logics-logo-4096.png': 4096
  };
  for (const [file, size] of Object.entries(outputs)) {
    await sharp(avatarSource).resize(size, size).png({ palette: true, colours: 16, dither: 0 }).toFile(path.join(root, file));
  }
  const sizes = [16, 32, 48], pngs = [];
  for (const size of sizes) pngs.push(await sharp(avatarSource).resize(size, size).png().toBuffer());
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const pos = 6 + i * 16;
    header[pos] = header[pos + 1] = size;
    header.writeUInt16LE(1, pos + 4);
    header.writeUInt16LE(32, pos + 6);
    header.writeUInt32LE(pngs[i].length, pos + 8);
    header.writeUInt32LE(offset, pos + 12);
    offset += pngs[i].length;
  });
  await fs.writeFile(path.join(root, 'favicon.ico'), Buffer.concat([header, ...pngs]));
  const share = svg(1200, 630, `
    <rect width="1200" height="630" fill="#ffffff"/>
    <svg x="72" y="65" width="245" height="80" viewBox="72 328 1312 424">${wordmarkImage}</svg>
    <g fill="#12334a" font-family="Avenir Next, sans-serif">
      <text x="352" y="106" font-size="34" font-weight="600">D1T1TECH</text>
      <text x="353" y="136" font-size="15" letter-spacing="1">(OPC) PRIVATE LIMITED</text>
    </g>
    <path d="M72 190H1128" stroke="#adc6e3"/>
    <g fill="#12334a" font-family="Georgia, serif" font-size="66">
      <text x="72" y="303">Software built around</text>
      <text x="72" y="388">your business.</text>
    </g>
    <g fill="#40566f" font-family="Avenir Next, sans-serif">
      <text x="72" y="465" font-size="22">Custom software development</text>
      <text x="72" y="562" font-size="24">ss49d1t1tech.in</text>
    </g>`);
  await fs.writeFile(path.join(brand, 'ss49-share.svg'), share);
  await sharp(Buffer.from(share)).png().toFile(path.join(root, 'assets/images/og-image.png'));
  console.log('Generated SS49 website logos, browser icons, and social-share artwork from approved sources.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
