const PriceAlert = require('../../../libs/database/PriceAlert');
const User = require('../../../libs/database/User');

const getUserPriceAlerts = async (userId) => {
    return await PriceAlert.find({ userId }).sort({ createdAt: -1 });
};

const checkAndGeneratePriceAlerts = async (userId, cartItems = [], wishlistItems = [], searchedProducts = []) => {
    const alertsCreated = [];

    // Helper to evaluate item for price drop
    const evaluateItem = async (item, source) => {
        if (!item || !item.price || !item.url) return;

        const origPrice = item.originalPrice && item.originalPrice > item.price ? item.originalPrice : 0;
        if (origPrice <= item.price) return; // No discount/drop

        const dropAmount = origPrice - item.price;
        const dropPercentage = Math.round((dropAmount / origPrice) * 100);

        if (dropAmount > 0 && dropPercentage >= 5) {
            // Check if alert already exists for this URL recently
            const existingAlert = await PriceAlert.findOne({
                userId,
                url: item.url,
                currentPrice: item.price
            });

            if (!existingAlert) {
                const newAlert = await PriceAlert.create({
                    userId,
                    title: item.title,
                    url: item.url,
                    store: item.store || 'Online Store',
                    image: item.image || '',
                    previousPrice: origPrice,
                    currentPrice: item.price,
                    dropAmount,
                    dropPercentage,
                    source
                });
                alertsCreated.push(newAlert);
            }
        }
    };

    // Evaluate Cart items
    for (const item of cartItems) {
        await evaluateItem(item, 'CART');
    }

    // Evaluate Wishlist items
    for (const item of wishlistItems) {
        await evaluateItem(item, 'WISHLIST');
    }

    // Evaluate Searched items
    for (const item of searchedProducts) {
        await evaluateItem(item, 'SEARCH');
    }

    return alertsCreated;
};

const markAlertAsRead = async (userId, alertId) => {
    return await PriceAlert.findOneAndUpdate(
        { _id: alertId, userId },
        { isRead: true },
        { new: true }
    );
};

const markAllAlertsAsRead = async (userId) => {
    await PriceAlert.updateMany({ userId }, { isRead: true });
    return await PriceAlert.find({ userId }).sort({ createdAt: -1 });
};

module.exports = {
    getUserPriceAlerts,
    checkAndGeneratePriceAlerts,
    markAlertAsRead,
    markAllAlertsAsRead
};
