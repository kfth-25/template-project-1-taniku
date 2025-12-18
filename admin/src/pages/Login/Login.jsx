import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '').trim();
    if (!u) { setError('Masukkan username'); return; }
    if (!p) { setError('Masukkan password'); return; }
    if (!(u === 'budi' && p === 'budi123')) { setError('Username atau password salah'); return; }
    const user = { username: 'budi' };
    try {
      localStorage.setItem('adminUser', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Gagal menyimpan sesi');
    }
  };

  return (
    <div className="login-layout">
      <section className="login-hero">
        <div className="hero-inner">
          <div className="hero-visual">
            <img src={assets.tani} alt="Tani" className="hero-image" />
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="panel-card">
          <div className="panel-head">
            <img src={assets.logo} alt="TaniKu" className="panel-logo" />
            <h2>Masuk Admin</h2>
          </div>
          <form onSubmit={onSubmit} className="panel-form">
            <label className="form-field">
              <span>Username</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="budi" />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                aria-label="Password"
              />
            </label>
            <div className="form-row">
              <label className="remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Ingat saya</span>
              </label>
              <a className="link" href="#">Lupa password?</a>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full">Masuk</button>
          </form>
          <p className="panel-note">Masuk untuk mengakses seluruh fitur admin TaniKu</p>
        </div>
      </section>
    </div>
  );
}

export default Login;
