const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getCart,
    addToCart,
    removeFromCart,
    clearCart
} = require('../services/userService');

// Protect all user routes
router.use(authMiddleware);

// --- WISHLIST ENDPOINTS ---

router.get('/wishlist', async (req, res) => {
    try {
        const wishlist = await getWishlist(req.user.id);
        res.status(200).json(wishlist);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/wishlist', async (req, res) => {
    try {
        const wishlist = await addToWishlist(req.user.id, req.body);
        res.status(200).json(wishlist);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/wishlist', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'Product URL is required' });
        const wishlist = await removeFromWishlist(req.user.id, url);
        res.status(200).json(wishlist);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- CART ENDPOINTS ---

router.get('/cart', async (req, res) => {
    try {
        const cart = await getCart(req.user.id);
        res.status(200).json(cart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/cart', async (req, res) => {
    try {
        const cart = await addToCart(req.user.id, req.body);
        res.status(200).json(cart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/cart', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'Product URL is required' });
        const cart = await removeFromCart(req.user.id, url);
        res.status(200).json(cart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/cart/clear', async (req, res) => {
    try {
        const cart = await clearCart(req.user.id);
        res.status(200).json(cart);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
