import React, { useState, useEffect } from 'react';
import { MapPin, Search, Star, Utensils, Calendar, Clock, Users, CheckCircle2, Loader2, Sparkles, Filter, X, Navigation, Crosshair, Home } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from './config.js';

const POPULAR_LOCATIONS = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Kolkata'];
const CUISINE_TAGS = ['ALL', 'North Indian', 'Fine Dining', 'Italian', 'Seafood', 'Asian', 'Continental', 'Fast Food'];

function RestaurantView({ user, token, onOpenAuth, showToast }) {
  const [location, setLocation] = useState('Delhi');
  const [fullAddress, setFullAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  // Reservation Modal state
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [resDate, setResDate] = useState(new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState('08:00 PM');
  const [resGuests, setResGuests] = useState(2);
  const [resLoading, setResLoading] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, [location, selectedCuisine, availableOnly]);

  // Reverse Geocoding using Browser Geolocation API & OpenStreetMap Nominatim
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoStatus('Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGeoStatus('Resolving current address...');

        try {
          // Free Nominatim reverse geocoding
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          if (res.data && res.data.address) {
            const addr = res.data.address;
            const detectedCity = addr.city || addr.town || addr.state_district || addr.suburb || '';
            const detectedFull = res.data.display_name || `${addr.road || ''}, ${addr.suburb || ''}, ${detectedCity}`;
            
            setLocation(detectedCity);
            setFullAddress(detectedFull);
            showToast(`📍 Location Detected: ${detectedCity}`);
            setGeoStatus(`Detected: ${detectedCity}`);
          } else {
            setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          showToast(`Latitude: ${latitude.toFixed(2)}, Longitude: ${longitude.toFixed(2)}`);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation denied/error:", err);
        setGeoLoading(false);
        setGeoStatus('');
        if (err.code === err.PERMISSION_DENIED) {
          showToast('Location access denied. Please type your city/address below.');
        } else {
          showToast('Could not fetch GPS location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (location) params.append('location', location);
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCuisine !== 'ALL') params.append('cuisine', selectedCuisine);
      if (availableOnly) params.append('availableOnly', 'true');

      const res = await axios.get(`${API_BASE_URL}/api/restaurants?${params.toString()}`);
      setRestaurants(res.data || []);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  const handleReserveTable = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      setSelectedRestaurant(null);
      onOpenAuth();
      return;
    }

    setResLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${API_BASE_URL}/api/restaurants/reserve`,
        {
          restaurantId: selectedRestaurant._id,
          date: resDate,
          time: resTime,
          guests: resGuests
        },
        { headers }
      );

      if (res.data) {
        showToast(`Table Reserved at ${selectedRestaurant.name}! 🎉`);
        setSelectedRestaurant(null);
        fetchRestaurants();
      }
    } catch (err) {
      console.error("Reservation error:", err);
      showToast(err.response?.data?.error || 'Failed to reserve table.');
    } finally {
      setResLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#100507] to-red-950/60 p-6 md:p-10 border border-red-900/30">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-extrabold uppercase border border-red-600/30 mb-3">
            <Utensils size={14} /> Nearby Dining & Table Availability
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
            Discover Top Restaurants & Reserve Tables Instantly
          </h1>
          <p className="text-slate-400 text-sm">
            Check real-time table availability, distances, ratings, and price for two across your live GPS location or custom address.
          </p>
        </div>
      </div>

      {/* GPS Location & Full Address Control Bar */}
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
              <span>Allow location access for automatic nearby restaurant distance calculations.</span>
            )}
          </div>
        </div>

        {/* Popular City Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Quick Cities:</span>
          {POPULAR_LOCATIONS.map(city => (
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
              placeholder="City / Locality (e.g. Bandra, Delhi)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-100 text-sm focus:outline-none focus:border-red-500 transition-all placeholder:text-slate-600 font-bold"
            />
            <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
          </div>

          {/* Full Detailed Address Input */}
          <div className="relative md:w-1/3">
            <input
              type="text"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Full Address / Landmark (Optional)..."
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
              placeholder="Search restaurant name or cuisine..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-28 text-slate-100 text-sm focus:outline-none focus:border-red-500 transition-all placeholder:text-slate-600"
            />
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Find Tables'}
            </button>
          </div>

        </form>

        {/* Cuisine Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Cuisine:</span>
            {CUISINE_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedCuisine(tag)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  selectedCuisine === tag
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
            <span>Available Tables Only</span>
          </label>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((rest) => (
          <div
            key={rest._id}
            className="bg-[#08080c] border border-slate-900 rounded-3xl overflow-hidden hover:border-red-900/60 transition-all hover:scale-[1.01] flex flex-col justify-between group"
          >
            <div>
              {/* Image & Badges Header */}
              <div className="relative h-48 bg-slate-950 overflow-hidden">
                <img
                  src={rest.image}
                  alt={rest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-transparent to-black/40"></div>

                {/* Rating Badge (Red/White - No Yellow) */}
                <div className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                  <Star size={13} className="fill-white" />
                  <span>{rest.rating}</span>
                </div>

                {/* Distance Badge */}
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-slate-300 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                  <MapPin size={12} className="text-red-500" />
                  <span>{rest.distanceKm} km away</span>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-black text-lg text-white group-hover:text-red-400 transition-colors">
                    {rest.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-slate-500" />
                    <span>{rest.area}, {rest.city}</span>
                  </p>
                </div>

                {/* Cuisines */}
                <div className="flex flex-wrap gap-1.5">
                  {rest.cuisine.map((c, i) => (
                    <span key={i} className="text-[10px] font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">
                      {c}
                    </span>
                  ))}
                </div>

                {/* Pricing & Table Availability */}
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Cost for Two</span>
                    <span className="font-black text-white text-base">₹{rest.priceForTwo}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Table Status</span>
                    {rest.availableTables > 0 ? (
                      <span className="text-emerald-400 font-extrabold text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                        {rest.availableTables} Tables Open
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
                  setSelectedRestaurant(rest);
                }}
                disabled={rest.availableTables <= 0}
                className="w-full bg-slate-900 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-extrabold py-3 rounded-2xl text-xs transition-all border border-slate-800 hover:border-red-500 flex items-center justify-center gap-2"
              >
                <Calendar size={14} />
                {rest.availableTables > 0 ? 'Reserve Table Instantly' : 'No Tables Available'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && restaurants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-900 rounded-3xl bg-slate-950/40">
          <Utensils size={48} className="text-slate-800 mb-3" />
          <h3 className="text-base font-bold text-slate-400 mb-1">No Restaurants Found</h3>
          <p className="text-xs text-slate-600 max-w-sm text-center">
            Try searching for a different city or location (e.g. Delhi, Mumbai, Bangalore, Pune).
          </p>
        </div>
      )}

      {/* Table Reservation Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
            
            <button
              onClick={() => setSelectedRestaurant(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-900"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase bg-red-600/20 text-red-400 px-2.5 py-1 rounded-md border border-red-600/30">
                Instant Table Reservation
              </span>
              <h3 className="text-xl font-black text-white mt-2">{selectedRestaurant.name}</h3>
              <p className="text-xs text-slate-400">{selectedRestaurant.area}, {selectedRestaurant.city}</p>
            </div>

            <form onSubmit={handleReserveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Reservation Date
                </label>
                <input
                  type="date"
                  value={resDate}
                  onChange={(e) => setResDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Time Slot
                </label>
                <select
                  value={resTime}
                  onChange={(e) => setResTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="12:30 PM">12:30 PM (Lunch)</option>
                  <option value="01:30 PM">01:30 PM (Lunch)</option>
                  <option value="07:30 PM">07:30 PM (Dinner)</option>
                  <option value="08:30 PM">08:30 PM (Dinner)</option>
                  <option value="09:30 PM">09:30 PM (Late Dinner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Number of Guests
                </label>
                <select
                  value={resGuests}
                  onChange={(e) => setResGuests(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={4}>4 Guests</option>
                  <option value={6}>6 Guests</option>
                  <option value={8}>8+ Guests</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={resLoading}
                className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-red-950/50 transition-all flex items-center justify-center gap-2"
              >
                {resLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Table Reservation'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default RestaurantView;
