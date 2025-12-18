import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../AddProduct/AddProduct.css';
import { assets, barang_list } from '../../assets/assets';
import { AdminStoreContext } from '../../context/AdminStoreContext.js';

const EditProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const [editId, setEditId] = useState(productId || null);
  const { editProduct } = useContext(AdminStoreContext)

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
  const UPLOAD_ENDPOINT = `${API_BASE}/api/upload.php`;

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
    catch (e) { console.warn('LocalStorage set error', e); }
  };

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    description: '',
    stock: '',
    sku: '',
    image: null,
    status: 'active',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const cached = editProduct || JSON.parse(sessionStorage.getItem('editProduct') || 'null');
        if (cached) {
          setEditId(prev => prev || String(cached.id));
          setFormData(prev => ({
            ...prev,
            name: cached.name || '',
            category: cached.category || '',
            price: String(cached.price ?? ''),
            originalPrice: String(cached.originalPrice ?? ''),
            description: cached.description || '',
            stock: String(cached.stock ?? ''),
            sku: cached.sku || '',
            status: cached.status || 'active'
          }));
          setImagePreview(cached.image || null);
        }
      } catch (e) { console.warn('Cache read failed', e); }

      if (!productId && !editId) {
        navigate('/products', { replace: true });
        return;
      }
      try {
        const res = await fetch(`${PRODUCTS_ENDPOINT}?id=${productId || editId}`);
        const data = await res.json();
        if (res.ok && data && data.ok && data.data) {
          const p = data.data;
          setFormData(prev => ({
            ...prev,
            name: p.name || '',
            category: p.category_slug || p.category || '',
            price: String(p.price ?? ''),
            originalPrice: String(p.originalPrice ?? ''),
            description: p.description || '',
            stock: String(p.stock ?? ''),
            sku: p.sku || '',
            status: p.status || 'active'
          }));
          const img = p.image ? (String(p.image).startsWith('http') ? p.image : `${API_BASE}${p.image}`) : null;
          setImagePreview(img);
          setEditId(prev => prev || String(p.id));
          return;
        }
      } catch (e) { console.warn('Load product from server failed', e); }
      try {
        const local = getLocalProducts().find(p => String(p.id) === String(productId || editId));
        if (local) {
          setFormData(prev => ({
            ...prev,
            name: local.name || '',
            category: local.category || '',
            price: String(local.price ?? ''),
            originalPrice: String(local.originalPrice ?? ''),
            description: local.description || '',
            stock: String(local.stock ?? ''),
            sku: local.sku || '',
            status: local.status || 'active'
          }));
          setImagePreview(local.image || null);
          setEditId(prev => prev || String(local.id));
          return;
        }
      } catch (e) { console.warn('Load product from local failed', e); }
      try {
        const asset = (barang_list || []).find(b => String(b._id) === String(productId || editId));
        if (asset) {
          setFormData(prev => ({
            ...prev,
            name: asset.name || '',
            category: asset.category || '',
            price: String(asset.price ?? ''),
            originalPrice: String(asset.originalPrice ?? ''),
            description: asset.description || '',
            stock: String(asset.stock ?? ''),
            sku: String(asset._id),
            status: (asset.stock || 0) === 0 ? 'inactive' : 'active'
          }));
          setImagePreview(asset.image || null);
          setEditId(prev => prev || String(asset._id));
          return;
        }
      } catch (e) { console.warn('Load product from assets failed', e); }
    };
    loadProduct();
  }, [productId, editId, PRODUCTS_ENDPOINT, API_BASE, navigate, editProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama wajib';
    if (!formData.category) newErrors.category = 'Kategori wajib';
    if (!formData.price) newErrors.price = 'Harga wajib';
    if (!formData.stock) newErrors.stock = 'Stok wajib';
    if (!formData.sku.trim()) newErrors.sku = 'SKU wajib';
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
        alert('Harga/Stok harus angka.');
        setIsSubmitting(false);
        return;
      }

      let imagePath = null;
      if (formData.image && typeof formData.image !== 'string') {
        const fd = new FormData();
        fd.append('file', formData.image);
        try {
          const up = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd });
          const ct = up.headers.get('content-type') || ''; 
          const upData = ct.includes('application/json') ? await up.json() : null;
          if (up.ok && upData?.ok) imagePath = upData.path;
        } catch (e) { console.warn('Upload failed', e); }
      }

      const payload = {
        id: editId || productId,
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category,
        price: priceNum,
        stock: stockNum,
        description: formData.description.trim(),
        status: formData.status || 'active',
        ...(imagePath ? { image_path: imagePath } : {}),
      };

      let res = await fetch(PRODUCTS_ENDPOINT, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        res = await fetch(PRODUCTS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', ...payload }) });
      }

      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok || !(data && data.ok)) {
        alert(data?.error || 'Gagal memperbarui produk');
        return;
      }

      try {
        const local = getLocalProducts();
        const next = local.map(p => String(p.id) === String(editId || productId)
          ? { ...p, name: payload.name, sku: payload.sku, category: payload.category, price: payload.price, stock: payload.stock, description: payload.description, status: payload.status, image: imagePreview || p.image }
          : p);
        setLocalProducts(next);
      } catch (e) { console.warn('Update local cache failed', e); }

      alert('Produk diperbarui');
      navigate('/products', { replace: true });
    } catch (err) {
      console.warn('Submit failed, falling back to local', err);
      const local = getLocalProducts();
      const next = local.map(p => String(p.id) === String(editId || productId)
        ? { ...p, name: formData.name.trim(), sku: formData.sku.trim(), category: formData.category, price: Number(String(formData.price).replace(/[^0-9.]/g,'')) || 0, stock: Number(String(formData.stock).replace(/[^0-9.]/g,'')) || 0, description: formData.description.trim(), status: formData.status || 'active', image: imagePreview || p.image }
        : p);
      try { setLocalProducts(next); } catch (e) { console.warn('Set local cache failed', e); }
      alert('Server tidak tersedia — perubahan disimpan lokal');
      navigate('/products', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-product-page edit-mode">
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <img src={assets.edit_icon} alt="Edit Product" />
            </div>
            <div className="header-text">
              <h1>Edit Produk</h1>
              <p>Perbarui informasi produk yang sudah ada</p>
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>
              <img src={assets.kembali} alt="Kembali" />
              Kembali ke Produk
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
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
                    <input id="name" name="name" value={formData.name} onChange={handleInputChange} className={errors.name ? 'error' : ''} />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="sku">SKU *</label>
                    <input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} className={errors.sku ? 'error' : ''} />
                    {errors.sku && <span className="error-text">{errors.sku}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Kategori *</label>
                    <select id="category" name="category" value={formData.category} onChange={handleInputChange} className={errors.category ? 'error' : ''}>
                      <option value="pupuk">Pupuk & Nutrisi</option>
                      <option value="obat">Pestisida & Obat</option>
                      <option value="alat">Alat Pertanian</option>
                      <option value="benih">Benih & Bibit</option>
                      <option value="organik">Produk Organik</option>
                    </select>
                    {errors.category && <span className="error-text">{errors.category}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="active">Aktif</option>
                      <option value="draft">Draft</option>
                      <option value="inactive">Tidak Aktif</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="description">Deskripsi *</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="4" className={errors.description ? 'error' : ''} />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>
              </div>
            </div>

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
                      <input id="price" name="price" value={formData.price} onChange={handleInputChange} />
                    </div>
                    {errors.price && <span className="error-text">{errors.price}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="originalPrice">Harga Asli</label>
                    <div className="input-with-prefix outside">
                      <span className="prefix-outside">Rp</span>
                      <input id="originalPrice" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="stock">Jumlah Stok *</label>
                  <input id="stock" name="stock" value={formData.stock} onChange={handleInputChange} />
                  {errors.stock && <span className="error-text">{errors.stock}</span>}
                </div>
              </div>
            </div>

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
                  <input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} className="image-input" />
                  <label htmlFor="image" className="image-upload-label">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <div className="image-overlay"><span>Klik untuk mengganti</span></div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon"><img src={assets.camera_icon} alt="Upload" /></div>
                        <div className="upload-text"><strong>Klik untuk upload gambar</strong><p>atau drag & drop file di sini</p></div>
                        <div className="upload-info">JPG, PNG, atau GIF (max. 5MB)</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>
              <img src={assets.trash_icon} alt="Batal" />
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <img src={assets.save_icon} alt="Save" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
