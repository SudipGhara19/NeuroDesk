import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // Crucial for sending tracking httpOnly cookies!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to catch 401s and automatically refresh the token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error status is 401 and there is no originalRequest._retry flag,
    // it means the short-lived access token has expired and we need to refresh it.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Because of withCredentials: true, the httpOnly jwt cookie automatically travels with this request!
        const { data } = await api.get('/auth/refresh');
        
        // Save the brand new 15-minute access token back to local storage
        localStorage.setItem('token', data.token);

        // Mutate original request header with the new token
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        
        // Re-run the exact API request that just failed!
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh token is fully expired or invalid (e.g., > 7 days).
        // Force the user to log in again.
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth'; 
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
