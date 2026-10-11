import React, { useState, useEffect } from 'react';
import { MapPin, Search, Star, Hotel as HotelIcon, Calendar, Users, Loader2, Navigation, Home, X, Wifi, ShieldCheck, BedDouble } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from './config.js';

const POPULAR_HOTEL_CITIES = ['Goa', 'Delhi', 'Mumbai', 'Bangalore', 'Udaipur', 'Jaipur', 'Manali'];
const AMENITY_TAGS = ['ALL', 'Beachfront', 'Swimming Pool', 'Spa', 'Free WiFi', 'Luxury Dining', 'Rooftop Bar'];

function HotelView({ user, token, onOpenAuth, showToast }) {
  const [location, setLocation] = useState('Goa');
  const [fullAddress, setFullAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmenity, setSelectedAmenity] = useState('ALL');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  // Booking Modal State
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [bookLoading, setBookLoading] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, [location, selectedAmenity, availableOnly]);

  // GPS Location Auto-Detection
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoStatus('Requesting GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGeoStatus('Resolving location address...');

        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          if (res.data && res.data.address) {
            const addr = res.data.address;
            const detectedCity = addr.city || addr.town || addr.state_district || addr.suburb || 'Goa';
            const detectedFull = res.data.display_name || `${addr.road || ''}, ${detectedCity}`;
            
            setLocation(detectedCity);
            setFullAddress(detectedFull);
            showToast(`📍 GPS Detected: ${detectedCity}`);
            setGeoStatus(`Detected: ${detectedCity}`);
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          showToast(`Latitude: ${latitude.toFixed(2)}, Longitude: ${longitude.toFixed(2)}`);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setGeoLoading(false);
        setGeoStatus('');
        showToast('Could not access GPS location. Please type your city/address below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (location) params.append('location', location);
      if (searchQuery) params.append('query', searchQuery);
      if (selectedAmenity !== 'ALL') params.append('amenity', selectedAmenity);
      if (availableOnly) params.append('availableOnly', 'true');

      const res = await axios.get(`${API_BASE_URL}/api/hotels?${params.toString()}`);
      setHotels(res.data || []);
    } catch (err) {
      console.error("Error fetching hotels:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHotels();
  };

  const handleBookRoom = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      setSelectedHotel(null);
      onOpenAuth();
      return;
    }

    setBookLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${API_BASE_URL}/api/hotels/book`,
        {
          hotelId: selectedHotel._id,
          checkIn,
          checkOut,
          guests,
          rooms
        },
        { headers }
      );

      if (res.data) {
        showToast(`Room Booked at ${selectedHotel.name}! 🏨`);
        setSelectedHotel(null);
        fetchHotels(); // Refresh room counts
      }
    } catch (err) {
      console.error("Booking error:", err);
      showToast(err.response?.data?.error || 'Failed to book room.');
    } finally {
      setBookLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#100507] to-red-950/60 p-6 md:p-10 border border-red-900/30">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-extrabold uppercase border border-red-600/30 mb-3">
            <HotelIcon size={14} /> Luxury Stays & Room Availability
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
            Book Hotels & Check Real-Time Room Availability
          </h1>
          <p className="text-slate-400 text-sm">
            Search luxury resorts, beachside hotels, and boutique stays with instant room availability and live GPS location detection.
          </p>
        </div>
      </div>

      {/* GPS Location & Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGetDeviceLocation}
            disabled={geoLoading}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-950/40 flex items-center gap-2 shrink-0"
          >
            {geoLoading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            <span>{geoLoading ? 'Detecting...' : 'Detect GPS Location'}</span>
          </button>
          
          <div className="text-xs text-slate-400">
            {geoStatus ? (
              <span className="text-red-400 font-bold">{geoStatus}</span>
            ) : (
              <span>Allow GPS access to find nearby hotel stays instantly.</span>
            )}
          </div>
        </div>

        {/* Quick Cities Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Top Stays:</span>
          {POPULAR_HOTEL_CITIES.map(city => (
            <button
              key={city}
              onClick={() => { setLocation(city); setFullAddress(''); }}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                location.toLowerCase() === city.toLowerCase()
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Location & Search Bar */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          
          {/* City / Area Input */}
          <div className="relative md:w-1/3">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City / Destination (e.g. Goa, Mumbai)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-100 text-sm focus:outline-none focus:border-red-500 transition-all placeholder:text-slate-600 font-bold"
            />
            <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
          </div>

          {/* Full Address Input */}
          <div className="relative md:w-1/3">
            <input
              type="text"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Landmark / Full Address (Optional)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-100 text-sm focus:outline-none focus:border-red-500 transition-all placeholder:text-slate-600"
            />
            <Home size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          {/* Search Query Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotel name or amenities (e.g. Resort, Spa)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-28 text-slate-100 text-sm focus:outline-none focus:border-red-500 transition-all placeholder:text-slate-600"
            />
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Find Hotels'}
            </button>
          </div>

        </form>

        {/* Amenity Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Amenities:</span>
            {AMENITY_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedAmenity(tag)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  selectedAmenity === tag
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 shrink-0">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-4 h-4 accent-red-600 rounded bg-slate-900 border-slate-800"
            />
            <span>Available Rooms Only</span>
          </label>
        </div>
      </div>

      {/* Hotel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <div
            key={hotel._id}
            className="bg-[#08080c] border border-slate-900 rounded-3xl overflow-hidden hover:border-red-900/60 transition-all hover:scale-[1.01] flex flex-col justify-between group"
          >
            <div>
              {/* Image & Badges Header */}
              <div className="relative h-48 bg-slate-950 overflow-hidden">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-transparent to-black/40"></div>

                {/* Rating Badge (Red/White - No Yellow) */}
                <div className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                  <Star size={13} className="fill-white" />
                  <span>{hotel.rating}</span>
                </div>

                {/* Distance Badge */}
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-slate-300 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                  <MapPin size={12} className="text-red-500" />
                  <span>{hotel.distanceKm} km away</span>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-black text-lg text-white group-hover:text-red-400 transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-slate-500" />
                    <span>{hotel.area}, {hotel.city}</span>
                  </p>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1.5">
                  {hotel.amenities.map((a, i) => (
                    <span key={i} className="text-[10px] font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">
                      {a}
                    </span>
                  ))}
                </div>

                {/* Pricing & Room Availability */}
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Price per Night</span>
                    <span className="font-black text-white text-base">₹{hotel.pricePerNight.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Room Status</span>
                    {hotel.availableRooms > 0 ? (
                      <span className="text-emerald-400 font-extrabold text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                        {hotel.availableRooms} Rooms Open
                      </span>
                    ) : (
                      <span className="text-red-500 font-extrabold text-xs">Fully Booked</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-5 pt-0">
              <button
                onClick={() => {
                  if (!user) {
                    onOpenAuth();
                    return;
                  }
                  setSelectedHotel(hotel);
                }}
                disabled={hotel.availableRooms <= 0}
                className="w-full bg-slate-900 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-extrabold py-3 rounded-2xl text-xs transition-all border border-slate-800 hover:border-red-500 flex items-center justify-center gap-2"
              >
                <BedDouble size={14} />
                {hotel.availableRooms > 0 ? 'Book Room Now' : 'No Rooms Available'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && hotels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-900 rounded-3xl bg-slate-950/40">
          <HotelIcon size={48} className="text-slate-800 mb-3" />
          <h3 className="text-base font-bold text-slate-400 mb-1">No Hotels Found</h3>
          <p className="text-xs text-slate-600 max-w-sm text-center">
            Try searching for a different destination (e.g. Goa, Delhi, Mumbai, Udaipur).
          </p>
        </div>
      )}

      {/* Room Booking Modal */}
      {selectedHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
            
            <button
              onClick={() => setSelectedHotel(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-900"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase bg-red-600/20 text-red-400 px-2.5 py-1 rounded-md border border-red-600/30">
                Instant Room Booking
              </span>
              <h3 className="text-xl font-black text-white mt-2">{selectedHotel.name}</h3>
              <p className="text-xs text-slate-400">{selectedHotel.area}, {selectedHotel.city}</p>
            </div>

            <form onSubmit={handleBookRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Rooms
                  </label>
                  <select
                    value={rooms}
                    onChange={(e) => setRooms(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value={1}>1 Room</option>
                    <option value={2}>2 Rooms</option>
                    <option value={3}>3 Rooms</option>
                  </select>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs mt-2">
                <span className="text-slate-400">Total Price ({rooms} Room):</span>
                <span className="font-black text-white text-base">₹{(selectedHotel.pricePerNight * rooms).toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                disabled={bookLoading}
                className="w-full mt-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-red-950/50 transition-all flex items-center justify-center gap-2"
              >
                {bookLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Room Booking'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default HotelView;
