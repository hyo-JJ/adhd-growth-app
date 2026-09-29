// scripts/source-icons 의 토끼 일러스트로 앱 아이콘과 화면용 마스코트 이미지를 만든다.
// 실행: npm i --no-save sharp && node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const SRC = 'scripts/source-icons';
const BG = '#FDF1E6';

// 정사각형 배경 위에 main_icon을 padding만큼 여백을 두고 가운데 배치
async function appIcon(file, size, padding, background = BG) {
  const inner = size - padding * 2;
  const art = await sharp(`${SRC}/main_icon.png`)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(file);
  console.log('wrote', file);
}

mkdirSync('public/icons', { recursive: true });
await appIcon('public/icons/icon-192.png', 192, 12);
await appIcon('public/icons/icon-512.png', 512, 32);
await appIcon('public/icons/maskable-512.png', 512, 96); // maskable safe zone
await appIcon('public/apple-touch-icon.png', 180, 14);
await appIcon('public/favicon.png', 64, 0, { r: 0, g: 0, b: 0, alpha: 0 });

// 화면에서는 최대 ~120px로 쓰므로 레티나 기준 높이 240px webp로 줄여서 번들 크기를 아낀다.
mkdirSync('src/assets/mascot', { recursive: true });
for (const name of ['main_icon', 'icon_wave', 'icon_heart', 'icon_reading', 'icon_lying', 'icon_back']) {
  const out = `src/assets/mascot/${name.replace(/^icon_/, '')}.webp`;
  await sharp(`${SRC}/${name}.png`).resize({ height: 240 }).webp({ quality: 88 }).toFile(out);
  console.log('wrote', out);
}
