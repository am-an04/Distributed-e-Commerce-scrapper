const Restaurant = require('../../../libs/database/Restaurant');
const Reservation = require('../../../libs/database/Reservation');

const searchRestaurants = async ({ query, location, cuisine, availableOnly, maxPrice }) => {
    let filter = {};

    if (location && location.trim()) {
        const locRegex = new RegExp(location.trim(), 'i');
        filter.$or = [
            { city: locRegex },
            { area: locRegex },
            { address: locRegex },
            { name: locRegex }
        ];
    }

    if (query && query.trim()) {
        const qRegex = new RegExp(query.trim(), 'i');
        if (filter.$or) {
            filter.$and = [
                { $or: filter.$or },
                { $or: [{ name: qRegex }, { cuisine: qRegex }, { features: qRegex }] }
            ];
            delete filter.$or;
        } else {
            filter.$or = [
                { name: qRegex },
                { cuisine: qRegex },
                { features: qRegex },
                { city: qRegex }
            ];
        }
    }

    if (cuisine && cuisine !== 'ALL') {
        filter.cuisine = new RegExp(cuisine, 'i');
    }

    if (availableOnly) {
        filter.availableTables = { $gt: 0 };
    }

    if (maxPrice) {
        filter.priceForTwo = { $lte: Number(maxPrice) };
    }

    return await Restaurant.find(filter).sort({ rating: -1, availableTables: -1 });
};

const createReservation = async ({ userId, restaurantId, date, time, guests }) => {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    if (restaurant.availableTables <= 0) {
        throw new Error('Sorry, no tables available for reservation right now.');
    }

    // Decrement table count
    restaurant.availableTables = Math.max(0, restaurant.availableTables - 1);
    await restaurant.save();

    const reservation = await Reservation.create({
        userId,
        restaurantId,
        restaurantName: restaurant.name,
        date: date || new Date().toISOString().split('T')[0],
        time: time || '08:00 PM',
        guests: guests || 2
    });

    return { reservation, remainingTables: restaurant.availableTables };
};

const getUserReservations = async (userId) => {
    return await Reservation.find({ userId }).sort({ createdAt: -1 });
};

module.exports = {
    searchRestaurants,
    createReservation,
    getUserReservations
};
