import React, { useContext, useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { assets } from '../assets/assets';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import Login from './Login/Login';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getWishlistCount, getCartCount, getUnreadNotificationCount, user, isLoggedIn, logout, searchQuery, setSearchQuery, products, productsLoading, fetchProducts } = useContext(StoreContext);
  const navigate = useNavigate();
  const navbarRef = useRef(null);

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  useEffect(() => {
    if (!products || products.length === 0) {
      fetchProducts();
    }
  }, [products, fetchProducts]);

  const filteredSuggestions = (searchQuery || '').trim().length === 0
    ? []
    : (() => {
        const q = (searchQuery || '').toLowerCase();
        const filtered = (products || []).filter(p => (
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        ));
        const sorted = [...filtered].sort((a, b) => {
          const tb = new Date(b.createdAt || b.created_at || 0).getTime();
          const ta = new Date(a.createdAt || a.created_at || 0).getTime();
          if (tb !== ta) return tb - ta;
          return parseInt(b._id) - parseInt(a._id);
        });
        return sorted.slice(0, 8);
      })();

  const handleSelectSuggestion = (product) => {
    //Gunakan mousedown untuk menghindari blur menutup sebelum klik
    navigate(`/product/${product._id}`);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = () => {
    const q = (searchQuery || '').trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Handle click outside and window resize to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className='navbar' ref={navbarRef}>
      <Link to='/' className='navbar-logo'>
           <img src={assets.logo} alt="Taniku Logo" style={{width: '110px', height: '60px'}} />
      </Link>
      
      {/* Modern Mobile Menu Button */}
      <button 
        className={`nav-toggle ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.target.blur();
          setIsMobileMenuOpen(!isMobileMenuOpen);
        }}
        aria-label="Toggle menu"
      >
        <img 
          src={isMobileMenuOpen ? assets.cross_icon : assets.bar_icon} 
          alt={isMobileMenuOpen ? "Close menu" : "Open menu"}
          className="nav-toggle-icon"
        />
      </button>
      
      <ul className={`navbar-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to='/' onClick={(e) => {e.stopPropagation(); e.target.blur(); setMenu("home"); setIsMobileMenuOpen(false);}} className={menu === "home" ? "active" : ""}>Home</Link>
        <Link to='/promo' onClick={(e) => {e.stopPropagation(); e.target.blur(); setMenu("promo"); setIsMobileMenuOpen(false);}} className={menu === "promo" ? "active" : ""}>Promo</Link>
        <Link to='/kontak' onClick={(e) => {e.stopPropagation(); e.target.blur(); setMenu("contact-us"); setIsMobileMenuOpen(false);}} className={menu === "contact-us" ? "active" : ""}>Kontak</Link>
        <a href='#app-download' onClick={(e) => {e.stopPropagation(); e.target.blur(); setMenu("mobile-app"); setIsMobileMenuOpen(false);}} className={menu === "mobile-app" ? "active" : ""}>Mobile</a>
      </ul>
      
      <div className="navbar-right">
        <div className="navbar-search-container" onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}>
          <button type="button" className="navbar-search-btn" onClick={handleSearchSubmit} aria-label="Cari">
            <img src={assets.search_icon} alt="Search" className="navbar-search-icon" />
          </button>
          <input 
            type="text" 
            placeholder="Cari produk..." 
            className="navbar-search-input"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-label="Kolom pencarian"
          />

          {showSuggestions && (searchQuery || '').trim() !== '' && (
            <div className="search-suggestions">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((item) => (
                  <div
                    key={item._id}
                    className="suggestion-item"
                    onMouseDown={() => handleSelectSuggestion(item)}
                  >
                    <img src={item.image} alt={item.name} className="suggestion-thumb" />
                    <div className="suggestion-text">
                      <span className="suggestion-name">{item.name}</span>
                      <span className="suggestion-cat">{item.category}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="suggestion-empty">Tidak ada hasil</div>
              )}
              {filteredSuggestions.length > 0 && (
                <button className="view-all-results" onMouseDown={handleSearchSubmit}>Lihat semua hasil</button>
              )}
            </div>
          )}
        </div>
        
        <Link to="/cart" className="navbar-basket-icon">
          <img src={assets.basket_icon} alt="Cart" />
          {getCartCount() > 0 && (
            <div className="cart-count">{getCartCount()}</div>
          )}
        </Link>
        
        <Link to="/wishlist" className="navbar-basket-icon">
          <img src={assets.wishlist} alt="Wishlist" />
          {getWishlistCount() > 0 && (
            <div className="wishlist-count">{getWishlistCount()}</div>
          )}
        </Link>
        
        <Link to="/notifications" className="navbar-basket-icon navbar-notification-icon">
          <img src={assets.notifiksi_icon} alt="Notifications" />
          {getUnreadNotificationCount() > 0 && (
            <div className="notification-count">{getUnreadNotificationCount()}</div>
          )}
        </Link>
        
        {!isLoggedIn ? (
          <button onClick={() => setShowLogin(true)} className="navbar-login-btn">Masuk</button>
        ) : (
          <div className="navbar-profile">
            <button 
              className="profile-btn"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <a 
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileDropdown(false);
                  }}
                  style={{cursor: 'pointer'}}
                >
                  Edit Profil
                </a>
                <button onClick={handleLogout}>
                  Keluar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar
