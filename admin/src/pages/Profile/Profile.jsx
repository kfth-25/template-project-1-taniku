import React from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('adminUser') || 'null'); } catch { return null; } })();
  const handleLogout = () => {
    try {
      localStorage.removeItem('adminUser');
      window.dispatchEvent(new Event('auth-changed'));
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <img src={assets.profil_icon} alt="Avatar" className="profile-avatar" />
          <div>
            <h3>{user?.username || 'Admin'}</h3>
            <p>Administrator</p>
          </div>
        </div>
        <div className="profile-actions">
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>Keluar</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
