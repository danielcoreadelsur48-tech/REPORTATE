const sharp = require('sharp');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'images');

function iconSvg(size, rounded = true) {
  const r = rounded ? Math.round(size * 0.176) : 0;
  const fontSize = Math.round(size * 0.625);
  const textY = Math.round(size * 0.713);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A56DB"/>
      <stop offset="100%" stop-color="#0F2266"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${r}" ry="${r}"/>
  <text
    x="${size / 2}" y="${textY}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    fill="white"
    text-anchor="middle">R</text>
</svg>`;
}

function adaptiveSvg(size) {
  const fontSize = Math.round(size * 0.625);
  const textY = Math.round(size * 0.713);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <text
    x="${size / 2}" y="${textY}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    fill="white"
    text-anchor="middle">R</text>
</svg>`;
}

function splashSvg(size) {
  const fontSizeR = Math.round(size * 0.52);
  const fontSizeTag = Math.round(size * 0.065);
  const yR = Math.round(size * 0.57);
  const yTag = Math.round(size * 0.71);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#1A56DB"/>
  <text
    x="${size / 2}" y="${yR}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${fontSizeR}"
    font-weight="900"
    fill="white"
    text-anchor="middle">R</text>
  <text
    x="${size / 2}" y="${yTag}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSizeTag}"
    font-weight="700"
    fill="white"
    letter-spacing="4"
    text-anchor="middle">REPÓRTATE</text>
</svg>`;
}

function notificationSvg(size) {
  const fontSize = Math.round(size * 0.625);
  const textY = Math.round(size * 0.713);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <text
    x="${size / 2}" y="${textY}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    fill="white"
    text-anchor="middle">R</text>
</svg>`;
}

async function generate() {
  const tasks = [
    {
      svg: iconSvg(1024, true),
      out: path.join(OUT, 'icon.png'),
      width: 1024,
      height: 1024,
    },
    {
      svg: adaptiveSvg(1024),
      out: path.join(OUT, 'adaptive-icon.png'),
      width: 1024,
      height: 1024,
    },
    {
      svg: splashSvg(1024),
      out: path.join(OUT, 'splash.png'),
      width: 1024,
      height: 1024,
    },
    {
      svg: iconSvg(192, true),
      out: path.join(OUT, 'favicon.png'),
      width: 192,
      height: 192,
    },
    {
      svg: notificationSvg(192),
      out: path.join(OUT, 'notification-icon.png'),
      width: 192,
      height: 192,
    },
  ];

  for (const { svg, out, width, height } of tasks) {
    await sharp(Buffer.from(svg))
      .resize(width, height)
      .png()
      .toFile(out);
    console.log(`✓ ${path.basename(out)} (${width}×${height})`);
  }
}

generate().catch((err) => { console.error(err); process.exit(1); });
