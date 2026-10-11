const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? 'http://localhost:3000' : 'https://distributed-e-commerce-scrapper.onrender.com')
).replace(/\/+$/, '');
