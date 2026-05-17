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

function splashSvg(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A56DB"/>
      <stop offset="100%" stop-color="#0F2266"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <text
    x="${w / 2}" y="${Math.round(h * 0.44)}"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="520"
    font-weight="900"
    fill="white"
    text-anchor="middle">R</text>
  <text
    x="${w / 2}" y="${Math.round(h * 0.56)}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="110"
    font-weight="700"
    fill="white"
    letter-spacing="18"
    text-anchor="middle">REPÓRTATE</text>
  <text
    x="${w / 2}" y="${Math.round(h * 0.605)}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="56"
    font-weight="400"
    fill="#A5C0F3"
    text-anchor="middle">Control de presencia y seguridad grupal</text>
  <text
    x="${w / 2}" y="${Math.round(h * 0.96)}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="44"
    font-weight="400"
    fill="#7A9DD4"
    text-anchor="middle">© Todos los derechos reservados. Leonardo Ramos.</text>
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
      svg: splashSvg(1284, 2778),
      out: path.join(OUT, 'splash.png'),
      width: 1284,
      height: 2778,
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
