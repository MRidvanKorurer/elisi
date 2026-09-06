const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const VIDEOS = ['2.mp4', '3.mp4', '4.mp4'];
const LABELS = ['El örgüsü doku', 'Ahşap sap detayı', 'Atölye ışığı'];

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  await Product.updateMany(
    { isLookbook: true },
    { $set: { isLookbook: false, video: '', lookbookLabel: '', lookbookOrder: 0 } }
  );

  const all = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(30);
  let picks = all.filter((p) => String(p.category).toLowerCase() === 'canta').slice(0, 3);
  if (picks.length < 3) picks = all.slice(0, 3);

  const tagged = [];
  for (let i = 0; i < picks.length; i += 1) {
    picks[i].isLookbook = true;
    picks[i].lookbookOrder = i + 1;
    picks[i].video = VIDEOS[i];
    picks[i].lookbookLabel = LABELS[i];
    await picks[i].save();
    tagged.push({ title: picks[i].title, video: picks[i].video, id: String(picks[i]._id) });
  }

  console.log(JSON.stringify(tagged, null, 2));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
