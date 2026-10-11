const Hotel = require('../../../libs/database/Hotel');
const HotelBooking = require('../../../libs/database/HotelBooking');

const searchHotels = async ({ query, location, amenity, availableOnly, maxPrice }) => {
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
