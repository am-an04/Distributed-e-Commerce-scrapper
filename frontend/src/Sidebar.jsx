import React from 'react';
import { ShoppingBag, UtensilsCrossed, Hotel, MessageSquare, Heart, ShoppingCart, ShieldCheck, LogOut, UserCheck, Flame, ChevronRight, Bell } from 'lucide-react';

function Sidebar({ activeTab, setActiveTab, user, onOpenAuth, onLogout, wishlistCount, cartCount, alertCount, onOpenWishlist, onOpenCart, onOpenPriceAlerts }) {
  return (
    <aside className="w-64 bg-[#050507] border-r border-slate-900 h-screen sticky top-0 flex flex-col justify-between p-5 z-40 shrink-0">
      
      {/* Top Branding & Menu */}
      <div>
        {/* App Logo */}
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-900">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-700 via-red-600 to-black p-0.5 shadow-lg shadow-red-950/60 flex items-center justify-center">
            <div className="w-full h-full bg-[#08080c] rounded-[14px] flex items-center justify-center">
              <Flame size={22} className="text-red-500 fill-red-500 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-white flex items-center gap-1">
              INTEL<span className="text-red-500">ENGINE</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Distributed v2.0</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Modules
          </div>

          {/* Shopping Deals Tab */}
          <button
            onClick={() => setActiveTab('SHOPPING')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'SHOPPING'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-950/50 border border-red-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} className={activeTab === 'SHOPPING' ? "text-white" : "text-slate-500"} />
              <span>Shopping Scraper</span>
            </div>
            <ChevronRight size={14} className={activeTab === 'SHOPPING' ? "text-white" : "opacity-0"} />
          </button>

          {/* Restaurants & Tables Tab */}
          <button
            onClick={() => setActiveTab('RESTAURANTS')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'RESTAURANTS'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-950/50 border border-red-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <UtensilsCrossed size={18} className={activeTab === 'RESTAURANTS' ? "text-white" : "text-slate-500"} />
              <span>Nearby Restaurants</span>
            </div>
            <ChevronRight size={14} className={activeTab === 'RESTAURANTS' ? "text-white" : "opacity-0"} />
          </button>

          {/* Hotel Bookings Tab */}
          <button
            onClick={() => setActiveTab('HOTELS')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'HOTELS'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-950/50 border border-red-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Hotel size={18} className={activeTab === 'HOTELS' ? "text-white" : "text-slate-500"} />
              <span>Hotel Stays & Rooms</span>
            </div>
            <ChevronRight size={14} className={activeTab === 'HOTELS' ? "text-white" : "opacity-0"} />
          </button>

          {/* User Reviews & Website Feedback Tab */}
          <button
            onClick={() => setActiveTab('REVIEWS')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'REVIEWS'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-950/50 border border-red-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className={activeTab === 'REVIEWS' ? "text-white" : "text-slate-500"} />
              <span>Reviews & Feedback</span>
            </div>
            <ChevronRight size={14} className={activeTab === 'REVIEWS' ? "text-white" : "opacity-0"} />
          </button>

          <div className="pt-4 pb-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-2">
              Alerts & Saved
            </div>

            {/* Price Drop Alerts Quick Button */}
            <button
              onClick={onOpenPriceAlerts}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell size={18} className={alertCount > 0 ? "text-red-500 animate-pulse" : "text-slate-500"} />
                <span>Price Drop Alerts</span>
              </div>
              {alertCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Wishlist Quick Button */}
            <button
              onClick={onOpenWishlist}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart size={18} className={wishlistCount > 0 ? "text-red-500 fill-red-500" : "text-slate-500"} />
                <span>Wishlist Deals</span>
              </div>
              {wishlistCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Quick Button */}
            <button
              onClick={onOpenCart}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={18} className={cartCount > 0 ? "text-red-400" : "text-slate-500"} />
                <span>Cart & Savings</span>
              </div>
              {cartCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="pt-4 border-t border-slate-900">
        {user ? (
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-black border border-red-500/40 flex items-center justify-center font-black text-white text-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-200 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 rounded-2xl text-xs font-black shadow-lg shadow-red-950/40 transition-all flex items-center justify-center gap-2"
          >
            <UserCheck size={16} />
            Sign In / Register
          </button>
        )}
      </div>

    </aside>
  );
}

export default Sidebar;
