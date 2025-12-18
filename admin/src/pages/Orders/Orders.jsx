import React, { useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showUserSummary, setShowUserSummary] = useState(false);
  const [userSummary, setUserSummary] = useState([]);
  const [summaryError, setSummaryError] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Status order dengan icon
  const orderStatuses = {
    pending: { label: 'Menunggu', icon: assets.menunggu_icon, color: '#f39c12' },
    processing: { label: 'Diproses', icon: assets.diprosees_icon, color: '#3498db' },
    shipped: { label: 'Dikirim', icon: assets.dikirim_icon, color: '#9b59b6' },
    delivered: { label: 'Selesai', icon: assets.check_icon, color: '#27ae60' },
    cancelled: { label: 'Dibatalkan', icon: assets.trash_icon, color: '#e74c3c' }
  };

  const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
  const envBase = import.meta.env.VITE_API_BASE;
  const fallbackBase = `http://${host}:5176`;
  const API_BASE = (() => {
    try {
      if (typeof envBase === 'string' && envBase.trim().length > 0) {
        const u = new URL(envBase);
        if (['5173','5174','5175','5177'].includes(u.port)) {
          return fallbackBase;
        }
        return envBase;
      }
      return fallbackBase;
    } catch {
      return fallbackBase;
    }
  })();
  const ORDERS_ENDPOINT = `${API_BASE}/api/orders.php`;

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch(`${ORDERS_ENDPOINT}?limit=200`);
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : null;
        if (!res.ok || !(data && data.ok)) {
          setOrders([]);
          setFilteredOrders([]);
          return;
        }
        const mapped = (data.data || []).map(o => ({
          id: o.order_code || `ORD-${o.id}`,
          _id: o.id,
          customerName: o.customer_name || '-',
          customerEmail: o.customer_email || '-',
          customerPhone: o.customer_phone || '-',
          orderDate: o.order_date || new Date().toISOString(),
          status: o.status || 'pending',
          total: Math.round(Number(o.total) || 0),
          items: [],
          shippingAddress: o.shipping_address || '-'
        }));
        setOrders(mapped);
        setFilteredOrders(mapped);
      } catch {
        setOrders([]);
        setFilteredOrders([]);
      }
    };
    loadOrders();
  }, [ORDERS_ENDPOINT]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!showUserSummary) return;
      try {
        setLoadingSummary(true);
        setSummaryError('');
        const res = await fetch(`${ORDERS_ENDPOINT}?group=by_user`);
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : null;
        if (!res.ok || !(data && data.ok)) {
          setSummaryError('Gagal memuat ringkasan user');
          setUserSummary([]);
          return;
        }
        const mapped = (data.data || []).map(u => ({
          name: u.customer_name,
          email: u.customer_email,
          orderCount: u.order_count,
          items: (u.items || []).map(it => ({ name: it.name, quantity: it.quantity }))
        }));
        setUserSummary(mapped);
      } catch {
        setSummaryError('Tidak bisa terhubung ke server');
        setUserSummary([]);
      } finally {
        setLoadingSummary(false);
      }
    };
    loadSummary();
  }, [showUserSummary, ORDERS_ENDPOINT]);

  // Filter orders berdasarkan search dan status
  useEffect(() => {
    let filtered = orders;

    // Filter berdasarkan search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, orders]);

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStatusChange = async (order, newStatus) => {
    const prevStatus = order.status;
    setOrders(prev => prev.map(o => (o._id === order._id ? { ...o, status: newStatus } : o)));
    setFilteredOrders(prev => prev.map(o => (o._id === order._id ? { ...o, status: newStatus } : o)));
    try {
      const res = await fetch(ORDERS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', id: order._id, status: newStatus })
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok || !(data && data.ok)) {
        throw new Error(data?.error || 'Gagal memperbarui status');
      }
    } catch {
      setOrders(prev => prev.map(o => (o._id === order._id ? { ...o, status: prevStatus } : o)));
      setFilteredOrders(prev => prev.map(o => (o._id === order._id ? { ...o, status: prevStatus } : o)));
      alert('Tidak bisa menyimpan status ke server');
    }
  };

  const handleViewDetail = async (order) => {
    try {
      const res = await fetch(`${ORDERS_ENDPOINT}?id=${encodeURIComponent(order._id)}`);
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (res.ok && data && data.ok && data.data) {
        const d = data.data;
        const items = (d.items || []).map(it => ({ name: it.name, quantity: it.quantity, price: Math.round(Number(it.price) || 0) }));
        const detailed = {
          id: d.order_code || order.id,
          _id: d.id,
          customerName: d.customer_name || order.customerName,
          customerEmail: d.customer_email || order.customerEmail,
          customerPhone: d.customer_phone || order.customerPhone,
          orderDate: d.order_date || order.orderDate,
          status: d.status || order.status,
          total: Math.round(Number(d.total) || Number(order.total) || 0),
          items,
          shippingAddress: d.shipping_address || order.shippingAddress
        };
        setSelectedOrder(detailed);
      } else {
        setSelectedOrder(order);
      }
    } catch {
      setSelectedOrder(order);
    }
    setShowOrderDetail(true);
  };


  const handleCloseDetail = () => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div className="header-content">
          <h1 className="page-title">
            <img src={assets.package_icon} alt="Orders" className="title-icon" />
            Manajemen Pesanan
          </h1>
          <p className="page-subtitle">Kelola dan pantau semua pesanan pelanggan</p>
        </div>
      </div>

      <div className="orders-content">
        {/* Filter dan Search */}
        <div className="orders-controls">
          <div className="search-section">
            <div className="search-input-wrapper">
              <img src={assets.search_icon} alt="Search" className="search-icon" />
              <input
                type="text"
                placeholder="Cari berdasarkan ID pesanan, nama, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-section">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="processing">Diproses</option>
              <option value="shipped">Dikirim</option>
              <option value="delivered">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          <div className="filter-section">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={showUserSummary} onChange={(e) => setShowUserSummary(e.target.checked)} />
              Gabungkan per Username
            </label>
          </div>
        </div>

        {/* Orders Table */}
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID Pesanan</th>
                <th>Pelanggan</th>
                <th>Email</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Total</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map(order => (
                <tr key={order.id} className="order-row">
                  <td className="order-id">{order.id}</td>
                  <td className="customer-info">
                    <div className="customer-name">{order.customerName}</div>
                  </td>
                  <td className="customer-email-col">
                    <div className="customer-email">{order.customerEmail}</div>
                  </td>
                  <td className="order-date">{formatDate(order.orderDate)}</td>
                  <td className="order-status">
                    <div className="status-wrapper">
                      <img 
                        src={orderStatuses[order.status].icon} 
                        alt={orderStatuses[order.status].label}
                        className="status-icon"
                      />
                      <span 
                        className="status-label"
                        style={{ color: orderStatuses[order.status].color }}
                      >
                        {orderStatuses[order.status].label}
                      </span>
                    </div>
                  </td>
                  <td className="order-total">{formatCurrency(order.total)}</td>
                  <td className="order-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewDetail(order)}
                      title="Lihat Detail"
                    >
                      <img src={assets.read_icon} alt="View" />
                    </button>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      className="status-select"
                      title="Ubah Status"
                    >
                      <option value="pending">Menunggu</option>
                      <option value="processing">Diproses</option>
                      <option value="shipped">Dikirim</option>
                      <option value="delivered">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="no-orders">
              <img src={assets.package_icon} alt="No Orders" className="no-orders-icon" />
              <p>Tidak ada pesanan yang ditemukan</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Sebelumnya
            </button>
            
            <div className="pagination-info">
              Halaman {currentPage} dari {totalPages}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {showUserSummary && (
        <div className="orders-content" style={{ marginTop: 20 }}>
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Jumlah Pesanan</th>
                  <th>Item Dibeli</th>
                </tr>
              </thead>
              <tbody>
                {loadingSummary && (
                  <tr><td colSpan="4">Memuat...</td></tr>
                )}
                {!loadingSummary && summaryError && (
                  <tr><td colSpan="4">{summaryError}</td></tr>
                )}
                {!loadingSummary && !summaryError && userSummary.map((u, idx) => (
                  <tr key={idx}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.orderCount}</td>
                    <td>{u.items.map(it => `${it.name} x${it.quantity}`).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Pesanan {selectedOrder.id}</h2>
              <button onClick={handleCloseDetail} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-detail-grid">
                <div className="detail-section">
                  <h3>Informasi Pelanggan</h3>
                  <div className="detail-item">
                    <strong>Nama:</strong> {selectedOrder.customerName}
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong> {selectedOrder.customerEmail}
                  </div>
                  <div className="detail-item">
                    <strong>Telepon:</strong> {selectedOrder.customerPhone}
                  </div>
                  <div className="detail-item">
                    <strong>Alamat:</strong> {selectedOrder.shippingAddress}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Informasi Pesanan</h3>
                  <div className="detail-item">
                    <strong>Tanggal:</strong> {formatDate(selectedOrder.orderDate)}
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <span 
                      className="status-badge"
                      style={{ color: orderStatuses[selectedOrder.status].color }}
                    >
                      {orderStatuses[selectedOrder.status].label}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Total:</strong> {formatCurrency(selectedOrder.total)}
                  </div>
                </div>
              </div>

              

              <div className="items-section">
                <h3>Item Pesanan</h3>
                <div className="items-list">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">Qty: {item.quantity}</span>
                      </div>
                      <div className="item-price">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
