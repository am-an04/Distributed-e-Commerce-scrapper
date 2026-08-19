import React from 'react';
import { X, ShoppingCart, ExternalLink, Trash2, ShoppingBag, TrendingDown, Tag, ArrowRight } from 'lucide-react';

function CartDrawer({ isOpen, onClose, cart, onRemoveFromCart, onClearCart }) {
  if (!isOpen) return null;

  const totalDealPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const totalOriginalPrice = cart.reduce((sum, item) => {
    const orig = item.originalPrice && item.originalPrice > item.price ? item.originalPrice : item.price;
    return sum + (orig * (item.quantity || 1));
  }, 0);

  const totalSavings = Math.max(0, totalOriginalPrice - totalDealPrice);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-950 border-l border-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-600/20">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Deal Cart & Compare</h2>
                <p className="text-xs text-slate-400">{cart.length} Selected Items</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          {cart.length > 0 ? (
            <div className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {cart.map((item, idx) => (
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
                          onClick={() => onRemoveFromCart(item.url)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                      <div>
                        <span className="text-base font-black text-white italic">
                          ₹{(item.price * (item.quantity || 1)).toLocaleString('en-IN')}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-slate-500 block">
                            (Qty: {item.quantity})
                          </span>
                        )}
                      </div>
                      
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-md shadow-red-950/40"
                      >
                        Buy Deal <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700 mb-4">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-400 mb-1">Your Cart is Empty</h3>
              <p className="text-xs text-slate-600 max-w-xs">
                Add products from your search results to compare total prices and calculate your maximum savings!
              </p>
            </div>
          )}
        </div>

        {/* Total Savings Summary Box */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-slate-900">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Original Total List MRP:</span>
                <span className="line-through font-semibold">₹{totalOriginalPrice.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between text-xs text-slate-400">
                <span>Aggregated Deal Price:</span>
                <span className="font-bold text-white">₹{totalDealPrice.toLocaleString('en-IN')}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800 text-red-400 font-extrabold">
                  <span className="flex items-center gap-1">
                    <TrendingDown size={14} /> Total Money Saved:
                  </span>
                  <span className="bg-red-600/20 border border-red-600/30 px-2.5 py-1 rounded-lg text-white">
                    ₹{totalSavings.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onClearCart}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-400 py-1 transition-colors"
            >
              Clear Cart Items
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default CartDrawer;
