import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './Notifications.css';
import { assets } from '../../assets/assets';

const Notifications = () => {
  const [filter, setFilter] = useState('all'); // all, unread, read, messages
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification,
    getUnreadNotificationCount 
  } = useContext(StoreContext);

  const navigate = useNavigate();
  // No need for sample data or useEffect since we're using context

  const filteredNotifications = notifications.filter(notif => {
        if (filter === 'unread') return !notif.isRead;
        if (filter === 'read') return notif.isRead;
        if (filter === 'messages') return notif.type === 'message';
        return true;
    });

    const unreadCount = getUnreadNotificationCount();

  const getTypeColor = (type) => {
    switch (type) {
      case 'order': return '#2E7D32';
      case 'promo': return '#FF6B35';
      case 'delivery': return '#1976D2';
      case 'system': return '#7B1FA2';
      case 'message': return '#1565C0';
      default: return '#666';
    }
  };

  const openNotificationDetail = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Notifikasi</h1>
          </div>
          <div className="notifications-loading">
            <div className="loading-spinner"></div>
            <p>Memuat notifikasi...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-sidebar">
          <div className="sidebar-header">
            <h3>Akun Petani</h3>
          </div>
          <ul className="sidebar-menu">
            <li>
              <a href="#" className="active">
                <span className="icon"><img src={assets.notifiksi_icon} alt="Notifikasi" /></span>
                Notifikasi
              </a>
            </li>
            <li>
              <a href="#">
                <span className="icon"><img src={assets.profile_icon} alt="Profil" /></span>
                Profil Petani
              </a>
            </li>
            <li>
              <a href="#">
                <span className="icon"><img src={assets.package_icon} alt="Pesanan" /></span>
                Pesanan Saya
              </a>
            </li>
            <li>
              <a href="#">
                <span className="icon"><img src={assets.voucher} alt="Voucher" /></span>
                Voucher Pertanian
              </a>
            </li>
            <li>
              <a href="#">
                <span className="icon"><img src={assets.rating_starts} alt="Poin" /></span>
                Poin Taniku
              </a>
            </li>
            <li>
              <a href="#">
                <span className="icon"><img src={assets.rating_starts} alt="Ulasan" /></span>
                Ulasan Produk
              </a>
            </li>
          </ul>
        </div>
        
        <div className="notifications-main">
          <div className="notifications-header">
            <div className="header-content">
              <div className="header-title">
                <h1>Notifikasi</h1>
                <p>Kelola semua pesan dan pemberitahuan Anda</p>
              </div>
              <div className="notifications-stats">
                {unreadCount > 0 && (
                  <div className="unread-badge">
                    <span className="badge-number">{unreadCount}</span>
                    <span className="badge-text">belum dibaca</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        <div className="notifications-controls">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Semua <span className="count">({notifications.length})</span>
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Belum Dibaca <span className="count">({unreadCount})</span>
            </button>
            <button 
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Sudah Dibaca <span className="count">({notifications.length - unreadCount})</span>
            </button>
            <button 
              className={`filter-btn ${filter === 'messages' ? 'active' : ''}`}
              onClick={() => setFilter('messages')}
            >
              Pesan <span className="count">({notifications.filter(n => n.type === 'message').length})</span>
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button className="mark-all-read" onClick={markAllNotificationsAsRead}>
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-icon">
                {filter === 'unread' ? '✓' : '📄'}
              </div>
              <h3>
                {filter === 'unread' 
                  ? 'Semua notifikasi sudah dibaca' 
                  : 'Tidak ada notifikasi'
                }
              </h3>
              <p>
                {filter === 'unread' 
                  ? 'Anda sudah membaca semua notifikasi yang tersedia.' 
                  : 'Belum ada notifikasi untuk ditampilkan. Notifikasi baru akan muncul di sini.'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                data-type={notification.type}
                onClick={() => {
                  if (notification.type === 'message' || notification.type === 'welcome') {
                    navigate(`/messages/${notification.id}`);
                  } else {
                    openNotificationDetail(notification);
                  }
                }}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="notification-icon">
                  {notification.type === 'promo' ? 'PROMO' : 
                   notification.type === 'voucher' ? 'VOUCHER' : 
                   notification.type === 'order' ? 'T' : 
                   notification.type === 'delivery' ? 'T' : 
                   notification.type === 'system' ? 'T' : 'T'}
                </div>
                
                <div className="notification-content">
                  <div className="notification-sender">{notification.sender || 'Taniku'}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{notification.time}</div>
                </div>

              </div>
            ))
          )}
        </div>

        {filteredNotifications.length > 0 && (
          <div className="notifications-footer">
            <p>Menampilkan {filteredNotifications.length} dari {notifications.length} notifikasi</p>
          </div>
        )}
        </div>
      </div>

      {/* Modal Detail Notifikasi */}
      {showDetailModal && selectedNotification && (
        <div className="notification-modal-overlay" onClick={closeDetailModal}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-modal-title">
                <div className="notification-icon-large" style={{ backgroundColor: getTypeColor(selectedNotification.type) }}>
                  <span className="notification-emoji-large">
                    {selectedNotification.type === 'order' ? '📦' : 
                     selectedNotification.type === 'promo' ? '🏷️' : 
                     selectedNotification.type === 'delivery' ? '🚚' : 
                     selectedNotification.type === 'message' ? '💬' : '🔔'}
                  </span>
                </div>
                <div className="notification-title-text">
                  <h2>{selectedNotification.title}</h2>
                  <div className="notification-type-badge">
                    {selectedNotification.type === 'order' ? '📦 Pesanan' : 
                     selectedNotification.type === 'promo' ? '🏷️ Promosi' : 
                     selectedNotification.type === 'delivery' ? '🚚 Pengiriman' : 
                     selectedNotification.type === 'message' ? '💬 Pesan' : '🔔 Notifikasi'}
                  </div>
                  {selectedNotification.sender && (
                    <p className="notification-sender">Dari: {selectedNotification.sender}</p>
                  )}
                </div>
              </div>
              <button className="close-modal-btn" onClick={closeDetailModal}>
                <span>✕</span>
              </button>
            </div>
            
            <div className="notification-modal-body">
              <div className="notification-timestamp">
                <span>📅 {formatTimestamp(selectedNotification.timestamp)}</span>
              </div>
              <div className="notification-content-full">
                <p>{selectedNotification.message}</p>
              </div>
            </div>
            
            <div className="notification-modal-footer">
              {selectedNotification.type === 'message' && (
                <button 
                  className="reply-btn"
                  onClick={() => {
                    alert('Fitur balas pesan akan segera tersedia');
                  }}
                >
                  💬 Balas Pesan
                </button>
              )}
              <button 
                className="mark-read-btn"
                onClick={() => {
                  if (!selectedNotification.isRead) {
                    markNotificationAsRead(selectedNotification.id);
                  }
                  closeDetailModal();
                }}
              >
                ✅ Tandai Dibaca
              </button>
              <button 
                className="delete-notification-btn"
                onClick={() => {
                  deleteNotification(selectedNotification.id);
                  closeDetailModal();
                }}
              >
                🗑️ Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
