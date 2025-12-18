import axios from 'axios';

// Konfigurasi dasar axios
const resolveBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) return envUrl.trim();
  // Prefer dev API server at port 5176 when available
  const preferred = 'http://localhost:5176';
  return preferred;
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // Timeout dalam milidetik
});

// Interceptor untuk request
api.interceptors.request.use(
  (config) => {
    // Jika ada token autentikasi di localStorage, tambahkan ke header
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk response
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle error global di sini
    if (error.response) {
      // Error dari server dengan response
      console.error('Response error:', error.response.data);
      
      // Handle 401 Unauthorized (token tidak valid atau expired)
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        // Redirect ke halaman login jika diperlukan
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // Error karena tidak ada response (network error)
      console.error('Request error:', error.request);
    } else {
      // Error lainnya
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      if (response.data.message === 'Login successful' && response.data.token) {
        // Simpan token dan data user ke localStorage
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  // Get current user data from localStorage
  getCurrentUser: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
};

export default api;
