import axios from 'axios';

// withCredentials is what lets the browser send/receive the httpOnly auth
// cookie. The JWT itself is never touched by JS, on purpose.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
