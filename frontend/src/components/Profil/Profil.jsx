import React, { useState, useContext, useEffect } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { listOrders, getOrderById } from '../../services/orderService';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import './Profil.css';

const Profil = ({ isOpen, onClose }) => {
  const { user, updateUser, logout, products, fetchProducts } = useContext(StoreContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postalCode || ''
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Update formData when user data changes
  useEffect(() => {
    if (user) {
      console.log('Profil - User data updated:', user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
    console.log('Profile updated:', formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      postalCode: user?.postalCode || ''
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  useEffect(() => {
    const loadOrders = async () => {
      if (!isOpen) return;
      if (!products || products.length === 0) {
        try { await fetchProducts() } catch { /* noop */ }
      }
      const q = (user?.email && String(user.email).trim().length > 0)
        ? user.email
        : (user?.phone ? String(user.phone).replace(/[^0-9]/g,'') : null);
      if (!q) { setOrders([]); return; }
      try {
        setOrdersLoading(true);
        setOrdersError('');
        const res = await listOrders({ q, limit: 10 });
        let list = (res && res.ok && Array.isArray(res.data)) ? res.data : [];
        const detailed = [];
        for (const o of list) {
          try {
            const det = await getOrderById(o.id);
            if (det && det.ok) {
              const items = det.data.items || [];
              detailed.push({
                ...o,
                items: items.map(it => ({ product_id: it.product_id, name: it.product_name, quantity: it.quantity })),
                itemCount: items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
              });
            } else {
              detailed.push({ ...o, items: [], itemCount: 0 });
            }
          } catch {
            detailed.push({ ...o, items: [], itemCount: 0 });
          }
        }
        setOrders(detailed);
      } catch {
        setOrdersError('Gagal memuat pesanan');
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    loadOrders();
  }, [isOpen, user, products, fetchProducts]);

  if (!isOpen) return null;

  return (
    <div className="profil-overlay" onClick={onClose}>
      <div className="profil-content" onClick={(e) => e.stopPropagation()}>
        <div className="profil-header">
          <button className="profil-close" onClick={onClose}>
            ×
          </button>
          <h2>Profil Saya</h2>
          <p>Kelola informasi profil Anda</p>
        </div>

        <div className="profil-body">
          {/* Profile Avatar Section */}
          <div className="profil-avatar-section">
            <div className="profil-avatar">
              {getInitials(formData.name)}
            </div>
            <div className="profil-name">{formData.name || 'Nama Pengguna'}</div>
            <div className="profil-email">{formData.email || 'email@example.com'}</div>
          </div>

          {isEditing && (
            <div className="edit-mode-indicator">
              Mode Edit Aktif
            </div>
          )}

          {/* Profile Form */}
          <form>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nama Lengkap</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Nomor Telepon</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">Kota</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Masukkan kota"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Alamat</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Masukkan alamat lengkap"
              />
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">Kode Pos</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Masukkan kode pos"
              />
            </div>
          </form>

          {/* Action Buttons */}
          <div className="action-buttons">
            {!isEditing ? (
              <>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profil
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                >
                  Simpan
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                >
                  Batal
                </button>
              </>
            )}
          </div>

          {/* My Orders */}
          <div className="orders-section">
            <h3 className="orders-title">Pesanan Saya</h3>
            {ordersLoading && (
              <div className="orders-loading">Memuat pesanan...</div>
            )}
            {ordersError && (
              <div className="orders-error">{ordersError}</div>
            )}
            {!ordersLoading && orders.length === 0 && (
              <div className="orders-empty">Belum ada pesanan.</div>
            )}
            {!ordersLoading && orders.length > 0 && (
              <div className="orders-list">
                {orders.map(o => {
                  const itemsText = (o.items || []).map(it => `${it.name} x ${it.quantity}`).join(', ');
                  const statusColor = o.status === 'delivered' ? '#27ae60'
                    : o.status === 'shipped' ? '#9b59b6'
                    : o.status === 'processing' ? '#3498db'
                    : o.status === 'cancelled' ? '#e74c3c'
                    : '#f39c12';
                  return (
                    <div key={o.id} className="order-row">
                      <div className="order-left">
                        {(() => {
                          const first = (o.items || [])[0];
                          const match = first ? (
                            (products || []).find(p => String(p._id) === String(first.product_id)) ||
                            (products || []).find(p => String(p.name).toLowerCase() === String(first.name || '').toLowerCase())
                          ) : null;
                          const img = match?.image || assets.bag_icon;
                          return <img src={img} alt={first?.name || 'Order'} className="order-photo" />
                        })()}
                        <div className="order-info">
                          <div className="order-items">{itemsText || 'Tanpa item'}</div>
                        </div>
                      </div>
                      <div className="order-right">
                        <div className="order-total">Rp {Number(o.total)}.000</div>
                        <div className="order-count">Items: {o.itemCount || 0}</div>
                        <div className="order-status"><span className="dot" style={{ backgroundColor: statusColor }}></span>{String(o.status || 'pending')}</div>
                        <button className="track-btn" onClick={() => navigate(`/order-confirmation/${o.id}`)}>Lacak Pesanan</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;
