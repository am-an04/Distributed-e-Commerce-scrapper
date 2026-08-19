import React from 'react';
import { X, Bell, TrendingDown, ExternalLink, ShoppingCart, Heart, Search, CheckCircle2, ArrowRight } from 'lucide-react';

function PriceDropNotificationDrawer({ isOpen, onClose, alerts, onMarkAllRead }) {
  if (!isOpen) return null;

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-950 border-l border-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-600/20 text-red-500 border border-red-600/30">
                <Bell size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  Price Drop Alerts
                </h2>
                <p className="text-xs text-slate-400">{alerts.length} Detected Price Drops</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[10px] font-extrabold uppercase bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Alerts List */}
          {alerts.length > 0 ? (
            <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {alerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`bg-[#08080c] border rounded-2xl p-4 flex gap-3.5 transition-all ${
                    !alert.isRead
                      ? 'border-red-600/60 shadow-lg shadow-red-950/30'
                      : 'border-slate-900 opacity-80'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-800 p-1">
                    {alert.image ? (
                      <img src={alert.image} alt={alert.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <TrendingDown size={24} className="text-red-500" />
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold uppercase bg-red-600/20 text-red-400 px-2 py-0.5 rounded border border-red-600/30 flex items-center gap-1">
                          {alert.source === 'CART' && <ShoppingCart size={10} />}
                          {alert.source === 'WISHLIST' && <Heart size={10} />}
                          {alert.source === 'SEARCH' && <Search size={10} />}
                          <span>{alert.source} ITEM</span>
                        </span>

                        <span className="text-[10px] text-slate-500 font-bold">
                          {alert.store}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-tight">
                        {alert.title}
                      </h4>
                    </div>

                    {/* Price Comparison */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-black text-white italic">
                            ₹{alert.currentPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500 line-through">
                            ₹{alert.previousPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold text-red-500 flex items-center gap-0.5">
                          <TrendingDown size={10} /> Saved ₹{alert.dropAmount.toLocaleString('en-IN')} ({alert.dropPercentage}% OFF)
                        </span>
                      </div>

                      <a
                        href={alert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-md shadow-red-950/40"
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
                <Bell size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-400 mb-1">No Price Drops Detected Yet</h3>
              <p className="text-xs text-slate-600 max-w-xs">
                As you search products or add deals to your Wishlist & Cart, our automated background engine will monitor and alert you whenever prices drop!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="pt-4 border-t border-slate-900 text-center">
            <span className="text-xs text-slate-500 font-bold">
              🔥 System automatically monitors prices across 15+ stores 24/7.
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

export default PriceDropNotificationDrawer;
