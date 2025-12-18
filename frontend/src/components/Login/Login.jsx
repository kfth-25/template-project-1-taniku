import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { login as apiLogin, register as apiRegister } from '../../services/authService';
import googleIcon from '../../assets/google.png';
import facebookIcon from '../../assets/facebook.png';
import instagramIcon from '../../assets/instagram.png';
import './Login.css';

const Login = ({ isOpen, onClose }) => {
  const { login: contextLogin } = useContext(StoreContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const MIN_PASSWORD_LENGTH = 6;
  const MAX_PASSWORD_LENGTH = 64;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (name === 'password') {
      if (value.length < MIN_PASSWORD_LENGTH) {
        setPasswordError(`Password minimal ${MIN_PASSWORD_LENGTH} karakter`);
      } else if (value.length > MAX_PASSWORD_LENGTH) {
        setPasswordError(`Password maksimal ${MAX_PASSWORD_LENGTH} karakter`);
      } else {
        setPasswordError('');
      }
      if (!isLogin && formData.confirmPassword) {
        setConfirmPasswordError(value === formData.confirmPassword ? '' : 'Konfirmasi password tidak cocok');
      }
    }
    if (name === 'confirmPassword') {
      setConfirmPasswordError(value === formData.password ? '' : 'Konfirmasi password tidak cocok');
    }
  };

  const handleSocialLogin = (provider) => {
    // Social login tidak terhubung ke database
    // Ini hanya simulasi untuk demo
    const userData = {
      name: `User ${provider}`,
      email: `user@${provider.toLowerCase()}.com`,
      phone: '',
      address: '',
      city: '',
      postalCode: ''
    };
    contextLogin(userData);
    onClose();
    const next = (() => { try { return localStorage.getItem('post_login_redirect') } catch { return null } })();
    if (next) { try { localStorage.removeItem('post_login_redirect') } catch { /* ignore */ } ; navigate(next) } else { navigate('/notifications') }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isLogin) {
        if (formData.password.length < MIN_PASSWORD_LENGTH) {
          setError(`Password minimal ${MIN_PASSWORD_LENGTH} karakter`);
          setLoading(false);
          return;
        }
        if (formData.password.length > MAX_PASSWORD_LENGTH) {
          setError(`Password maksimal ${MAX_PASSWORD_LENGTH} karakter`);
          setLoading(false);
          return;
        }
        // Handle login dengan API
        const loginData = {
          email: formData.email,
          password: formData.password
        };
        
        const response = await apiLogin(loginData);
        console.log('Login berhasil:', response);
        
        // Update context dengan data user dari API
        if (response.message === 'Login successful' && response.user) {
          contextLogin({
            name: response.user.name,
            email: response.user.email,
            phone: response.user.phone || '',
            address: response.user.address || '',
            city: response.user.city || '',
            postalCode: response.user.postal_code || ''
          });
          onClose();
          const next = (() => { try { return localStorage.getItem('post_login_redirect') } catch { return null } })();
          if (next) { try { localStorage.removeItem('post_login_redirect') } catch { /* ignore */ } ; navigate(next) } else { navigate('/notifications') }
        } else {
          setError(response.message || 'Login gagal');
        }
      } else {
        // Handle register
        if (formData.password.length < MIN_PASSWORD_LENGTH) {
          setError(`Password minimal ${MIN_PASSWORD_LENGTH} karakter`);
          setLoading(false);
          return;
        }
        if (formData.password.length > MAX_PASSWORD_LENGTH) {
          setError(`Password maksimal ${MAX_PASSWORD_LENGTH} karakter`);
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Password tidak cocok!');
          setLoading(false);
          return;
        }
        
        const registerData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword
        };
        
        const response = await apiRegister(registerData);
        console.log('Register berhasil:', response);
        
        // Update context dengan data user dari API
        if (response.message === 'User registered successfully' && response.user) {
          contextLogin({
            name: response.user.name,
            email: response.user.email,
            phone: response.user.phone || '',
            address: response.user.address || '',
            city: response.user.city || '',
            postalCode: response.user.postal_code || ''
          });
          onClose();
          const next = (() => { try { return localStorage.getItem('post_login_redirect') } catch { return null } })();
          if (next) { try { localStorage.removeItem('post_login_redirect') } catch { /* ignore */ } ; navigate(next) } else { navigate('/notifications') }
        } else {
          setError(response.message || 'Registrasi gagal');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Terjadi kesalahan');
      } else {
        setError('Terjadi kesalahan koneksi');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-content" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <button className="login-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <h2>{isLogin ? 'Selamat Datang Kembali' : 'Bergabung dengan Kami'}</h2>
          <p>{isLogin ? 'Masuk ke akun Anda untuk melanjutkan' : 'Buat akun baru untuk memulai berbelanja'}</p>
        </div>
        
        <div className="login-body">
          {/* Email/Password Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Nama Lengkap</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Masukkan email Anda"
                required
                disabled={loading}
              />
            </div>
            
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Masukkan password"
              required
              disabled={loading}
              maxLength={MAX_PASSWORD_LENGTH}
              aria-invalid={!!passwordError}
            />
            {passwordError && (
              <div style={{ color: 'red', marginTop: '8px', fontSize: '13px' }}>{passwordError}</div>
            )}
          </div>
            
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Konfirmasi Password</label>
                <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Konfirmasi password"
              required
              disabled={loading}
              maxLength={MAX_PASSWORD_LENGTH}
              aria-invalid={!!confirmPasswordError}
            />
            {confirmPasswordError && (
              <div style={{ color: 'red', marginTop: '8px', fontSize: '13px' }}>{confirmPasswordError}</div>
            )}
          </div>
            )}
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          <div className="divider">
            <span>atau</span>
          </div>

          {/* Social Login Section - Icons only */}
          <div className="social-login-section">
            <div className="social-login-buttons">
              <button 
                className="social-login-btn google" 
                onClick={() => handleSocialLogin('Google')}
              >
                <img src={googleIcon} alt="Google" />
              </button>
              <button 
                className="social-login-btn facebook" 
                onClick={() => handleSocialLogin('Facebook')}
              >
                <img src={facebookIcon} alt="Facebook" />
              </button>
              <button 
                className="social-login-btn instagram" 
                onClick={() => handleSocialLogin('Instagram')}
              >
                <img src={instagramIcon} alt="Instagram" />
              </button>
              <button 
                className="social-login-btn linkedin" 
                onClick={() => handleSocialLogin('LinkedIn')}
              >
                <img src="/src/assets/linkedin_icon.png" alt="LinkedIn" />
              </button>
            </div>
          </div>
          
          <div className="toggle-section">
            <p>
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
            </p>
            <button 
              className="toggle-btn" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
