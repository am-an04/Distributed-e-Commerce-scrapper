const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rating: Number,
    comment: String,
    user: String
});

module.exports = mongoose.model('Review', ReviewSchema);