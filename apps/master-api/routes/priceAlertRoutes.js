const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../../../libs/database/User');
const {
    getUserPriceAlerts,
    checkAndGeneratePriceAlerts,
    markAlertAsRead,
    markAllAlertsAsRead
} = require('../services/priceAlertService');

// GET: Fetch user's price drop notifications (Protected)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            // Auto check cart and wishlist items for alerts
            await checkAndGeneratePriceAlerts(req.user.id, user.cart, user.wishlist);
        }
        const alerts = await getUserPriceAlerts(req.user.id);
        res.status(200).json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Trigger price alert check with searched items (Protected)
router.post('/check', authMiddleware, async (req, res) => {
    try {
        const { searchedProducts } = req.body;
        const user = await User.findById(req.user.id);
        
        const newAlerts = await checkAndGeneratePriceAlerts(
            req.user.id,
            user ? user.cart : [],
            user ? user.wishlist : [],
            searchedProducts || []
        );

        const allAlerts = await getUserPriceAlerts(req.user.id);

        res.status(200).json({
            message: newAlerts.length > 0 ? `🔥 ${newAlerts.length} Price Drop Alerts Detected!` : 'No new price drops found.',
            newAlerts,
            allAlerts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Mark all alerts as read (Protected)
router.post('/read-all', authMiddleware, async (req, res) => {
    try {
        const updated = await markAllAlertsAsRead(req.user.id);
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
