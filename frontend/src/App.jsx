import React, { useState, useEffect } from 'react';
import { Search, TrendingDown, ExternalLink, Loader2, Zap, LayoutGrid } from 'lucide-react';
import axios from 'axios';

function App() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setProducts([]); // Clear old results
    setLoading(true);
    setStatus('Initializing distributed workers...');

    try {
      // 1. Trigger the Master API
      await axios.post('http://localhost:3000/api/search', { productName: query });
      
      // 2. Start Polling for results every 2 seconds
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const res = await axios.get('http://localhost:3000/api/results');
          
          // Filter out items with 0 price before setting state
          const validProducts = res.data.filter(item => item.price > 0);
          setProducts(validProducts);

          if (validProducts.length > 0) {
            setStatus(`Found ${validProducts.length} deals...`);
          }

          // Stop if we have results from most platforms or after 20 seconds
          if (validProducts.length >= 3 || attempts >= 10) {
            clearInterval(pollInterval);
            setLoading(false);
            setStatus(validProducts.length > 0 ? 'Analysis Complete' : 'No valid deals found.');
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);

    } catch (err) {
      console.error("Search failed:", err);
      setLoading(false);
      setStatus('Error connecting to engine.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header section with Stats */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Distributed Intel Engine
            </h1>
            <p className="text-slate-400 mt-2 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              Real-time multi-platform price aggregation
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl px-6 text-center">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Status</div>
              <div className="text-sm font-medium text-blue-400">{loading ? 'Active' : 'Idle'}</div>
            </div>
          </div>
        </header>

        {/* Powerful Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-16 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for today?"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 px-14 focus:outline-none focus:border-blue-500 transition-all text-lg placeholder:text-slate-600"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <button 
              disabled={loading}
              // className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 px-8 py-2.5 rounded-xl font-bold transition-all transform active:scale-95"
              // Update your button className
                 className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all transform active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Analyze'}
            </button>
          </div>
        </form>

        {/* Status indicator */}
        {status && (
          <div className="mb-6 flex items-center justify-center text-sm text-slate-500 italic">
            {loading && <Loader2 size={14} className="animate-spin mr-2" />}
            {status}
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {products.map((item, idx) => (
    <div 
      key={idx} 
      className="relative overflow-hidden group rounded-3xl p-[1px] bg-gradient-to-br from-red-600 via-red-900 to-black transition-all hover:scale-[1.02]"
    >
      {/*  Content starts INSIDE the background wrapper */}
      <div className="bg-[#050505] rounded-[22px] p-6 h-full w-full group-hover:bg-gradient-to-br group-hover:from-[#1a0505] group-hover:to-black transition-all flex flex-col">
        
        <div className="flex justify-between items-start mb-6">
          <span className="bg-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border border-red-600/30">
            {item.store}
          </span>
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-red-500 transition-colors"
          >
            <ExternalLink size={20} />
          </a>
        </div>

        <h3 className="font-bold text-slate-200 text-lg line-clamp-2 mb-6 h-14 group-hover:text-red-100 transition-colors">
          {item.title}
        </h3>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Current Price</div>
            <div className="text-3xl font-black text-white italic tracking-tighter">
              ₹{item.price.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="flex items-center text-red-500 text-xs font-bold bg-red-600/10 border border-red-600/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.2)]">
            <TrendingDown size={14} className="mr-1" /> Best Deal
          </div>
        </div>
      </div> 
      {/*  Background wrapper ends AFTER content */}
    </div>
  ))}
</div>
        

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-900 rounded-3xl">
            <LayoutGrid size={48} className="text-slate-800 mb-4" />
            <p className="text-slate-600 font-medium">No active analysis. Enter a product name to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;