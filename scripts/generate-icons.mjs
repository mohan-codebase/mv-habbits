// Regenerates every icon, favicon and OpenGraph asset from the two key renders
// in assets/logo/. Run with `node scripts/generate-icons.mjs` after changing a
// source render.
//
// The sources live outside public/ deliberately: they are 5.2 MB combined and
// only needed at build time, so serving them would bloat the deploy for no
// reason. Everything under public/ is a derived, optimised output.
//
// Sources are 2400x2400 with ~300px of transparent margin; everything here
// trims first so the mark fills its box instead of floating in dead space.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = {
  gold: 'assets/logo/premium.png',
  silver: 'assets/logo/basic.png',
};

// Brand surfaces are always gold — favicon, install icon and OpenGraph are
// fetched without a session, so they cannot vary per user.
const BRAND = SRC.gold;

const BG = '#08090F'; // manifest background_color

/** Trimmed source at a given box size, optionally on an opaque background. */
async function render(src, size, { scale = 1, background = null } = {}) {
  const inner = Math.round(size * scale);
  const key = await sharp(src)
    .trim({ threshold: 1 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const pad = Math.round((size - inner) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: key, top: pad, left: pad }])
    .png()
    .toBuffer();
}

async function write(path, buf) {
  await sharp(buf).toFile(path);
  const { size } = await sharp(path).metadata().then(async (m) => ({
    size: (await import('node:fs')).statSync(path).size,
    m,
  }));
  console.log(`  ${path.padEnd(42)} ${(size / 1024).toFixed(0)} KB`);
}

async function main() {
  await mkdir('public/icons', { recursive: true });

  console.log('favicon + apple touch');
  // Favicon stays transparent so it sits on light and dark tab strips alike.
  await write('app/icon.png', await render(BRAND, 512, { scale: 0.94 }));
  // iOS composites transparency onto black, so give apple-touch an explicit bg.
  await write('app/apple-icon.png', await render(BRAND, 180, { scale: 0.72, background: BG }));

  console.log('PWA install icons');
  await write('public/icons/icon-192.png', await render(BRAND, 192, { scale: 0.8, background: BG }));
  await write('public/icons/icon-512.png', await render(BRAND, 512, { scale: 0.8, background: BG }));

  // Maskable icons get cropped to a circle of 80% diameter. A square-ish mark
  // only survives that if it fits the inscribed square: 0.8/sqrt(2) ~= 0.57.
  // 0.6 keeps a little breathing room without shrinking the key further.
  console.log('maskable (0.6 safe zone)');
  await write('public/icons/icon-maskable-192.png', await render(BRAND, 192, { scale: 0.6, background: BG }));
  await write('public/icons/icon-maskable-512.png', await render(BRAND, 512, { scale: 0.6, background: BG }));

  console.log('in-app logo');
  for (const [name, src] of Object.entries(SRC)) {
    const out = name === 'gold' ? 'key-gold' : 'key-silver';
    await write(`public/logo/${out}-128.png`, await render(src, 128, { scale: 1 }));
  }

  // OpenGraph: key on the left, wordmark on the right. Crawlers render the
  // title/description as their own text, but a bare icon on a gradient reads as
  // unfinished in a Slack or iMessage unfurl.
  console.log('opengraph 1200x630');
  const ogKey = await sharp(BRAND)
    .trim({ threshold: 1 })
    .resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
       <defs>
         <radialGradient id="g" cx="25%" cy="35%" r="75%">
           <stop offset="0%" stop-color="#2A1A4A"/>
           <stop offset="100%" stop-color="${BG}"/>
         </radialGradient>
       </defs>
       <rect width="1200" height="630" fill="url(#g)"/>
       <text x="480" y="292" font-family="Helvetica, Arial, sans-serif"
             font-size="58" font-weight="bold" fill="#FAFAFA">Productivity Master</text>
       <text x="483" y="344" font-family="Helvetica, Arial, sans-serif"
             font-size="27" fill="#A9A5C0">Build daily habits that actually stick</text>
       <rect x="483" y="382" width="86" height="4" rx="2" fill="#D4AF37"/>
     </svg>`
  );

  await write(
    'app/opengraph-image.png',
    await sharp(bg)
      .composite([{ input: ogKey, top: 145, left: 105 }])
      .png()
      .toBuffer()
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
