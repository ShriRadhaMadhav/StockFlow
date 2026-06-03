import axios from 'axios';

// Create a centralized Axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s default
});

// Helper to extract the auth token from zustand persist storage
const getAuthToken = (): string | null => {
  try {
    const persistedState = localStorage.getItem('stockflow-auth');
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      // Zustand persist stores state under 'state' key
      const token = parsed?.state?.token;
      if (token) return token;
    }
  } catch {
    // Ignore parse errors
  }
  // Fallback to standalone key (should not normally be used)
  return localStorage.getItem('token');
};

// Request interceptor for Auth Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.data) {
      const backendError = error.response.data.message || 'An unexpected error occurred';
      
      // Handle unauthorized session
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('stockflow-auth');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      // Handle rate limiting
      if (error.response.status === 429) {
        return Promise.reject(new Error('Too many requests. Please wait a moment and try again.'));
      }
      
      return Promise.reject(new Error(backendError));
    }
    
    // Network or timeout errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please try again.'));
    }
    
    return Promise.reject(new Error(error.message || 'Network error. Please check your connection.'));
  }
);

// Generic type wrappers
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
