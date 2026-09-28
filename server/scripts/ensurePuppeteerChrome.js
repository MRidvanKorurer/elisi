const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const exists = (file) => Boolean(file && fs.existsSync(file));

const systemChrome = () => {
  if (process.platform === 'win32') {
    const pf = process.env.PROGRAMFILES || 'C:\\Program Files';
    const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return [
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    ].find(exists);
  }
  return [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ].find(exists);
};

if (process.env.WHATSAPP_SKIP_CHROME === '1') process.exit(0);
if (systemChrome()) process.exit(0);

try {
  const bundled = require('puppeteer').executablePath();
  if (exists(bundled)) process.exit(0);
} catch {
  /* yok */
}

const result = spawnSync('npx', ['--yes', 'puppeteer', 'browsers', 'install', 'chrome'], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});
if (result.status) {
  console.warn('Puppeteer Chrome indirilemedi; canlıda sistem tarayıcısı veya sonraki deneme kullanılacak.');
}
process.exit(0);
