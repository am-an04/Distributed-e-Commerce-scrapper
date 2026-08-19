const Restaurant = require('../../../libs/database/Restaurant');
const Reservation = require('../../../libs/database/Reservation');

const SAMPLE_RESTAURANTS = [
    // Delhi NCR
    {
        name: "Bukhara - ITC Maurya",
        city: "Delhi",
        area: "Chanakyapuri",
        cuisine: ["North Indian", "Mughlai", "Fine Dining"],
        rating: 4.8,
        priceForTwo: 5000,
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        availableTables: 3,
        distanceKm: 2.1,
        openingHours: "12:30 PM - 11:30 PM",
        features: ["Fine Dining", "Valet Parking", "Luxury", "AC"],
        address: "ITC Maurya, Diplomatic Enclave, Chanakyapuri, New Delhi"
    },
    {
        name: "Indian Accent",
        city: "Delhi",
        area: "Lodhi Road",
        cuisine: ["Modern Indian", "Fine Dining", "Fusion"],
        rating: 4.9,
        priceForTwo: 6000,
        image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
        availableTables: 5,
        distanceKm: 3.5,
        openingHours: "12:00 PM - 10:30 PM",
        features: ["Chef Tasting Menu", "Outdoor Seating", "Wine Bar"],
        address: "The Lodhi, Lodhi Road, New Delhi"
    },
    {
        name: "Olive Bar & Kitchen",
        city: "Delhi",
        area: "Mehrauli",
        cuisine: ["Mediterranean", "Italian", "European"],
        rating: 4.7,
        priceForTwo: 3500,
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        availableTables: 4,
        distanceKm: 4.2,
        openingHours: "01:00 PM - 12:00 AM",
        features: ["Courtyard Dining", "Romantic", "Cocktails"],
        address: "One Style Mile, Kalka Das Marg, Mehrauli, New Delhi"
    },

    // Mumbai
    {
        name: "Bastian",
        city: "Mumbai",
        area: "Bandra West",
        cuisine: ["Seafood", "Asian", "Continental"],
        rating: 4.6,
        priceForTwo: 4000,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        availableTables: 6,
        distanceKm: 1.8,
        openingHours: "12:00 PM - 01:00 AM",
        features: ["Celebrity Hotspot", "Rooftop", "Seafood Special"],
        address: "Kamala Mills Compound, Lower Parel, Mumbai"
    },
    {
        name: "Gajalee Seafood",
        city: "Mumbai",
        area: "Vile Parle",
        cuisine: ["Malvani", "Seafood", "Konkan"],
        rating: 4.7,
        priceForTwo: 2200,
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
        availableTables: 8,
        distanceKm: 2.9,
        openingHours: "11:30 AM - 11:30 PM",
        features: ["Authentic Malvani", "AC", "Family Friendly"],
        address: "Hanuman Road, Vile Parle East, Mumbai"
    },

    // Bangalore
    {
        name: "Toit Brewpub",
        city: "Bangalore",
        area: "Indiranagar",
        cuisine: ["Continental", "Italian", "Craft Beer", "Finger Food"],
        rating: 4.8,
        priceForTwo: 2500,
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
        availableTables: 7,
        distanceKm: 1.2,
        openingHours: "08:30 AM - 01:00 AM",
        features: ["Microbrewery", "Live Sports Screen", "Wood-fired Pizza"],
        address: "100 Feet Road, Indiranagar, Bengaluru"
    },
    {
        name: "TRUFFLES",
        city: "Bangalore",
        area: "Koramangala",
        cuisine: ["American", "Burgers", "Cafe", "Fast Food"],
        rating: 4.6,
        priceForTwo: 900,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        availableTables: 10,
        distanceKm: 2.0,
        openingHours: "11:00 AM - 11:00 PM",
        features: ["Famous Burgers", "Casual Dining", "Budget Friendly"],
        address: "5th Block, Koramangala, Bengaluru"
    },

    // Pune
    {
        name: "Malaka Spice",
        city: "Pune",
        area: "Koregaon Park",
        cuisine: ["Pan Asian", "Thai", "Vietnamese"],
        rating: 4.7,
        priceForTwo: 2000,
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
        availableTables: 4,
        distanceKm: 1.5,
        openingHours: "11:30 AM - 11:30 PM",
        features: ["Art Lounge", "Outdoor Seating", "Organic"],
        address: "Lane 5, Koregaon Park, Pune"
    }
];

// Seed DB if empty
const seedIfNeeded = async () => {
    const count = await Restaurant.countDocuments();
    if (count === 0) {
        console.log("🌱 Seeding sample restaurant listings...");
        await Restaurant.insertMany(SAMPLE_RESTAURANTS);
        console.log("✅ Restaurant database seeded.");
    }
};

const searchRestaurants = async ({ query, location, cuisine, availableOnly, maxPrice }) => {
    await seedIfNeeded();

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
