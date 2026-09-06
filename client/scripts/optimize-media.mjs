/**
 * Ağır atölye videolarını web için sıkıştırır.
 * Kullanım: npm run optimize:media
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';

const run = promisify(execFile);
const root = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(root, '../src/assets/sendgb-p7W4jZ0UCo1');
const outDir = path.join(root, '../src/assets/optimized');

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const encode = async (file) => {
  const input = path.join(sourceDir, file);
  const output = path.join(outDir, file);

  await run(ffmpeg, [
    '-y',
    '-i', input,
    '-vf', "scale='min(1280,iw)':-2",
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '30',
    '-profile:v', 'main',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    output
  ]);

  const [before, after] = await Promise.all([stat(input), stat(output)]);
  console.log(`${file}: ${mb(before.size)} -> ${mb(after.size)}`);
};

const main = async () => {
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(sourceDir)).filter((file) => file.endsWith('.mp4'));
  for (const file of files) {
    await encode(file);
  }
  console.log('Video optimizasyonu tamamlandı.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
