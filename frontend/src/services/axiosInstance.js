import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handle authentication errors centrally
axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        'Authentication required:',
        error.response?.data?.message || 'Session expired'
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;