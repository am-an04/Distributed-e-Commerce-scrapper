const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    rating: Number,
    image: String,
    store: String,
    url: { type: String, unique: true },
    description: String,
    lastScraped: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);