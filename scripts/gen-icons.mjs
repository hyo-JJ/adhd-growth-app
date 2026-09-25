import sharp from 'sharp';
import { mkdirSync } from 'fs';

const BG = '#FDF1E6';

// mascot centered in a 512x512 canvas, scaled up from the 104x104 viewBox used in Mascot.jsx
function mascotSvg(size, { padding = 0 } = {}) {
  const inner = size - padding * 2;
  const scale = inner / 104;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <g transform="translate(${padding}, ${padding}) scale(${scale})">
      <circle cx="52" cy="60" r="40" fill="#FBDDBB" />
      <path d="M52 22c0-8 6-14 6-14s-10-1-13 6c-1-6-9-9-9-9s0 9 6 13c-4 1-7 5-7 5s9 3 14-1z" fill="#5FAE6E" />
      <circle cx="30" cy="66" r="6" fill="#F5A98B" opacity="0.7" />
      <circle cx="74" cy="66" r="6" fill="#F5A98B" opacity="0.7" />
      <path d="M36 56q5-6 10 0" stroke="#3a2e27" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M58 56q5-6 10 0" stroke="#3a2e27" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M42 68q10 10 20 0" stroke="#3a2e27" stroke-width="3.2" stroke-linecap="round" fill="none" />
    </g>
  </svg>`;
}

mkdirSync('public/icons', { recursive: true });

const jobs = [
  { file: 'public/icons/icon-192.png', size: 192, padding: 0 },
  { file: 'public/icons/icon-512.png', size: 512, padding: 0 },
  { file: 'public/icons/maskable-512.png', size: 512, padding: 90 }, // extra padding = safe zone for maskable
  { file: 'public/apple-touch-icon.png', size: 180, padding: 10 },
];

for (const job of jobs) {
  await sharp(Buffer.from(mascotSvg(job.size, { padding: job.padding })))
    .png()
    .toFile(job.file);
  console.log('wrote', job.file);
}
