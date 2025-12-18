import { authAPI } from './api';

/**
 * Service untuk menangani autentikasi (login, register, logout)
 * Terhubung ke database melalui API Taniku (PHP Native)
 */

/**
 * Login user ke database
 * @param {Object} loginData - Data login {email, password}
 * @returns {Promise} Response dari API
 */
export const login = async (loginData) => {
  try {
    const response = await authAPI.login(loginData);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register user baru ke database
 * @param {Object} registerData - Data register {name, email, password, password_confirmation}
 * @returns {Promise} Response dari API
 */
export const register = async (registerData) => {
  try {
    const response = await authAPI.register(registerData);
    return response;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

/**
 * Logout user dari database
 * @returns {Promise} Response dari API
 */
export const logout = async () => {
  try {
    // Panggil logout dari authAPI
    authAPI.logout();
    return { success: true, message: 'Logout berhasil' };
  } catch (error) {
    console.error('Logout error:', error);
    // Tetap hapus token meskipun API error
    authAPI.logout();
    throw error;
  }
};

/**
 * Mendapatkan data user yang sedang login
 * @returns {Promise} Response dari API
 */
export const getCurrentUser = async () => {
  try {
    const response = await authAPI.getProfile();
    return response;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Cek apakah user sudah login (ada token)
 * @returns {boolean} True jika ada token
 */
export const isAuthenticated = () => {
  return authAPI.isAuthenticated();
};

/**
 * Mendapatkan token dari localStorage
 * @returns {string|null} Token atau null
 */
export const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Mendapatkan data user dari localStorage
 * @returns {Object|null} User data atau null
 */
export const getUserData = () => {
  return authAPI.getCurrentUser();
};