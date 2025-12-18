import React, { useState, useEffect, useCallback, useContext } from 'react';
import './ProductList.css';
import { assets, barang_list } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AdminStoreContext } from '../../context/AdminStoreContext.js';


const ProductList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showReadModal, setShowReadModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const LOCAL_KEY = 'products_local';

  const getLocalProducts = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const setLocalProducts = (arr) => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(arr || [])); }
    catch (err) { console.warn('LocalStorage set error', err); }
  };

  const mapAssetsFallback = () => (barang_list || []).map(b => ({
    id: b._id,
    name: b.name,
    category: b.category || 'unknown',
    price: Number(b.price),
    originalPrice: Number(b.originalPrice || 0) || null,
    discount: Number(b.discount || 0) || null,
    stock: Number(b.stock || 0),
    status: (b.stock || 0) === 0 ? 'out_of_stock' : (b.stock < 20 ? 'low_stock' : 'active'),
    image: b.image,
    description: b.description || '',
    sku: b._id
  }));
  const [products, setProducts] = useState(mapAssetsFallback());
  const navigate = useNavigate();
  const { setEditProduct } = useContext(AdminStoreContext);

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
  const PRODUCTS_ENDPOINT = `${API_BASE}/api/products.php`;
  console.log('[ProductList] API_BASE:', API_BASE);
  console.log('[ProductList] PRODUCTS_ENDPOINT:', PRODUCTS_ENDPOINT);

  const refreshProducts = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await fetch(PRODUCTS_ENDPOINT);
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Gagal memuat produk: respons tidak valid');
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Gagal memuat produk (status ${res.status})`);
      }
      const toImageUrl = (img) => {
        if (!img) return assets.package_icon;
        return img.startsWith('http') ? img : `${API_BASE}${img}`;
      };
      const mapped = data.data.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category_slug || 'unknown',
        price: Number(p.price),
        originalPrice: null,
        discount: null,
        stock: Number(p.stock),
        status: p.status,
        image: toImageUrl(p.image),
        description: p.description,
        sku: p.sku
      }));
      if (Array.isArray(mapped) && mapped.length > 0) {
        setProducts(mapped);
      } else {
        const local = getLocalProducts();
        const localMapped = local.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category || 'unknown',
          price: Number(p.price),
          originalPrice: null,
          discount: null,
          stock: Number(p.stock || 0),
          status: p.status || 'active',
          image: p.image || assets.package_icon,
          description: p.description || '',
          sku: p.sku || p.id
        }));
        const fallback = (barang_list || []).map(b => ({
          id: b._id,
          name: b.name,
          category: b.category || 'unknown',
          price: Number(b.price),
          originalPrice: Number(b.originalPrice || 0) || null,
          discount: Number(b.discount || 0) || null,
          stock: Number(b.stock || 0),
          status: (b.stock || 0) === 0 ? 'out_of_stock' : (b.stock < 20 ? 'low_stock' : 'active'),
          image: b.image,
          description: b.description || '',
          sku: b._id
        }));
        const combined = [...localMapped, ...fallback];
        setProducts(combined);
        setLoadError('Server kosong — menampilkan data lokal & contoh.');
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      const local = getLocalProducts();
      const localMapped = local.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || 'unknown',
        price: Number(p.price),
        originalPrice: null,
        discount: null,
        stock: Number(p.stock || 0),
        status: p.status || 'active',
        image: p.image || assets.package_icon,
        description: p.description || '',
        sku: p.sku || p.id
      }));
      const fallback = (barang_list || []).map(b => ({
        id: b._id,
        name: b.name,
        category: b.category || 'unknown',
        price: Number(b.price),
        originalPrice: Number(b.originalPrice || 0) || null,
        discount: Number(b.discount || 0) || null,
        stock: Number(b.stock || 0),
        status: (b.stock || 0) === 0 ? 'out_of_stock' : (b.stock < 20 ? 'low_stock' : 'active'),
        image: b.image,
        description: b.description || '',
        sku: b._id
      }));
      const combined = [...localMapped, ...fallback];
      setProducts(combined);
      setLoadError('Tidak bisa terhubung ke server — menampilkan data lokal & contoh.');
    }
    finally {
      setLoading(false);
    }
  }, [PRODUCTS_ENDPOINT, API_BASE]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const categories = ['all', 'pupuk', 'obat'];
  

  // Filter products
  const normalizeCategorySlug = (slug) => {
    const s = (slug || '').toLowerCase();
    if (s === 'obat-tanaman' || s === 'obat') return 'obat';
    if (s === 'pupuk') return 'pupuk';
    return s;
  };

  const filteredProducts = products.filter(product => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = q === ''
      ? true
      : (
        (product.name || '').toLowerCase().includes(q) ||
        (product.sku || '').toLowerCase().includes(q) ||
        (product.description || '').toLowerCase().includes(q) ||
        normalizeCategorySlug(product.category).includes(q)
      );
    const matchesCategory = selectedCategory === 'all' || normalizeCategorySlug(product.category) === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status, stock) => {
    if (stock === 0) {
      return <span className="status-badge out-of-stock">Habis</span>;
    } else if (stock < 20) {
      return <span className="status-badge low-stock">Stok Rendah</span>;
    } else if (status === 'active') {
      return <span className="status-badge active">Aktif</span>;
    } else {
      return <span className="status-badge inactive">Tidak Aktif</span>;
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    const run = async () => {
      if (!productToDelete) return;
      try {
        let ok = false;
        try {
          const r = await fetch(PRODUCTS_ENDPOINT, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productToDelete.id })
          });
          const j = await r.json().catch(() => null);
          ok = r.ok && j && j.ok;
        } catch (err) {
          console.error('Delete request error', err);
        }
        if (!ok) {
          const r2 = await fetch(PRODUCTS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: productToDelete.id })
          });
          const j2 = await r2.json().catch(() => null);
          ok = r2.ok && j2 && j2.ok;
        }
        if (!ok) {
          const local = getLocalProducts().filter(p => p.id !== productToDelete.id);
          setLocalProducts(local);
        }
        await refreshProducts();
      } catch (e) {
        console.error('Delete error', e);
      } finally {
        setShowDeleteModal(false);
        setProductToDelete(null);
      }
    };
    run();
  };

  const handleReadClick = (product) => {
    setSelectedProduct(product);
    setShowReadModal(true);
  };

  return (
    <div className="product-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <img src={assets.bag_icon} alt="Products" className="header-icon" />
            Daftar Produk
          </h1>
          <p>Kelola semua produk pertanian Anda</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/add-product'}>
            <img src={assets.add_icon_white} alt="Add" />
            Tambah Produk
          </button>
          <button className="btn-primary" style={{marginLeft:8}} onClick={refreshProducts}>
            <img src={assets.stats_icon} alt="Refresh" />
            Refresh
          </button>
        </div>
      </div>

      {(loadError || loading) && (
        <div className="info-banner">
          {loading ? 'Memuat produk…' : loadError}
        </div>
      )}

      {/* Stats - Compact */}
      <div className="stats-compact">
        <div className="stat-card total">
          <img src={assets.bag_icon} alt="Total" />
          <div>
            <div className="stat-number">{products.length}</div>
            <div className="stat-label">Total Produk</div>
          </div>
        </div>
        <div className="stat-card active">
          <img src={assets.check_icon} alt="Aktif" />
          <div>
            <div className="stat-number">{products.filter(p => p.stock > 20 && p.status === 'active').length}</div>
            <div className="stat-label">Aktif</div>
          </div>
        </div>
        <div className="stat-card low">
          <img src={assets.menunggu_icon} alt="Stok rendah" />
          <div>
            <div className="stat-number">{products.filter(p => p.stock > 0 && p.stock < 20).length}</div>
            <div className="stat-label">Stok Rendah</div>
          </div>
        </div>
        <div className="stat-card out">
          <img src={assets.trash_icon} alt="Habis" />
          <div>
            <div className="stat-number">{products.filter(p => p.stock === 0).length}</div>
            <div className="stat-label">Habis</div>
          </div>
        </div>
      </div>

      {/* Filters - Split */}
      <div className="filters-search">
        <div className="search-box">
          <img src={assets.search_icon} alt="Search" className="search-icon" />
          <input
            type="text"
            placeholder="Cari produk atau SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="filters-selects">
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">Semua Kategori</option>
          {categories.slice(1).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="low_stock">Stok Rendah</option>
          <option value="out_of_stock">Habis</option>
        </select>
      </div>

      {/* Products Grid - Compact */}
      <div className="products-grid-compact">
        {currentProducts.map(product => (
          <div key={product.id} className="product-card-compact">
            <div className="product-image">
              <img src={product.image} alt={product.name} className="product-img" />
            </div>
            
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-category">{product.category}</p>
              <div className="product-details">
                <div className="meta-row">
                  <img src={assets.wallet_icon} alt="" className="meta-icon" />
                  <div className="price-info">
                    <span className="price">{formatCurrency(product.price)}</span>
                    {product.originalPrice && (
                      <span className="original-price">{formatCurrency(product.originalPrice)}</span>
                    )}
                    {product.discount && (
                      <span className="discount">-{product.discount}%</span>
                    )}
                  </div>
                </div>
                <div className="meta-row stock-status">
                  <img src={assets.stats_icon} alt="" className="meta-icon" />
                  <span className="stock">Stok: {product.stock}</span>
                  {getStatusBadge(product.status, product.stock)}
                </div>
              </div>
            </div>

            <div className="product-actions">
              <button className="btn-read" title="Lihat" onClick={() => handleReadClick(product)}>
                <img src={assets.read_icon} alt="Lihat" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src=assets.package_icon;}} />
              </button>
              <button className="btn-edit" title="Edit" onClick={() => { try { setEditProduct(product) } catch (e) { console.warn('Gagal set editProduct', e) } navigate(`/edit-product?id=${product.id}`) }}>
                <img src={assets.edit_icon} alt="Edit" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src=assets.package_icon;}} />
              </button>
              <button 
                className="btn-delete" 
                title="Hapus"
                onClick={() => handleDeleteClick(product)}
              >
                <img src={assets.trash_icon} alt="Hapus" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src=assets.package_icon;}} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination - Compact */}
      {totalPages > 1 && (
        <div className="pagination-compact">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ‹ Prev
          </button>
          
          <span className="pagination-info">
            {currentPage} / {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next ›
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Konfirmasi Hapus</h3>
            <p>Apakah Anda yakin ingin menghapus produk "{productToDelete?.name}"?</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowDeleteModal(false)}
              >
                Batal
              </button>
              <button 
                className="btn-danger" 
                onClick={handleDeleteConfirm}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showReadModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Detail Produk</h3>
            <div style={{display:'flex', gap:'16px', alignItems:'flex-start'}}>
              <div style={{width:80, height:80, borderRadius:8, overflow:'hidden'}}>
                <img src={selectedProduct.image} alt={selectedProduct.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
              </div>
              <div style={{flex:1}}>
                <p><strong>{selectedProduct.name}</strong></p>
                <p>Kategori: {selectedProduct.category}</p>
                <p>SKU: {selectedProduct.sku || '-'}</p>
                <p>Harga: {formatCurrency(selectedProduct.price)}</p>
                <p>Stok: {selectedProduct.stock}</p>
                <p style={{marginTop:8}}>{selectedProduct.description}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReadModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
