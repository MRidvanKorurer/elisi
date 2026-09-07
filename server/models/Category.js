const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        categoryId: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        image: { type: String, default: '' },
        description: { type: String, default: '', trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        iconName: { type: String, default: 'CategoryOutlined' },
        color: { type: String, default: '#946D6D' },
        bgGradient: { type: String, default: 'linear-gradient(135deg, #FDF4D2 0%, #B0CDE6 100%)' },
        bgRGBA: { type: String, default: 'rgba(148, 109, 109, 0.12)' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
