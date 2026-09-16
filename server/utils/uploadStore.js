const fs = require('fs');
const path = require('path');

const uploadRoot = () => {
  const configured = String(process.env.UPLOAD_DIR || '').trim();
  return configured ? path.resolve(configured) : path.join(__dirname, '../uploads');
};

const uploadDir = (folder) => {
  const dir = path.join(uploadRoot(), folder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const publicUrl = (folder, filename) => (filename ? `/uploads/${folder}/${filename}` : '');

const localPath = (url) => {
  if (!url || !String(url).startsWith('/uploads/')) return null;
  const relative = String(url).replace(/^\/uploads\//, '').split('?')[0];
  if (!relative || relative.includes('..')) return null;
  return path.join(uploadRoot(), relative);
};

const removeUpload = (url) => {
  const filePath = localPath(url);
  if (filePath) fs.promises.unlink(filePath).catch(() => {});
  require('./mediaStore').removeRemote(url);
};

module.exports = {
  uploadRoot,
  uploadDir,
  publicUrl,
  localPath,
  removeUpload
};
