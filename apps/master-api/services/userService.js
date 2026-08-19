const User = require('../../../libs/database/User');

// --- WISHLIST SERVICES ---

const getWishlist = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return user.wishlist || [];
};

const addToWishlist = async (userId, item) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const exists = user.wishlist.some(w => w.url === item.url);
    if (!exists) {
        user.wishlist.push({
            title: item.title,
            price: item.price,
            originalPrice: item.originalPrice || null,
            discount: item.discount || 0,
            rating: item.rating || null,
            image: item.image || '',
            store: item.store,
            url: item.url,
            savedAt: new Date()
        });
        await user.save();
    }
    return user.wishlist;
};

const removeFromWishlist = async (userId, url) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.wishlist = user.wishlist.filter(w => w.url !== url);
    await user.save();
    return user.wishlist;
};

// --- CART SERVICES ---

const getCart = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return user.cart || [];
};

const addToCart = async (userId, item) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const existingIndex = user.cart.findIndex(c => c.url === item.url);
    if (existingIndex > -1) {
        user.cart[existingIndex].quantity += 1;
    } else {
        user.cart.push({
            title: item.title,
            price: item.price,
            originalPrice: item.originalPrice || null,
            discount: item.discount || 0,
            rating: item.rating || null,
            image: item.image || '',
            store: item.store,
            url: item.url,
            quantity: 1,
            addedAt: new Date()
        });
    }
    await user.save();
    return user.cart;
};

const removeFromCart = async (userId, url) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.cart = user.cart.filter(c => c.url !== url);
    await user.save();
    return user.cart;
};

const clearCart = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.cart = [];
    await user.save();
    return [];
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getCart,
    addToCart,
    removeFromCart,
    clearCart
};
