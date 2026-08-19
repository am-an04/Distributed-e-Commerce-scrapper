const mongoose = require('mongoose');

const PriceAlertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    store: { type: String, required: true },
    image: { type: String },
    previousPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    dropAmount: { type: Number, required: true },
    dropPercentage: { type: Number, required: true },
    source: { type: String, enum: ['CART', 'WISHLIST', 'SEARCH'], default: 'SEARCH' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PriceAlert', PriceAlertSchema);
