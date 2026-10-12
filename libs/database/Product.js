const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    searchId: { type: String, required: true, index: true },
    title: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    rating: Number,
    image: String,
    store: String,
    url: { type: String },
    description: String,
    lastScraped: { type: Date, default: Date.now, expires: 3600 }
});

// Compound unique index on url and searchId
ProductSchema.index({ url: 1, searchId: 1 }, { unique: true });

const Product = mongoose.model('Product', ProductSchema);

// One-time automatic migration to drop the legacy 'url_1' index
Product.init().then(() => {
    Product.collection.dropIndex('url_1').catch((err) => {
        if (err.code !== 27 && err.codeName !== 'IndexNotFound') {
            // Silently ignore if index does not exist
        }
    });
}).catch(() => {});

module.exports = Product;