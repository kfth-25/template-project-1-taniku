import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const saved = (() => { try { return JSON.parse(localStorage.getItem('adminUser')||'null'); } catch { return null } })();
  const userName = saved?.username || 'Admin';

  const handleLogout = () => {
    try {
      localStorage.removeItem('adminUser');
      window.dispatchEvent(new Event('auth-changed'));
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Search Section */}
        <div className="header-search">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-wrapper">
              <img src={assets.search_icon} alt="Search" className="search-icon" />
              <input
                type="text"
                placeholder="Search something..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </form>
        </div>

        {/* Right Section: Notifications + Greeting */}
        <div className="header-actions">
          <div className="notification-wrapper">
            <button 
              className="action-btn icon-only"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <img src={assets.notifiksi_icon} alt="Notifications" className="btn-icon" />
              <span className="notification-badge">3</span>
            </button>
          </div>
          <div className="user-profile">
            <div className="profile-btn" style={{ cursor: 'pointer' }} onClick={()=>navigate('/profile')}>
              <div className="user-avatar">
                <img 
                  src={assets.gojo}
                  alt="Admin"
                  className="user-avatar-img"
                />
              </div>
              <div className="user-info">
                <span className="user-name">Hi, {userName}</span>
              </div>
            </div>
          </div>
          <button type="button" className="action-btn" onClick={handleLogout}>Keluar</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
