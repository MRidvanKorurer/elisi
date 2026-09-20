const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'site' },
    featuredBankName: { type: String, default: '' },
    featuredBankHolder: { type: String, default: '' },
    featuredBankIban: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
