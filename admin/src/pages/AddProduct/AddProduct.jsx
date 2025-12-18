import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AddProduct.css';
import { assets } from '../../assets/assets';

const AddProduct = () => {
  const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
  const envBase = import.meta.env.VITE_API_BASE;
  const fallbackBase = `http://${host}:5176`;
  const API_BASE = (() => {
    try {
      if (typeof envBase === 'string' && envBase.trim().length > 0) {
        const u = new URL(envBase);
        // If env mistakenly points to frontend dev port, force backend dev port
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
  const UPLOAD_ENDPOINT = `${API_BASE}/api/upload.php`;
  console.log('[AddProduct] API_BASE:', API_BASE);
  console.log('[AddProduct] PRODUCTS_ENDPOINT:', PRODUCTS_ENDPOINT);
  console.log('[AddProduct] UPLOAD_ENDPOINT:', UPLOAD_ENDPOINT);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    description: '',
    stock: '',
    sku: '',
    image: null,
    specifications: {
      weight: '',
      type: '',
      content: '',
      ph: '',
      packaging: ''
    },
    status: 'active'
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const LOCAL_KEY = 'products_local';

  const getLocalProducts = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };

  const setLocalProducts = (arr) => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(arr || [])); }
    catch (err) { console.warn('LocalStorage set error', err); }
  };

  const categories = [
    { value: '', label: 'Pilih Kategori' },
    { value: 'pupuk', label: 'Pupuk & Nutrisi' },
    { value: 'obat', label: 'Pestisida & Obat' },
    { value: 'alat', label: 'Alat Pertanian' },
    { value: 'benih', label: 'Benih & Bibit' },
    { value: 'organik', label: 'Produk Organik' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Aktif' },
    { value: 'draft', label: 'Draft' },
    { value: 'inactive', label: 'Tidak Aktif' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (!formData.category) newErrors.category = 'Kategori wajib dipilih';
    if (!formData.price) newErrors.price = 'Harga wajib diisi';
    if (!formData.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
    if (!formData.stock) newErrors.stock = 'Stok wajib diisi';
    if (!formData.sku.trim()) newErrors.sku = 'SKU wajib diisi';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const toNumber = (v) => {
        const cleaned = String(v ?? '').replace(/[^0-9.]/g, '');
        return cleaned ? Number(cleaned) : NaN;
      };

      const priceNum = toNumber(formData.price);
      const stockNum = toNumber(formData.stock);
      if (!Number.isFinite(priceNum) || !Number.isFinite(stockNum)) {
        alert('Harga/Stok harus angka. Hapus titik/koma/simbol.');
        setIsSubmitting(false);
        return;
      }
      let imagePath = null;
      if (formData.image) {
        const fd = new FormData();
        fd.append('file', formData.image);
        try {
          const up = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd });
          const upCt = up.headers.get('content-type') || '';
          const upData = upCt.includes('application/json') ? await up.json() : null;
          if (up.ok && upData.ok) {
            imagePath = upData.path; // e.g., /uploads/filename
          } else {
            console.warn('Upload gagal:', upData?.error || up.statusText);
          }
        } catch (err) {
          console.warn('Upload error:', err);
        }
      }

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category, // slug: pupuk/obat/alat/benih/organik
        price: priceNum,
        stock: stockNum,
        description: formData.description.trim(),
        status: formData.status || 'active',
        ...(imagePath ? { image_path: imagePath } : {}),
      };
      console.log('[AddProduct] Payload:', payload);

      const method = productId ? 'PUT' : 'POST';
      const body = productId ? JSON.stringify({ id: productId, ...payload }) : JSON.stringify(payload);
      let res = await fetch(PRODUCTS_ENDPOINT, { method, headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) {
        const fallbackBody = productId ? JSON.stringify({ action: 'update', id: productId, ...payload }) : JSON.stringify(payload);
        res = await fetch(PRODUCTS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: fallbackBody });
      }

      console.log('[AddProduct] Response status:', res.status);
      const resClone = res.clone();
      const ct = res.headers.get('content-type') || '';
      let data = null;
      try {
        data = ct.includes('application/json') ? await res.json() : null;
      } catch (parseErr) {
        console.warn('[AddProduct] JSON parse error:', parseErr);
      }
      if (!res.ok || !(data && data.ok)) {
        let msg = 'Gagal menambahkan produk';
        if (data && data.error) {
          msg = data.error;
          if (res.status === 422 && Array.isArray(data.fields) && data.fields.length) {
            msg += ` — Fields: ${data.fields.join(', ')}`;
          }
        } else if (res.status === 409) {
          msg = 'SKU sudah digunakan';
        } else if (res.status === 422) {
          msg = 'Data belum lengkap. Harap isi semua field wajib.';
        } else if (res.status >= 500) {
          msg = `Server error (${res.status}).`;
        }
        // Log raw response body for debugging when backend doesn't send JSON
        try {
          const raw = await resClone.text();
          console.warn('[AddProduct] Raw response:', raw);
        } catch (err) {
          console.warn('[AddProduct] Read raw error:', err);
        }
        alert(`Gagal: ${msg}`);
        return;
      }

      alert(productId ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
      if (productId) {
        window.location.href = '/products';
      } else {
        setFormData({
          name: '',
          category: '',
          price: '',
          originalPrice: '',
          description: '',
          stock: '',
          sku: '',
          image: null,
          specifications: {
            weight: '',
            type: '',
            content: '',
            ph: '',
            packaging: ''
          },
          status: 'active'
        });
        setImagePreview(null);
      }
      
    } catch (err) {
      console.warn('Submit to server failed, using local storage', err);
      const id = productId || `l_${Date.now()}`;
      const local = getLocalProducts();
      const next = local.filter(p => p.id !== id);
      next.push({
        id,
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category,
        price: Number(String(formData.price).replace(/[^0-9.]/g,'')) || 0,
        stock: Number(String(formData.stock).replace(/[^0-9.]/g,'')) || 0,
        description: formData.description.trim(),
        status: formData.status || 'active',
        image: imagePreview || null
      });
      setLocalProducts(next);
      alert('Server tidak tersedia — produk disimpan lokal.');
      window.location.href = '/products';
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      try {
        const res = await fetch(`${PRODUCTS_ENDPOINT}?id=${productId}`);
        const data = await res.json();
        if (res.ok && data && data.ok && data.data) {
          const p = data.data;
          setFormData(prev => ({
            ...prev,
            name: p.name || '',
            category: p.category_slug || '',
            price: String(p.price ?? ''),
            originalPrice: '',
            description: p.description || '',
            stock: String(p.stock ?? ''),
            sku: p.sku || '',
            status: p.status || 'active'
          }));
          const img = p.image ? (p.image.startsWith('http') ? p.image : `${API_BASE}${p.image}`) : null;
          setImagePreview(img);
          return;
        }
      } catch (err) {
        console.warn('Load product from server failed', err);
      }
      const local = getLocalProducts().find(p => p.id === productId);
      if (local) {
          setFormData(prev => ({
            ...prev,
            name: local.name || '',
            category: local.category || '',
            price: String(local.price ?? ''),
            originalPrice: '',
            description: local.description || '',
            stock: String(local.stock ?? ''),
            sku: local.sku || '',
            status: local.status || 'active'
          }));
        setImagePreview(local.image || null);
        return;
      }
      try {
        const cached = JSON.parse(sessionStorage.getItem('editProduct') || 'null');
        if (cached && String(cached.id) === String(productId)) {
          setFormData(prev => ({
            ...prev,
            name: cached.name || '',
            category: cached.category || '',
            price: String(cached.price ?? ''),
            originalPrice: '',
            description: cached.description || '',
            stock: String(cached.stock ?? ''),
            sku: cached.sku || '',
            status: cached.status || 'active'
          }));
          setImagePreview(cached.image || null);
        }
      } catch (err) {
        console.warn('No cached editProduct in sessionStorage', err);
      }
    };
    loadProduct();
  }, [productId, PRODUCTS_ENDPOINT, API_BASE]);

  return (
    <div className="add-product-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            {productId && (
              <div className="header-icon">
                <img src={assets.edit_icon} alt="Edit Product" />
              </div>
            )}
            <div className="header-text">
              <h1>{productId ? 'Edit Produk' : 'Tambah Produk Baru'}</h1>
              <p>{productId ? 'Perbarui informasi produk yang sudah ada' : 'Lengkapi informasi produk untuk menambahkan ke katalog'}</p>
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="btn btn-secondary">
              <img src={assets.lists_icon} alt="Draft" />
              Simpan Draft
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => window.location.href = '/products'}>
              <img src={assets.read_icon} alt="Lihat" />
              Lihat Produk
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            
            {/* Basic Information Card */}
            <div className="form-card">
              <div className="card-header">
                <div className="card-icon">
                  <img src={assets.edit_icon} alt="Basic Info" />
                </div>
                <div className="card-title">
                  <h3>Informasi Dasar</h3>
                  <p>Data utama produk yang akan ditampilkan</p>
                </div>
              </div>
              
              <div className="card-content">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Nama Produk *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama produk"
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="sku">SKU *</label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="Kode unik produk"
                      className={errors.sku ? 'error' : ''}
                    />
                    {errors.sku && <span className="error-text">{errors.sku}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Kategori *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={errors.category ? 'error' : ''}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && <span className="error-text">{errors.category}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Deskripsi *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Jelaskan detail produk, manfaat, dan cara penggunaan"
                    rows="4"
                    className={errors.description ? 'error' : ''}
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Card */}
            <div className="form-card">
              <div className="card-header">
                <div className="card-icon">
                  <img src={assets.wallet_icon} alt="Pricing" />
                </div>
                <div className="card-title">
                  <h3>Harga & Stok</h3>
                  <p>Informasi harga dan ketersediaan produk</p>
                </div>
              </div>
              
              <div className="card-content">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Harga Jual *</label>
                    <div className="input-with-prefix outside">
                      <span className="prefix-outside">Rp</span>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        className={errors.price ? 'error' : ''}
                      />
                    </div>
                    {errors.price && <span className="error-text">{errors.price}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="originalPrice">Harga Asli</label>
                    <div className="input-with-prefix outside">
                      <span className="prefix-outside">Rp</span>
                      <input
                        type="number"
                        id="originalPrice"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Jumlah Stok *</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className={errors.stock ? 'error' : ''}
                  />
                  {errors.stock && <span className="error-text">{errors.stock}</span>}
                </div>
              </div>
            </div>

            {/* Product Image Card */}
            <div className="form-card">
              <div className="card-header">
                <div className="card-icon">
                  <img src={assets.camera_icon} alt="Image" />
                </div>
                <div className="card-title">
                  <h3>Gambar Produk</h3>
                  <p>Upload foto produk berkualitas tinggi</p>
                </div>
              </div>
              
              <div className="card-content">
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                  />
                  <label htmlFor="image" className="image-upload-label">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <div className="image-overlay">
                          <span>Klik untuk mengganti</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon"><img src={assets.camera_icon} alt="Upload" /></div>
                        <div className="upload-text">
                          <strong>Klik untuk upload gambar</strong>
                          <p>atau drag & drop file di sini</p>
                        </div>
                        <div className="upload-info">
                          JPG, PNG, atau GIF (max. 5MB)
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Specifications Card */}
            <div className="form-card">
              <div className="card-header">
                <div className="card-icon">
                  <img src={assets.stats_icon} alt="Specifications" />
                </div>
                <div className="card-title">
                  <h3>Spesifikasi Produk</h3>
                  <p>Detail teknis dan informasi tambahan</p>
                </div>
              </div>
              
              <div className="card-content">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="specifications.weight">Berat</label>
                    <input
                      type="text"
                      id="specifications.weight"
                      name="specifications.weight"
                      value={formData.specifications.weight}
                      onChange={handleInputChange}
                      placeholder="contoh: 1 kg"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="specifications.type">Jenis</label>
                    <input
                      type="text"
                      id="specifications.type"
                      name="specifications.type"
                      value={formData.specifications.type}
                      onChange={handleInputChange}
                      placeholder="contoh: Organik"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="specifications.content">Kandungan</label>
                    <input
                      type="text"
                      id="specifications.content"
                      name="specifications.content"
                      value={formData.specifications.content}
                      onChange={handleInputChange}
                      placeholder="contoh: NPK 16-16-16"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="specifications.ph">pH</label>
                    <input
                      type="text"
                      id="specifications.ph"
                      name="specifications.ph"
                      value={formData.specifications.ph}
                      onChange={handleInputChange}
                      placeholder="contoh: 6.5-7.0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="specifications.packaging">Kemasan</label>
                  <input
                    type="text"
                    id="specifications.packaging"
                    name="specifications.packaging"
                    value={formData.specifications.packaging}
                    onChange={handleInputChange}
                    placeholder="contoh: Kantong plastik 1 kg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => window.location.href = '/products'}>
              <img src={assets.trash_icon} alt="Batal" />
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <img src={assets.save_icon} alt="Save" />
              {isSubmitting ? 'Menyimpan...' : (productId ? 'Simpan Perubahan' : 'Simpan Produk')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
