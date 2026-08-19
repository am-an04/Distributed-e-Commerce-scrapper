import React from 'react';
import { X, Heart, ExternalLink, Trash2, ShoppingBag } from 'lucide-react';

function WishlistDrawer({ isOpen, onClose, wishlist, onRemoveFromWishlist, onAddToCart }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-950 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-600/20">
                <Heart size={20} className="fill-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Your Saved Wishlist</h2>
                <p className="text-xs text-slate-400">{wishlist.length} Saved Deals</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Wishlist Items List */}
          {wishlist.length > 0 ? (
            <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
              {wishlist.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="w-20 h-20 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-800 p-1">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ShoppingBag size={24} className="text-slate-700" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold uppercase bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                          {item.store}
                        </span>
                        <button
                          onClick={() => onRemoveFromWishlist(item.url)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                      <span className="text-base font-black text-white italic">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onAddToCart(item)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                        >
                          + Cart
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                          title="View on store"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700 mb-4">
                <Heart size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-400 mb-1">Your Wishlist is Empty</h3>
              <p className="text-xs text-slate-600 max-w-xs">
                Click the heart icon on any deal card to save products here for quick access.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
            Saved deals are synced to your secure cloud profile.
          </div>
        )}

      </div>
    </div>
  );
}

export default WishlistDrawer;
