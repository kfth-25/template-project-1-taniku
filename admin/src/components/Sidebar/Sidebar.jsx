import React from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../../assets/assets';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      path: '/dashboard',
      icon: assets.home_icon,
      description: 'Overview & Analytics'
    },
    {
      id: 'products',
      title: 'Products',
      path: '/products',
      icon: assets.bag_icon,
      description: 'Manage Inventory'
    },
    {
      id: 'add-product',
      title: 'Add Product',
      path: '/add-product',
      icon: assets.lists_icon,
      description: 'Create New Item'
    },
    {
      id: 'orders',
      title: 'Orders',
      path: '/orders',
      icon: assets.stats_icon,
      description: 'Sales Management'
    },
    {
      id: 'shipping',
      title: 'Logistik',
      path: '/logistik',
      icon: assets.dikirim_icon,
      description: 'Logistics & Tracking'
    },

    {
      id: 'tracking',
      title: 'Tracking',
      path: '/tracking',
      icon: assets.maps_icon,
      description: 'Location Tracking'
    },
    {
      id: 'promotions',
      title: 'Promotions',
      path: '/promotions',
      icon: assets.discount_icon,
      description: 'Discounts & Offers'
    },
    {
      id: 'messages',
      title: 'Messages',
      path: '/messages',
      icon: assets.chat_icon,
      description: 'Customer Support'
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <img src={assets.logo} alt="Logo" className="brand-logo-img" />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-title">Main Menu</h3>
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''} ${item.id}`
                  }
                >
                  <div className="nav-icon">
                    <img src={item.icon} alt={item.title} />
                  </div>
                  <div className="nav-content">
                    <span className="nav-label">{item.title}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            👤
          </div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Administrator</span>
          </div>
          <div className="user-status">
            <div className="status-indicator online"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
