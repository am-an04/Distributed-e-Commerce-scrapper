const Hotel = require('../../../libs/database/Hotel');
const HotelBooking = require('../../../libs/database/HotelBooking');

const SAMPLE_HOTELS = [
    // Goa
    {
        name: "Taj Exotica Resort & Spa",
        city: "Goa",
        area: "Benaulim",
        rating: 4.9,
        pricePerNight: 16500,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        availableRooms: 4,
        distanceKm: 0.5,
        amenities: ["Beachfront", "Swimming Pool", "Spa", "Free WiFi", "Breakfast Included"],
        address: "Benaulim Beach, South Goa, Goa 403716"
    },
    {
        name: "W Goa - Beach Resort",
        city: "Goa",
        area: "Vagator",
        rating: 4.8,
        pricePerNight: 18000,
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
        availableRooms: 6,
        distanceKm: 0.8,
        amenities: ["Beachfront", "Nightclub", "Swimming Pool", "Spa", "Air Conditioning"],
        address: "Vagator Beach, Bardez, North Goa 403509"
    },

    // Delhi
    {
        name: "The Leela Palace New Delhi",
        city: "Delhi",
        area: "Chanakyapuri",
        rating: 4.9,
        pricePerNight: 19500,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        availableRooms: 5,
        distanceKm: 1.5,
        amenities: ["Rooftop Pool", "Spa", "Luxury Dining", "Free WiFi", "Gym"],
        address: "Diplomatic Enclave, Chanakyapuri, New Delhi 110023"
    },
    {
        name: "Taj Mahal Hotel",
        city: "Delhi",
        area: "Mansingh Road",
        rating: 4.8,
        pricePerNight: 14000,
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
        availableRooms: 7,
        distanceKm: 2.1,
        amenities: ["Swimming Pool", "Spa", "Heritage Dining", "Air Conditioning"],
        address: "Number 1, Mansingh Road, New Delhi 110011"
    },

    // Mumbai
    {
        name: "The Taj Mahal Palace",
        city: "Mumbai",
        area: "Colaba",
        rating: 4.9,
        pricePerNight: 22000,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        availableRooms: 3,
        distanceKm: 0.2,
        amenities: ["Sea View", "Heritage", "Swimming Pool", "Spa", "Butler Service"],
        address: "Apollo Bunder, Colaba, Mumbai 400001"
    },

    // Udaipur / Jaipur
    {
        name: "The Oberoi Udaivilas",
        city: "Udaipur",
        area: "Haridas Ji Ki Magri",
        rating: 4.9,
        pricePerNight: 35000,
        image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
        availableRooms: 2,
        distanceKm: 1.1,
        amenities: ["Lake View", "Private Pool", "Heritage Royal", "Spa"],
        address: "Badi Gorela, Udaipur, Rajasthan 313001"
    },

    // Bangalore
    {
        name: "The Ritz-Carlton Bengaluru",
        city: "Bangalore",
        area: "Residency Road",
        rating: 4.7,
        pricePerNight: 12500,
        image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
        availableRooms: 8,
        distanceKm: 1.0,
        amenities: ["Rooftop Bar", "Spa", "Free WiFi", "Air Conditioning", "Gym"],
        address: "99 Residency Road, Bengaluru 560025"
    }
];

const seedHotelsIfNeeded = async () => {
    const count = await Hotel.countDocuments();
    if (count === 0) {
        console.log("🌱 Seeding sample hotel stays...");
        await Hotel.insertMany(SAMPLE_HOTELS);
        console.log("✅ Hotel database seeded.");
    }
};

const searchHotels = async ({ query, location, amenity, availableOnly, maxPrice }) => {
    await seedHotelsIfNeeded();

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
                { $or: [{ name: qRegex }, { amenities: qRegex }] }
            ];
            delete filter.$or;
        } else {
            filter.$or = [
                { name: qRegex },
                { amenities: qRegex },
                { city: qRegex }
            ];
        }
    }

    if (amenity && amenity !== 'ALL') {
        filter.amenities = new RegExp(amenity, 'i');
    }

    if (availableOnly) {
        filter.availableRooms = { $gt: 0 };
    }

    if (maxPrice) {
        filter.pricePerNight = { $lte: Number(maxPrice) };
    }

    return await Hotel.find(filter).sort({ rating: -1, availableRooms: -1 });
};

const bookHotelRoom = async ({ userId, hotelId, checkIn, checkOut, guests, rooms }) => {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) throw new Error('Hotel not found');

    const roomCount = rooms || 1;
    if (hotel.availableRooms < roomCount) {
        throw new Error(`Sorry, only ${hotel.availableRooms} rooms available for booking.`);
    }

    // Decrement room count
    hotel.availableRooms = Math.max(0, hotel.availableRooms - roomCount);
    await hotel.save();

    const totalPrice = hotel.pricePerNight * roomCount;

    const booking = await HotelBooking.create({
        userId,
        hotelId,
        hotelName: hotel.name,
        checkIn: checkIn || new Date().toISOString().split('T')[0],
        checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        guests: guests || 2,
        rooms: roomCount,
        totalPrice
    });

    return { booking, remainingRooms: hotel.availableRooms };
};

const getUserHotelBookings = async (userId) => {
    return await HotelBooking.find({ userId }).sort({ createdAt: -1 });
};

module.exports = {
    searchHotels,
    bookHotelRoom,
    getUserHotelBookings
};
