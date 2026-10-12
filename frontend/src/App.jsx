import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingDown, ExternalLink, Loader2, Zap, LayoutGrid, Star, ShieldCheck, Tag, Filter, ArrowUpDown, ShoppingBag, User as UserIcon, LogOut, UserCheck, Heart, ShoppingCart, Lock, CheckCircle2, Flame, Bell } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from './config.js';
import AuthModal from './AuthModal';
import WishlistDrawer from './WishlistDrawer';
import CartDrawer from './CartDrawer';
import PriceDropNotificationDrawer from './PriceDropNotificationDrawer';
import Sidebar from './Sidebar';
import RestaurantView from './RestaurantView';
import HotelView from './HotelView';
import ReviewView from './ReviewView';

const QUICK_SUGGESTIONS = [
  'Wireless Headphones',
  'Running Shoes',
  'Gaming Laptop',
  'Smart Watch',
  'Cotton T-Shirt',
  '4K Smart TV'
];

function App() {
  const [activeTab, setActiveTab] = useState('SHOPPING'); // SHOPPING | RESTAURANTS | HOTELS | REVIEWS

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [activeTasks, setActiveTasks] = useState(0);
  const [dispatchedStores, setDispatchedStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [sortBy, setSortBy] = useState('PRICE_ASC');

  // Polling ref to track active intervals and prevent overlapping
  const pollIntervalRef = useRef(null);

  // Auth & Drawers States
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Load stored auth session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        const parsedToken = savedToken;
        const parsedUser = JSON.parse(savedUser);
        setToken(parsedToken);
        setUser(parsedUser);
        fetchUserData(parsedToken);
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  // Fetch Wishlist, Cart & Price Alerts for authenticated user
  const fetchUserData = async (authToken) => {
    if (!authToken) return;
    const headers = { Authorization: `Bearer ${authToken}` };

    try {
      const [wRes, cRes, aRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/user/wishlist`, { headers }),
        axios.get(`${API_BASE_URL}/api/user/cart`, { headers }),
        axios.get(`${API_BASE_URL}/api/user/price-alerts`, { headers })
      ]);
      if (wRes.data) setWishlist(wRes.data);
      if (cRes.data) setCart(cRes.data);
      if (aRes.data) setPriceAlerts(aRes.data);
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  const handleAuthSuccess = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', tokenData);
    fetchUserData(tokenData);
    showToast(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setWishlist([]);
    setCart([]);
    setPriceAlerts([]);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    showToast('Signed out successfully.');
  };

  // Execute Search across Distributed Workers
  const executeSearch = async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;

    // Clear any existing polling interval at the start of each search
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    const trimmedTerm = searchTerm.trim();
    setProducts([]);
    setLoading(true);
    setStatus(`Initializing distributed worker nodes for "${trimmedTerm}"...`);
    setSelectedStore('ALL');

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(`${API_BASE_URL}/api/search`, { productName: trimmedTerm }, { headers });
      const searchId = res.data?.searchId;

      if (!searchId) {
        setLoading(false);
        setStatus('Could not initialize search session.');
        return;
      }

      if (res.data) {
        setActiveTasks(res.data.active_tasks || 0);
        setDispatchedStores(res.data.dispatched_stores || []);
      }
      
      let attempts = 0;
      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const resultsRes = await axios.get(`${API_BASE_URL}/api/results?searchId=${encodeURIComponent(searchId)}`, { headers });
          const validProducts = (resultsRes.data || []).filter(item => item.price > 0);
          setProducts(validProducts);

          if (validProducts.length > 0) {
            setStatus(`Gathered ${validProducts.length} deals for "${trimmedTerm}" from workers...`);
          }

          if (attempts >= 24) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setLoading(false);
            setStatus(validProducts.length > 0 ? `Analysis complete — ${validProducts.length} deals aggregated` : `No valid deals found for "${trimmedTerm}". Try another keyword.`);
            
            // Check for Price Drop Alerts on finished search if logged in
            if (token) {
              checkPriceAlerts(validProducts);
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2500);

    } catch (err) {
      console.error("Search failed:", err);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setLoading(false);
      setStatus('Could not connect to Master API server. Please retry.');
    }
  };

  const checkPriceAlerts = async (searchedItems) => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${API_BASE_URL}/api/user/price-alerts/check`,
        { searchedProducts: searchedItems },
        { headers }
      );
      if (res.data && res.data.allAlerts) {
        setPriceAlerts(res.data.allAlerts);
        if (res.data.newAlerts && res.data.newAlerts.length > 0) {
          showToast(`🔥 ${res.data.newAlerts.length} Price Drop Alerts Detected!`);
        }
      }
    } catch (err) {
      console.error("Error checking price alerts:", err);
    }
  };

  const handleMarkAllAlertsRead = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_BASE_URL}/api/user/price-alerts/read-all`, {}, { headers });
      if (res.data) setPriceAlerts(res.data);
      showToast('All alerts marked as read.');
    } catch (err) {
      console.error("Error marking alerts read:", err);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSuggestionClick = (term) => {
    setQuery(term);
    executeSearch(term);
  };

  // Toggle Wishlist
  const handleToggleWishlist = async (product) => {
    if (!user || !token) {
      setIsAuthOpen(true);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const isSaved = wishlist.some(w => w.url === product.url);

    try {
      if (isSaved) {
        const res = await axios.delete(`${API_BASE_URL}/api/user/wishlist`, {
          headers,
          data: { url: product.url }
        });
        setWishlist(res.data);
        showToast('Removed deal from Wishlist.');
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/user/wishlist`, product, { headers });
        setWishlist(res.data);
        showToast('Saved deal to Wishlist! ❤️');
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    }
  };

  // Add to Cart
  const handleAddToCart = async (product) => {
    if (!user || !token) {
      setIsAuthOpen(true);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.post(`${API_BASE_URL}/api/user/cart`, product, { headers });
      setCart(res.data);
      showToast('Added deal to Cart! 🛒');
    } catch (err) {
      console.error("Cart error:", err);
    }
  };

  const handleRemoveFromCart = async (url) => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/user/cart`, { headers, data: { url } });
      setCart(res.data);
      showToast('Item removed from Cart.');
    } catch (err) {
      console.error("Cart error:", err);
    }
  };

  const handleClearCart = async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/user/cart/clear`, { headers });
      setCart(res.data);
      showToast('Cart cleared.');
    } catch (err) {
      console.error("Clear cart error:", err);
    }
  };

  // Filtering & Sorting
  const availableStores = ['ALL', ...Array.from(new Set(products.map(p => p.store))).sort()];
  const filteredProducts = products.filter(p => selectedStore === 'ALL' || p.store === selectedStore);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'PRICE_ASC') return a.price - b.price;
    if (sortBy === 'PRICE_DESC') return b.price - a.price;
    if (sortBy === 'RATING') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'DISCOUNT') return (b.discount || 0) - (a.discount || 0);
    return 0;
  });

  const lowestPrice = products.length > 0 ? Math.min(...products.map(p => p.price)) : 0;
  const unreadAlertCount = priceAlerts.filter(a => !a.isRead).length;

  return (
    <div className="flex min-h-screen bg-[#020204] text-slate-100 font-sans relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c0c10] border border-red-900/80 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 size={16} className="text-red-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        wishlistCount={wishlist.length}
        cartCount={cart.length}
        alertCount={unreadAlertCount}
        onOpenWishlist={() => {
          if (!user) { setIsAuthOpen(true); return; }
          setIsWishlistOpen(true);
        }}
        onOpenCart={() => {
          if (!user) { setIsAuthOpen(true); return; }
          setIsCartOpen(true);
        }}
        onOpenPriceAlerts={() => {
          if (!user) { setIsAuthOpen(true); return; }
          setIsAlertsOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 min-w-0 max-w-7xl mx-auto">
        
        {/* Render Tab 1: SHOPPING SCRAPER */}
        {activeTab === 'SHOPPING' && (
          <div className="space-y-8">
            
            {/* Header Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-red-600/20 text-red-500 text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-red-600/30 flex items-center gap-1.5">
                    <Flame size={14} className="text-red-500 fill-red-500" />
                    Distributed Engine v2.0
                  </span>
                  <span className="text-xs text-slate-500 font-medium">15+ Platforms Supported</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  Multi-Store Shopping Scraper
                </h1>
              </div>

              {/* Status & Bell Alert Indicator */}
              <div className="flex items-center gap-3 shrink-0">
                {user && (
                  <button
                    onClick={() => setIsAlertsOpen(true)}
                    className="relative bg-slate-950 border border-slate-900 p-3 rounded-2xl text-slate-300 hover:text-white transition-colors"
                    title="Price Drop Notifications"
                  >
                    <Bell size={20} className={unreadAlertCount > 0 ? "text-red-500 animate-pulse" : ""} />
                    {unreadAlertCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#020204]">
                        {unreadAlertCount}
                      </span>
                    )}
                  </button>
                )}

                <div className="bg-slate-950 border border-slate-900 p-3 rounded-2xl px-5 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Worker Status</div>
                  <div className="text-sm font-bold text-red-500 flex items-center justify-center gap-2 mt-0.5">
                    {loading ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        Active ({activeTasks} Tasks)
                      </>
                    ) : (
                      <span className="text-slate-400">Idle</span>
                    )}
                  </div>
                </div>

                {/* Top Header User Profile / Login Button */}
                {user ? (
                  <div className="bg-slate-950 border border-slate-900 px-3 py-2 rounded-2xl flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-black border border-red-500/40 flex items-center justify-center font-black text-white text-xs shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-bold text-slate-200 truncate max-w-[100px]">{user.name}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">Active Session</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors ml-1"
                      title="Sign Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-3 rounded-2xl text-xs font-black shadow-lg shadow-red-950/40 transition-all flex items-center gap-2 shrink-0"
                  >
                    <UserCheck size={16} />
                    <span>Sign In / Register</span>
                  </button>
                )}
              </div>
            </div>

            {/* Guest Lock Banner */}
            {!user && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0d0406] to-red-950/40 border border-red-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-600/30 shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Authentication Required for Real-Time Deal Scraping</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sign in or create a free account to unlock search access, save wishlists, and track price drops across 15+ stores.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shrink-0 shadow-lg shadow-red-950/50"
                >
                  Log In Now
                </button>
              </div>
            )}

            {/* Search Bar & Quick Suggestions */}
            <div>
              <form onSubmit={handleFormSubmit} className="relative group mb-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-700 via-red-600 to-black rounded-3xl blur opacity-30 group-focus-within:opacity-75 transition duration-500"></div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products across 15+ shopping sites (e.g. Laptop, iPhone, Shoes)..."
                    className="w-full bg-slate-950 border border-slate-900 rounded-2xl py-5 pl-14 pr-36 focus:outline-none focus:border-red-600 transition-all text-base md:text-lg text-slate-100 placeholder:text-slate-600"
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
                  <button 
                    disabled={loading}
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white px-7 py-3 rounded-xl font-extrabold transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-red-950/50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Scrape Deals'}
                  </button>
                </div>
              </form>

              {/* Quick Suggestions Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Trending:</span>
                {QUICK_SUGGESTIONS.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(term)}
                    className="text-xs bg-slate-950/90 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Indicator & Dispatched Platforms Bar */}
            {status && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                  {loading && <Loader2 size={16} className="animate-spin text-red-500 shrink-0" />}
                  <span>{status}</span>
                </div>

                {dispatchedStores.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-bold uppercase mr-1">Dispatched to:</span>
                    {dispatchedStores.map((st, idx) => (
                      <span key={idx} className="text-[11px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md font-semibold">
                        {st}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Filter and Sort Toolbar */}
            {products.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <Filter size={16} className="text-slate-500 shrink-0 mr-1" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Store:</span>
                  {availableStores.map(storeName => (
                    <button
                      key={storeName}
                      onClick={() => setSelectedStore(storeName)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                        selectedStore === storeName
                          ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {storeName}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ArrowUpDown size={16} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="PRICE_ASC">Price: Low to High</option>
                    <option value="PRICE_DESC">Price: High to Low</option>
                    <option value="RATING">Highest Rating</option>
                    <option value="DISCOUNT">Biggest Discount</option>
                  </select>
                </div>
              </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map((item, idx) => {
                const isLowestPrice = lowestPrice > 0 && item.price === lowestPrice;
                const isSavedInWishlist = wishlist.some(w => w.url === item.url);
                const isInCart = cart.some(c => c.url === item.url);
                const hasPriceDrop = item.originalPrice && item.originalPrice > item.price;
                const dropSaved = hasPriceDrop ? item.originalPrice - item.price : 0;

                return (
                  <div 
                    key={idx} 
                    className={`relative overflow-hidden group rounded-3xl p-[1px] transition-all hover:scale-[1.02] ${
                      isLowestPrice 
                        ? 'bg-gradient-to-br from-red-600 via-red-900 to-black shadow-lg shadow-red-950/50' 
                        : 'bg-gradient-to-br from-slate-900 via-[#0a0a0e] to-black hover:from-red-950/60 hover:to-slate-950'
                    }`}
                  >
                    <div className="bg-[#08080c] rounded-[23px] p-5 h-full w-full flex flex-col justify-between">
                      
                      {/* Top Bar: Store Name & Actions */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-slate-950 text-slate-300 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg border border-slate-900">
                            {item.store}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Wishlist Toggle Button */}
                            <button
                              onClick={() => handleToggleWishlist(item)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isSavedInWishlist
                                  ? 'bg-red-600/20 text-red-500 border-red-600/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-red-400'
                              }`}
                              title={isSavedInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                            >
                              <Heart size={16} className={isSavedInWishlist ? "fill-red-500" : ""} />
                            </button>

                            {/* Add to Cart Button */}
                            <button
                              onClick={() => handleAddToCart(item)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isInCart
                                  ? 'bg-red-600/20 text-red-400 border-red-600/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-red-400'
                              }`}
                              title="Add to cart"
                            >
                              <ShoppingCart size={16} />
                            </button>

                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="View on store"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>

                        {/* Image Thumbnail & Badges */}
                        <div className="w-full h-44 bg-slate-950 rounded-2xl mb-4 overflow-hidden flex items-center justify-center p-2 border border-slate-900 relative">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.title}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full items-center justify-center text-slate-700 ${item.image ? 'hidden' : 'flex'}`}>
                            <ShoppingBag size={40} />
                          </div>

                          {/* Price Drop Crimson Badge */}
                          {hasPriceDrop && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md flex items-center gap-1 animate-pulse">
                              <TrendingDown size={11} /> PRICE DROPPED ₹{dropSaved.toLocaleString('en-IN')}
                            </span>
                          )}

                          {isLowestPrice && (
                            <span className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                              <Zap size={10} className="fill-white" /> Lowest Price
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-slate-200 text-sm leading-snug line-clamp-2 mb-3 h-10 group-hover:text-red-400 transition-colors">
                          {item.title}
                        </h3>
                      </div>

                      {/* Bottom Info: Rating & Price */}
                      <div className="mt-4 pt-3 border-t border-slate-900 flex items-end justify-between">
                        <div>
                          {item.rating ? (
                            <div className="flex items-center gap-1 text-red-500 text-xs font-bold mb-1">
                              <Star size={12} className="fill-red-500 text-red-500" />
                              <span>{item.rating}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-600 font-bold uppercase mb-1">Price</div>
                          )}
                          
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white italic tracking-tight">
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                            {item.originalPrice > item.price && (
                              <span className="text-xs text-slate-500 line-through">
                                ₹{item.originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>

                        <a 
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-800 hover:border-red-500"
                        >
                          Get Deal
                        </a>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {!loading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-900 rounded-3xl bg-slate-950/40">
                <LayoutGrid size={56} className="text-slate-800 mb-4" />
                <h3 className="text-lg font-bold text-slate-400 mb-1">No Active Deal Search</h3>
                <p className="text-slate-600 text-sm max-w-md text-center">
                  Type a product name or click one of the trending suggestions above to scrape real-time deals across 15+ stores.
                </p>
              </div>
            )}

          </div>
        )}

        {/* Render Tab 2: NEARBY RESTAURANTS & TABLES */}
        {activeTab === 'RESTAURANTS' && (
          <RestaurantView
            user={user}
            token={token}
            onOpenAuth={() => setIsAuthOpen(true)}
            showToast={showToast}
          />
        )}

        {/* Render Tab 3: HOTEL STAYS & ROOMS */}
        {activeTab === 'HOTELS' && (
          <HotelView
            user={user}
            token={token}
            onOpenAuth={() => setIsAuthOpen(true)}
            showToast={showToast}
          />
        )}

        {/* Render Tab 4: USER REVIEWS & WEBSITE FEEDBACK */}
        {activeTab === 'REVIEWS' && (
          <ReviewView
            user={user}
            token={token}
            onOpenAuth={() => setIsAuthOpen(true)}
            showToast={showToast}
          />
        )}

      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Price Drop Alerts Drawer */}
      <PriceDropNotificationDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={priceAlerts}
        onMarkAllRead={handleMarkAllAlertsRead}
      />

    </div>
  );
}

export default App;