/**
 * Ürün fotoğrafları ve atölye kliplerinden 2K ultrawide hero filmi üretir.
 * Çıktı: uploads/videos/hero-atelier-2k.mp4 (2560x1080)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FFMPEG = path.join(process.env.TEMP || '/tmp', 'nikbag-ffmpeg', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const SEED = path.join(__dirname, '../uploads/products/seed');
const CLIPS = path.join(__dirname, '../uploads/videos');
const WORK = path.join(CLIPS, '_hero_build');
const W = 2560;
const H = 1080;
const FPS = 30;
const CLIP_SEC = 2.05;

const ffmpegBin = fs.existsSync(FFMPEG) ? FFMPEG : 'ffmpeg';

const run = (args, cwd) => {
  const result = spawnSync(ffmpegBin, args, { stdio: 'inherit', windowsHide: true, cwd });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${args.slice(0, 8).join(' ')}`);
  }
};

const coverVf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${FPS}`;
const grade = 'eq=saturation=1.08:contrast=1.04:gamma=1.02:brightness=0.012';
const fade = `fade=t=in:st=0:d=0.38:color=0x1E2738,fade=t=out:st=${(CLIP_SEC - 0.38).toFixed(2)}:d=0.38:color=0x1E2738`;

const stillToClip = (src, dest) => {
  const frames = Math.round(CLIP_SEC * FPS);
  run([
    '-y', '-loop', '1', '-i', src,
    '-frames:v', String(frames),
    '-vf', `scale=4200:-1,zoompan=z='min(zoom+0.00105,1.11)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},setsar=1,${grade},${fade},format=yuv420p`,
    '-an', dest
  ]);
};

const videoToClip = (src, dest) => {
  run([
    '-y', '-i', src, '-t', String(CLIP_SEC),
    '-vf', `${coverVf},setsar=1,${grade},${fade},format=yuv420p`,
    '-an', dest
  ]);
};

fs.mkdirSync(WORK, { recursive: true });

const shots = [
  { type: 'still', src: path.join(SEED, 'orgu-omuz-cantasi-ekru-vitrin-serisi-1.jpg') },
  { type: 'still', src: path.join(SEED, 'bambu-halka-sapli-orgu-canta-zeytin-yesili-1.jpg') },
  { type: 'video', src: path.join(CLIPS, 'orgu-doku.mp4') },
  { type: 'still', src: path.join(SEED, 'el-orgusu-clutch-kiremit-kirmizisi-1.jpg') },
  { type: 'still', src: path.join(SEED, 'hasir-dokuma-sahil-sepeti-karamel-1.jpg') },
  { type: 'video', src: path.join(CLIPS, 'canta1.mp4') }
];

const parts = [];
shots.forEach((shot, index) => {
  if (!fs.existsSync(shot.src)) {
    console.warn('missing', shot.src);
    return;
  }
  const dest = path.join(WORK, `part-${String(index).padStart(2, '0')}.mp4`);
  if (shot.type === 'still') stillToClip(shot.src, dest);
  else videoToClip(shot.src, dest);
  parts.push(path.basename(dest));
});

const listFile = path.join(WORK, 'concat.txt');
fs.writeFileSync(listFile, parts.map((file) => `file '${file}'`).join('\n'));

const atelier = path.join(CLIPS, 'hero-atelier-2k.mp4');
const hero = path.join(CLIPS, 'hero-orgu.mp4');
const poster = path.join(CLIPS, 'hero-atelier-poster.jpg');

run([
  '-y', '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
  atelier
], WORK);

fs.copyFileSync(atelier, hero);
run(['-y', '-i', atelier, '-ss', '0.4', '-frames:v', '1', '-q:v', '3', poster]);
fs.rmSync(WORK, { recursive: true, force: true });

const stat = fs.statSync(atelier);
console.log(JSON.stringify({
  out: atelier,
  bytes: stat.size,
  sizeMb: Number((stat.size / 1024 / 1024).toFixed(2)),
  resolution: `${W}x${H}`,
  clips: parts.length
}, null, 2));
