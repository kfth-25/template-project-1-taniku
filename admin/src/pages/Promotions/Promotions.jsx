import React, { useState, useEffect } from 'react';
import './Promotions.css';
import { assets } from '../../assets/assets';

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const promotionsPerPage = 12;

  // Form state for creating/editing promotions
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    code: '',
    status: 'active',
    applicableProducts: 'all'
  });

  // Mock data - replace with API call
  useEffect(() => {
    const mockPromotions = [
      {
        id: 'PROMO-001',
        name: ' Flash Sale Pupuk Organik',
        description: 'Diskon besar-besaran untuk semua pupuk organik selama weekend ini!',
        type: 'percentage',
        value: 25,
        minPurchase: 100000,
        maxDiscount: 50000,
        code: 'ORGANIK25',
        startDate: '2024-01-20T00:00:00Z',
        endDate: '2024-01-22T23:59:59Z',
        usageLimit: 100,
        usedCount: 23,
        status: 'active',
        applicableProducts: 'category',
        category: 'Pupuk Organik',
        createdDate: '2024-01-15T10:00:00Z',
        totalSavings: 1150000
      },
      {
        id: 'PROMO-002',
        name: 'Cashback Pembelian Pestisida',
        description: 'Dapatkan cashback 15% untuk pembelian pestisida minimal 200rb',
        type: 'cashback',
        value: 15,
        minPurchase: 200000,
        maxDiscount: 30000,
        code: 'PESTISIDA15',
        startDate: '2024-01-18T00:00:00Z',
        endDate: '2024-01-25T23:59:59Z',
        usageLimit: 50,
        usedCount: 12,
        status: 'active',
        applicableProducts: 'category',
        category: 'Pestisida',
        createdDate: '2024-01-10T14:30:00Z',
        totalSavings: 360000
      },
      {
        id: 'PROMO-003',
        name: 'Gratis Ongkir Jakarta',
        description: 'Gratis ongkos kirim untuk wilayah Jakarta dengan minimal pembelian 150rb',
        type: 'free_shipping',
        value: 0,
        minPurchase: 150000,
        maxDiscount: 25000,
        code: 'GRATISONGKIR',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        usageLimit: 200,
        usedCount: 87,
        status: 'active',
        applicableProducts: 'all',
        category: 'Semua Produk',
        createdDate: '2023-12-28T09:00:00Z',
        totalSavings: 2175000
      },
      {
        id: 'PROMO-004',
        name: ' Diskon Khusus Member VIP',
        description: 'Diskon eksklusif 30% untuk member VIP pada produk pilihan',
        type: 'percentage',
        value: 30,
        minPurchase: 300000,
        maxDiscount: 100000,
        code: 'VIP30',
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-02-15T23:59:59Z',
        usageLimit: 30,
        usedCount: 8,
        status: 'active',
        applicableProducts: 'selected',
        category: 'Produk Pilihan',
        createdDate: '2024-01-12T16:45:00Z',
        totalSavings: 800000
      },
      {
        id: 'PROMO-005',
        name: '📅 Promo Akhir Tahun',
        description: 'Mega sale akhir tahun dengan diskon hingga 40%',
        type: 'percentage',
        value: 40,
        minPurchase: 500000,
        maxDiscount: 200000,
        code: 'NEWYEAR40',
        startDate: '2023-12-25T00:00:00Z',
        endDate: '2024-01-05T23:59:59Z',
        usageLimit: 500,
        usedCount: 456,
        status: 'expired',
        applicableProducts: 'all',
        category: 'Semua Produk',
        createdDate: '2023-12-20T11:20:00Z',
        totalSavings: 9120000
      },
      {
        id: 'PROMO-006',
        name: '🌱 Promo Musim Tanam',
        description: 'Diskon spesial untuk persiapan musim tanam baru',
        type: 'fixed',
        value: 50000,
        minPurchase: 250000,
        maxDiscount: 50000,
        code: 'TANAM50K',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-02-29T23:59:59Z',
        usageLimit: 75,
        usedCount: 0,
        status: 'scheduled',
        applicableProducts: 'category',
        category: 'Bibit & Benih',
        createdDate: '2024-01-20T13:15:00Z',
        totalSavings: 0
      }
    ];

    setTimeout(() => {
      setPromotions(mockPromotions);
      setLoading(false);
    }, 1000);
  }, []);

  // Utility functions
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
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Aktif', class: 'success', icon: assets.check_icon },
      scheduled: { label: 'Terjadwal', class: 'info', icon: assets.calender_icon },
      expired: { label: 'Berakhir', class: 'error', icon: assets.trash_icon },
      paused: { label: 'Dijeda', class: 'warning', icon: assets.menunggu_icon },
      draft: { label: 'Draft', class: 'default', icon: assets.edit_icon }
    };
    const config = statusConfig[status] || { label: status, class: 'default', icon: assets.notifiksi_icon };
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon"><img src={config.icon} alt={config.label} /></span>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      percentage: { label: 'Persentase', class: 'primary', icon: assets.discount_icon },
      fixed: { label: 'Nominal', class: 'secondary', icon: assets.wallet_icon },
      cashback: { label: 'Cashback', class: 'success', icon: assets.chasback_icon },
      free_shipping: { label: 'Gratis Ongkir', class: 'info', icon: assets.dikirim_icon }
    };
    const config = typeConfig[type] || { label: type, class: 'default', icon: assets.bag_icon };
    return (
      <span className={`type-badge ${config.class}`}>
        <span className="type-icon"><img src={config.icon} alt={config.label} /></span>
        {config.label}
      </span>
    );
  };

  const getDiscountDisplay = (promotion) => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}%`;
      case 'fixed':
        return formatCurrency(promotion.value);
      case 'cashback':
        return `${promotion.value}% Cashback`;
      case 'free_shipping':
        return 'Gratis Ongkir';
      default:
        return promotion.value;
    }
  };

  

  const getUsagePercentage = (promotion) => {
    return promotion.usageLimit > 0 ? (promotion.usedCount / promotion.usageLimit) * 100 : 0;
  };

  // Ikon promosi berbasis tipe dan pembersih nama dari emoji
  const getPromotionIcon = (promotion) => {
    try {
      const name = (promotion?.name || '').toLowerCase();
      const category = (promotion?.category || '').toLowerCase();
      if (name.includes('tanam') || category.includes('bibit') || category.includes('benih')) {
        return assets.tanaman_icon;
      }
      if (name.includes('spesial') || name.includes('special')) {
        return assets.spesial_icon;
      }
      // Gunakan ikon spesial untuk promo Flash Sale
      if (name.includes('flash sale') || (name.includes('flash') && name.includes('sale')) || name.includes('flashsale')) {
        return assets.spesial_icon;
      }
      // Khusus promo "Akhir Tahun" gunakan ikon kalender
      if (name.includes('akhir tahun') || name.includes('tahun baru') || name.includes('new year')) {
        return assets.calender_icon;
      }
      switch (promotion?.type) {
        case 'percentage':
        case 'fixed':
          return assets.discount_icon;
        case 'cashback':
          return assets.chasback_icon;
        case 'free_shipping':
          return assets.dikirim_icon;
        default:
          return assets.bag_icon;
      }
    } catch {
      return assets.bag_icon;
    }
  };

  const getCleanName = (name) => {
    try {
      // Hapus emoji di awal judul jika ada
      return name.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+\s*/u, '');
    } catch {
      return name;
    }
  };

  // Filter and sort promotions
  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = 
      promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || promotion.status === filterStatus;
    const matchesType = filterType === 'all' || promotion.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedPromotions = [...filteredPromotions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdDate) - new Date(a.createdDate);
      case 'oldest':
        return new Date(a.createdDate) - new Date(b.createdDate);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'usage':
        return getUsagePercentage(b) - getUsagePercentage(a);
      case 'savings':
        return b.totalSavings - a.totalSavings;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedPromotions.length / promotionsPerPage);
  const startIndex = (currentPage - 1) * promotionsPerPage;
  const currentPromotions = sortedPromotions.slice(startIndex, startIndex + promotionsPerPage);

  // Modal functions
  const showPromotionDetail = (promotion) => {
    setSelectedPromotion(promotion);
    setShowDetailModal(true);
  };

  const handleCreatePromotion = () => {
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minPurchase: '',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      code: '',
      status: 'active',
      applicableProducts: 'all'
    });
    setShowCreateModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your API
    console.log('Creating promotion:', formData);
    setShowCreateModal(false);
    // Add success notification here
  };

  const updatePromotionStatus = (id, newStatus) => {
    setPromotions(prev => prev.map(promotion => 
      promotion.id === id ? { ...promotion, status: newStatus } : promotion
    ));
  };

  if (loading) {
    return (
      <div className="promotions">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Memuat data promosi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="promotions">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <img src={assets.discount_icon} alt="Manajemen Promosi" className="title-icon" />
            Manajemen Promosi
          </h1>
          <p>Kelola diskon, cashback, dan penawaran khusus untuk pelanggan</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <img src={assets.stats_icon} alt="Laporan" className="btn-icon" />
            Laporan Promosi
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleCreatePromotion}
          >
            <img src={assets.add_icon_white} alt="Buat" className="btn-icon" />
            Buat Promosi
          </button>
        </div>
      </div>

      {/* Promotion Statistics */}
      <div className="stats-grid">
        <div className="stat-card active">
          <div className="stat-icon"><img src={assets.check_icon} alt="Aktif" className="action-icon" /></div>
          <div className="stat-content">
            <div className="stat-number">{promotions.filter(p => p.status === 'active').length}</div>
            <div className="stat-label">Promosi Aktif</div>
          </div>
        </div>
        <div className="stat-card scheduled">
          <div className="stat-icon"><img src={assets.calender_icon} alt="Terjadwal" className="action-icon" /></div>
          <div className="stat-content">
            <div className="stat-number">{promotions.filter(p => p.status === 'scheduled').length}</div>
            <div className="stat-label">Terjadwal</div>
          </div>
        </div>
        <div className="stat-card usage">
          <div className="stat-icon"><img src={assets.stats_icon} alt="Penggunaan" className="action-icon" /></div>
          <div className="stat-content">
            <div className="stat-number">{promotions.reduce((sum, p) => sum + p.usedCount, 0)}</div>
            <div className="stat-label">Total Penggunaan</div>
          </div>
        </div>
        <div className="stat-card savings">
          <div className="stat-icon"><img src={assets.wallet_icon} alt="Penghematan" className="action-icon" /></div>
          <div className="stat-content">
            <div className="stat-number">{formatCurrency(promotions.reduce((sum, p) => sum + p.totalSavings, 0))}</div>
            <div className="stat-label">Total Penghematan</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="promotions-controls">
        <div className="controls-left">
          <div className="search-box">
            <img src={assets.search_icon} alt="Cari" className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama promosi, kode, atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="controls-right">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="scheduled">Terjadwal</option>
            <option value="expired">Berakhir</option>
            <option value="paused">Dijeda</option>
            <option value="draft">Draft</option>
          </select>

          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Semua Tipe</option>
            <option value="percentage">Persentase</option>
            <option value="fixed">Nominal</option>
            <option value="cashback">Cashback</option>
            <option value="free_shipping">Gratis Ongkir</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name">Nama A-Z</option>
            <option value="usage">Penggunaan Tertinggi</option>
            <option value="savings">Penghematan Terbesar</option>
          </select>

          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Promotions Display */}
      {viewMode === 'grid' ? (
        <div className="promotions-grid">
          {currentPromotions.map(promotion => (
            <div key={promotion.id} className={`promotion-card ${promotion.status}`}>
              <div className="card-header">
                <div className="promotion-badges">
                  {getStatusBadge(promotion.status)}
                  {getTypeBadge(promotion.type)}
                </div>
                <div className="promotion-actions">
                  <button 
                    className="btn-action"
                    onClick={() => showPromotionDetail(promotion)}
                    title="Lihat Detail"
                  >
                    <img src={assets.read_icon} alt="Lihat" className="action-icon" />
                  </button>
                </div>
              </div>
              
              <div className="card-content">
                <h3 className="promotion-name">
                  <img 
                    src={getPromotionIcon(promotion)} 
                    alt="" 
                    className="title-icon"
                    onError={(e) => { e.currentTarget.src = assets.discount_icon; }}
                  />
                  {getCleanName(promotion.name)}
                </h3>
                <p className="promotion-description">{promotion.description}</p>
                
                <div className="promotion-details">
                  <div className="detail-item">
                    <span className="detail-label">Diskon:</span>
                    <span className="detail-value discount-value">
                      {getDiscountDisplay(promotion)}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Kode:</span>
                    <span className="detail-value promo-code">{promotion.code}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Min. Pembelian:</span>
                    <span className="detail-value">{formatCurrency(promotion.minPurchase)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Berlaku:</span>
                    <span className="detail-value">
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </span>
                  </div>
                </div>
                
                <div className="usage-section">
                  <div className="usage-header">
                    <span>Penggunaan: {promotion.usedCount}/{promotion.usageLimit || '∞'}</span>
                    <span className="usage-percentage">
                      {promotion.usageLimit > 0 ? `${Math.round(getUsagePercentage(promotion))}%` : ''}
                    </span>
                  </div>
                  {promotion.usageLimit > 0 && (
                    <div className="usage-bar">
                      <div 
                        className="usage-fill"
                        style={{ width: `${getUsagePercentage(promotion)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                <div className="savings-info">
                  <span className="savings-label">Total Penghematan:</span>
                  <span className="savings-amount">{formatCurrency(promotion.totalSavings)}</span>
                </div>
              </div>
              
              <div className="card-footer">
                <select 
                  value={promotion.status}
                  onChange={(e) => updatePromotionStatus(promotion.id, e.target.value)}
                  className="status-select"
                >
                  <option value="active">Aktif</option>
                  <option value="paused">Dijeda</option>
                  <option value="expired">Berakhir</option>
                  <option value="draft">Draft</option>
                </select>
                <button className="btn btn-secondary btn-sm">
                  <img src={assets.edit_icon} alt="Edit" className="btn-icon" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="promotions-list">
          <div className="list-header">
            <div className="col-name">Nama Promosi</div>
            <div className="col-type">Tipe</div>
            <div className="col-discount">Diskon</div>
            <div className="col-code">Kode</div>
            <div className="col-period">Periode</div>
            <div className="col-usage">Penggunaan</div>
            <div className="col-status">Status</div>
            <div className="col-actions">Aksi</div>
          </div>
          
          {currentPromotions.map(promotion => (
            <div key={promotion.id} className={`list-item ${promotion.status}`}>
              <div className="col-name">
                <div className="promotion-info">
                  <h4>
                    <img 
                      src={getPromotionIcon(promotion)} 
                      alt="" 
                      className="title-icon"
                      onError={(e) => { e.currentTarget.src = assets.discount_icon; }}
                    />
                    {getCleanName(promotion.name)}
                  </h4>
                  <p>{promotion.description}</p>
                </div>
              </div>
              <div className="col-type">{getTypeBadge(promotion.type)}</div>
              <div className="col-discount">
                <span className="discount-value">{getDiscountDisplay(promotion)}</span>
              </div>
              <div className="col-code">
                <span className="promo-code">{promotion.code}</span>
              </div>
              <div className="col-period">
                <div className="period-info">
                  <div>{formatDate(promotion.startDate)}</div>
                  <div>{formatDate(promotion.endDate)}</div>
                </div>
              </div>
              <div className="col-usage">
                <div className="usage-info">
                  <span>{promotion.usedCount}/{promotion.usageLimit || '∞'}</span>
                  {promotion.usageLimit > 0 && (
                    <div className="usage-bar-small">
                      <div 
                        className="usage-fill"
                        style={{ width: `${getUsagePercentage(promotion)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-status">{getStatusBadge(promotion.status)}</div>
              <div className="col-actions">
                <button 
                  className="btn-action"
                  onClick={() => showPromotionDetail(promotion)}
                  title="Lihat Detail"
                >
                  <img src={assets.read_icon} alt="Lihat" className="action-icon" />
                </button>
                <button className="btn-action" title="Edit">
                  <img src={assets.edit_icon} alt="Edit" className="action-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Sebelumnya
          </button>
          
          <div className="pagination-info">
            Halaman {currentPage} dari {totalPages}
          </div>
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Selanjutnya →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPromotion && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <img src={assets.read_icon} alt="Detail" className="title-icon" />
                Detail Promosi
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                {/* Basic Information */}
                <div className="detail-section">
                  <h4>
                    <img src={assets.read_icon} alt="Info" className="title-icon" />
                    Informasi Dasar
                  </h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>ID Promosi:</label>
                      <span>{selectedPromotion.id}</span>
                    </div>
                    <div className="info-item">
                      <label>Nama:</label>
                      <span>{selectedPromotion.name}</span>
                    </div>
                    <div className="info-item full-width">
                      <label>Deskripsi:</label>
                      <span>{selectedPromotion.description}</span>
                    </div>
                    <div className="info-item">
                      <label>Kode Promosi:</label>
                      <span className="promo-code">{selectedPromotion.code}</span>
                    </div>
                    <div className="info-item">
                      <label>Status:</label>
                      <span>{getStatusBadge(selectedPromotion.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Discount Details */}
                <div className="detail-section">
                  <h4>
                    <img src={assets.discount_icon} alt="Diskon" className="title-icon" />
                    Detail Diskon
                  </h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Tipe Diskon:</label>
                      <span>{getTypeBadge(selectedPromotion.type)}</span>
                    </div>
                    <div className="info-item">
                      <label>Nilai Diskon:</label>
                      <span className="discount-value">{getDiscountDisplay(selectedPromotion)}</span>
                    </div>
                    <div className="info-item">
                      <label>Min. Pembelian:</label>
                      <span>{formatCurrency(selectedPromotion.minPurchase)}</span>
                    </div>
                    <div className="info-item">
                      <label>Maks. Diskon:</label>
                      <span>{formatCurrency(selectedPromotion.maxDiscount)}</span>
                    </div>
                    <div className="info-item">
                      <label>Produk Berlaku:</label>
                      <span>{selectedPromotion.category}</span>
                    </div>
                  </div>
                </div>

                {/* Period & Usage */}
                <div className="detail-section">
                  <h4>
                    <img src={assets.lists_icon} alt="Periode" className="title-icon" />
                    Periode & Penggunaan
                  </h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Tanggal Mulai:</label>
                      <span>{formatDateTime(selectedPromotion.startDate)}</span>
                    </div>
                    <div className="info-item">
                      <label>Tanggal Berakhir:</label>
                      <span>{formatDateTime(selectedPromotion.endDate)}</span>
                    </div>
                    <div className="info-item">
                      <label>Batas Penggunaan:</label>
                      <span>{selectedPromotion.usageLimit || 'Tidak Terbatas'}</span>
                    </div>
                    <div className="info-item">
                      <label>Sudah Digunakan:</label>
                      <span>{selectedPromotion.usedCount} kali</span>
                    </div>
                    <div className="info-item">
                      <label>Sisa Kuota:</label>
                      <span>
                        {selectedPromotion.usageLimit 
                          ? `${selectedPromotion.usageLimit - selectedPromotion.usedCount} kali`
                          : 'Tidak Terbatas'
                        }
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Total Penghematan:</label>
                      <span className="savings-amount">{formatCurrency(selectedPromotion.totalSavings)}</span>
                    </div>
                  </div>
                </div>

                {/* Usage Progress */}
                {selectedPromotion.usageLimit > 0 && (
                  <div className="detail-section">
                    <h4>
                      <img src={assets.stats_icon} alt="Progress" className="title-icon" />
                      Progress Penggunaan
                    </h4>
                    <div className="usage-progress">
                      <div className="progress-info">
                        <span>Penggunaan: {selectedPromotion.usedCount}/{selectedPromotion.usageLimit}</span>
                        <span>{Math.round(getUsagePercentage(selectedPromotion))}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${getUsagePercentage(selectedPromotion)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </button>
              <button className="btn btn-primary">
                <img src={assets.edit_icon} alt="Edit" className="btn-icon" />
                Edit Promosi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Promotion Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <img src={assets.add_icon_white} alt="Tambah" className="title-icon" />
                Buat Promosi Baru
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-section">
                  <h4>
                    <img src={assets.read_icon} alt="Info" className="title-icon" />
                    Informasi Dasar
                  </h4>
                  <div className="form-group">
                    <label>Nama Promosi *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Masukkan nama promosi"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Deskripsi promosi"
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Kode Promosi *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="KODEPROMO"
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <img src={assets.discount_icon} alt="Diskon" className="title-icon" />
                    Pengaturan Diskon
                  </h4>
                  <div className="form-group">
                    <label>Tipe Diskon *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                    >
                      <option value="percentage">Persentase (%)</option>
                      <option value="fixed">Nominal (Rp)</option>
                      <option value="cashback">Cashback (%)</option>
                      <option value="free_shipping">Gratis Ongkir</option>
                    </select>
                  </div>
                  
                  {formData.type !== 'free_shipping' && (
                    <div className="form-group">
                      <label>Nilai Diskon *</label>
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: e.target.value})}
                        placeholder={formData.type === 'fixed' ? '50000' : '25'}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Minimal Pembelian</label>
                    <input
                      type="number"
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({...formData, minPurchase: e.target.value})}
                      placeholder="100000"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Maksimal Diskon</label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h4><img src={assets.calender_icon} alt="Periode" className="title-icon" /> Periode & Batasan</h4>
                  <div className="form-group">
                    <label>Tanggal Mulai *</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Tanggal Berakhir *</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Batas Penggunaan</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      placeholder="100 (kosongkan untuk tidak terbatas)"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">Aktif</option>
                      <option value="scheduled">Terjadwal</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h4>🎯 Produk Berlaku</h4>
                  <div className="form-group">
                    <label>Berlaku Untuk</label>
                    <select
                      value={formData.applicableProducts}
                      onChange={(e) => setFormData({...formData, applicableProducts: e.target.value})}
                    >
                      <option value="all">Semua Produk</option>
                      <option value="category">Kategori Tertentu</option>
                      <option value="selected">Produk Pilihan</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
            
            <div className="modal-footer">
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Batal
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                onClick={handleFormSubmit}
              >
                <img src={assets.save_icon} alt="Simpan" className="btn-icon" />
                Simpan Promosi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotions;
