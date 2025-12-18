import React, { useContext, useState, useEffect } from 'react';
import './Promo.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import api from '../../services/api';
import CustomStars from '../../components/CustomStars/CustomStars';

const Promo = () => {
  const { barang_list, addToCart, toggleWishlist, wishlist, getUserRating, setUserRating } = useContext(StoreContext);
  const [dbProducts, setDbProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Countdown timer untuk flash sale
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7); // 7 hari dari sekarang
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Ambil produk dari taniku_db via API PHP
  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        const res = await api.get('/api/products.php');
        const items = ((res.data && res.data.data) || []).map((row) => {
          const base = (api.defaults.baseURL || '').replace(/\/$/, '');
          const img = row.image ? `${base}${row.image.startsWith('/') ? row.image : '/' + row.image}` : null;
          const slug = (row.category_slug || '').toLowerCase();
          const cat = slug || (row.category_name || 'pupuk');
          return {
            _id: String(row.id),
            name: row.name || 'Produk',
            description: row.description || '',
            image: img || '/placeholder.png',
            category: cat,
            price: Math.round((row.price || 0) / 1000),
            originalPrice: null,
            discount: Number(row.discount || 0),
            rating: Number(row.rating || 0),
            reviewCount: Number(row.review_count || 0),
            stock: row.stock || 0,
          };
        });
        if (mounted) setDbProducts(items);
      } catch (e) {
        console.error('[Promo] Gagal ambil produk dari API:', e);
      }
    };
    fetchProducts();
    return () => { mounted = false; };
  }, []);

  // Sumber data: prioritaskan DB, fallback ke aset
  const sourceProducts = dbProducts && dbProducts.length > 0 ? dbProducts : barang_list;

  // Filter produk untuk berbagai kategori promo
  const flashSaleProducts = sourceProducts.slice(0, 6);
  const weeklyDeals = sourceProducts.slice(6, 12);
  const padToMultipleOf = (items, size = 4) => {
    const result = [...items];
    if (result.length === 0) return result;
    let i = 0;
    while (result.length % size !== 0) {
      result.push(items[i % items.length]);
      i++;
    }
    return result;
  };
  const bundleDeals = sourceProducts.slice(12, 16);
  const bundleObatItems = [
    sourceProducts.find(p => String(p.name).toLowerCase() === 'obat tanaman 10'),
    sourceProducts.find(p => String(p.name).toLowerCase() === 'obat tanaman'),
    sourceProducts.find(p => String(p.name).toLowerCase() === 'pupuk 9')
  ].filter(Boolean);

  const handleAddToCart = (itemId, context = 'default') => {
    const list = (dbProducts && dbProducts.length > 0 ? dbProducts : barang_list);
    const item = list.find(p => String(p._id) === String(itemId));
    const fallbackDiscount = context === 'flash' ? 40 : (context === 'weekly' ? 25 : 0);
    const hasExistingDiscount = (item?.discount && Number(item.discount) > 0);
    const discountPct = hasExistingDiscount ? Number(item.discount) : fallbackDiscount;
    let originalRibu;
    let saleRibu;
    if (hasExistingDiscount) {
      originalRibu = item?.originalPrice ? Number(item.originalPrice) : Math.round(Number(item?.price || 0) / (1 - (discountPct / 100)));
      saleRibu = Number(item?.price || 0);
    } else if (context === 'flash') {
      originalRibu = item?.originalPrice ? Number(item.originalPrice) : Number(item?.price || 0);
      saleRibu = Math.round(originalRibu * 0.6);
    } else {
      originalRibu = item?.originalPrice ? Number(item.originalPrice) : ((discountPct > 0) ? Math.round(Number(item?.price || 0) / (1 - (discountPct / 100))) : null);
      saleRibu = Number(item?.price || 0);
    }
    addToCart(itemId, 1, {
      name: item?.name,
      price: saleRibu,
      originalPrice: originalRibu,
      discount: discountPct,
      image: item?.image,
      category: item?.category,
      stock: Number(item?.stock || 0)
    });
  };

  return (
    <div className="promo-container">
      {/* Hero Section */}
      <section className="promo-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon"></span>
            <span className="badge-text">Penawaran Terbatas</span>
          </div>
          <h1 className="hero-title">
            Promo Spesial <span className="highlight">Taniku</span>
          </h1>
          <p className="hero-subtitle">
            Dapatkan produk segar berkualitas premium dengan harga terbaik. 
            Penawaran eksklusif hanya untuk Anda!
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">50%</span>
              <span className="stat-label">Diskon Hingga</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">100+</span>
              <span className="stat-label">Produk Promo</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Layanan</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card">
            <img src={assets.promo_hero || assets.logo} alt="Promo Hero" />
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      <section className="flash-sale-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <h2 className="section-title">
              <span className="title-icon"></span>
              Flash Sale
            </h2>
            <p className="section-subtitle">Penawaran kilat dengan diskon fantastis</p>
          </div>
          <div className="countdown-timer">
            <div className="timer-label">Berakhir dalam:</div>
            <div className="timer-display">
              <div className="time-unit">
                <span className="time-number">{timeLeft.days.toString().padStart(2, '0')}</span>
                <span className="time-label">Hari</span>
              </div>
              <div className="time-separator">:</div>
              <div className="time-unit">
                <span className="time-number">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="time-label">Jam</span>
              </div>
              <div className="time-separator">:</div>
              <div className="time-unit">
                <span className="time-number">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="time-label">Menit</span>
              </div>
              <div className="time-separator">:</div>
              <div className="time-unit">
                <span className="time-number">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="time-label">Detik</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="products-grid">
          {padToMultipleOf(flashSaleProducts).map((item, idx) => (
            <div key={`${item._id}-${idx}`} className="product-card flash-sale-card">
              <div className="product-image-wrapper">
                <img src={item.image} alt={item.name} className="product-image" />
                <div className="discount-badge">-{(item.discount && item.discount > 0) ? item.discount : 40}%</div>
                <div className="sale-badge">FLASH SALE</div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{item.name}</h3>
                <div className="product-rating">
                  <CustomStars 
                    rating={getUserRating(item._id) || item.rating || 0}
                    maxRating={5}
                    size="small"
                    showValue={false}
                    interactive={true}
                    onRatingChange={(newRating) => setUserRating(item._id, newRating)}
                    showEmptyStars={false}
                  />
                  <span className="rating-text">
                    {(getUserRating(item._id) || item.rating) 
                      ? `${(getUserRating(item._id) || item.rating).toFixed(1)} (${item.reviewCount || 0} ulasan)` 
                      : 'Belum ada rating'}
                  </span>
                </div>
                <div className="price-wrapper">
                  {(() => {
                    const hasExistingDiscount = (item.discount && item.discount > 0);
                    const discountPct = hasExistingDiscount ? item.discount : 40;
                    const originalRibu = item.originalPrice ? item.originalPrice : (hasExistingDiscount ? Math.round(item.price / (1 - (discountPct / 100))) : item.price);
                    const saleRibu = hasExistingDiscount ? item.price : Math.round(originalRibu * 0.6);
                    return (
                      <>
                        {originalRibu ? <span className="original-price">Rp {(originalRibu * 1000).toLocaleString()}</span> : null}
                        <span className="sale-price">Rp {(saleRibu * 1000).toLocaleString()}</span>
                      </>
                    )
                  })()}
                </div>
                <div className="product-actions">
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(item._id, 'flash')}
                  >
                    <span className="btn-icon">🛒</span>
                    Tambah ke Keranjang
                  </button>
                  <button 
                    className={`wishlist-btn ${wishlist[item._id] ? 'active' : ''}`}
                    onClick={() => toggleWishlist(item._id)}
                    title={wishlist[item._id] ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
                  >
                    <svg className="wishlist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Deals Section */}
      <section className="weekly-deals-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <h2 className="section-title">
              <span className="title-icon"></span>
              Penawaran Mingguan
            </h2>
            <p className="section-subtitle">Diskon pilihan tiap minggu, stok terbatas</p>
          </div>
        </div>
        
        <div className="products-grid">
          {padToMultipleOf(weeklyDeals).map((item, idx) => (
            <div key={`${item._id}-${idx}`} className="product-card weekly-deal-card">
              <div className="product-image-wrapper">
                <img src={item.image} alt={item.name} className="product-image" />
                <div className="discount-badge">-{(item.discount && item.discount > 0) ? item.discount : 25}%</div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{item.name}</h3>
                <div className="product-rating">
                  <CustomStars 
                    rating={getUserRating(item._id) || item.rating || 0}
                    maxRating={5}
                    size="small"
                    showValue={false}
                    interactive={true}
                    onRatingChange={(newRating) => setUserRating(item._id, newRating)}
                    showEmptyStars={false}
                  />
                  <span className="rating-text">
                    {(getUserRating(item._id) || item.rating) 
                      ? `${(getUserRating(item._id) || item.rating).toFixed(1)} (${item.reviewCount || 0} ulasan)` 
                      : 'Belum ada rating'}
                  </span>
                </div>
                {(() => {
                  const discountPct = (item.discount && item.discount > 0) ? item.discount : 25;
                  const originalRibu = item.originalPrice
                    ? item.originalPrice
                    : (discountPct > 0 ? Math.round(item.price / (1 - (discountPct / 100))) : null)
                  return (
                    <div className="price-wrapper">
                      {originalRibu ? <span className="original-price">Rp {(originalRibu * 1000).toLocaleString()}</span> : null}
                      <span className="sale-price">Rp {(item.price * 1000).toLocaleString()}</span>
                    </div>
                  )
                })()}
                <div className="product-actions">
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(item._id, 'weekly')}
                  >
                    <span className="btn-icon">🛒</span>
                    Tambah ke Keranjang
                  </button>
                  <button 
                    className={`wishlist-btn ${wishlist[item._id] ? 'active' : ''}`}
                    onClick={() => toggleWishlist(item._id)}
                    title={wishlist[item._id] ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
                  >
                    <svg className="wishlist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bundle Deals Section */}
      <section className="bundle-deals-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <h2 className="section-title">
              <span className="title-icon"></span>
              Paket Hemat
            </h2>
            <p className="section-subtitle">Beli lebih banyak, hemat lebih besar</p>
          </div>
        </div>
        
        <div className="bundle-grid">
          <div className="bundle-card featured-bundle">
            <div className="bundle-header">
              <h3 className="bundle-title">Paket obat tanaman </h3>
              <div className="bundle-badge">TERLARIS</div>
            </div>
            <div className="bundle-content">
              <div className="bundle-items">
                {bundleObatItems.map((item) => (
                  <div key={item._id} className="bundle-item">
                    <img src={item.image} alt={item.name} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="bundle-pricing">
                <div className="bundle-original-price">Rp 150.000</div>
                <div className="bundle-sale-price">Rp 99.000</div>
                <div className="bundle-savings">Hemat Rp 51.000</div>
              </div>
              <button
                className="bundle-buy-btn"
                onClick={() => {
                  const priceRibu = 99
                  const originalRibu = 150
                  const discountPct = Math.round((1 - (priceRibu / originalRibu)) * 100)
                  addToCart('bundle-obat-tanaman', 1, {
                    name: 'Paket Obat Tanaman',
                    price: priceRibu,
                    originalPrice: originalRibu,
                    discount: discountPct,
                    image: null,
                    category: 'bundle',
                    stock: 100
                  })
                }}
              >
                Beli Paket Ini
              </button>
            </div>
          </div>
          
          <div className="bundle-card">
            <div className="bundle-header">
              <h3 className="bundle-title">Paket Obat Premium</h3>
            </div>
            <div className="bundle-content">
              <div className="bundle-items">
                {bundleDeals.slice(1, 4).map((item) => (
                  <div key={item._id} className="bundle-item">
                    <img src={item.image} alt={item.name} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="bundle-pricing">
                <div className="bundle-original-price">Rp 200.000</div>
                <div className="bundle-sale-price">Rp 149.000</div>
                <div className="bundle-savings">Hemat Rp 51.000</div>
              </div>
              <button
                className="bundle-buy-btn"
                onClick={() => {
                  const priceRibu = 149
                  const originalRibu = 200
                  const discountPct = Math.round((1 - (priceRibu / originalRibu)) * 100)
                  addToCart('bundle-buah-premium', 1, {
                    name: 'Paket Obat Premium',
                    price: priceRibu,
                    originalPrice: originalRibu,
                    discount: discountPct,
                    image: null,
                    category: 'bundle',
                    stock: 100
                  })
                }}
              >
                Beli Paket Ini
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Benefits Section */}
     

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <div className="newsletter-text">
            <h2 className="newsletter-title">Jangan Lewatkan Promo Terbaru!</h2>
            <p className="newsletter-subtitle">
              Daftarkan email Anda untuk mendapatkan notifikasi promo eksklusif dan penawaran terbaik
            </p>
          </div>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Masukkan email Anda" 
              className="newsletter-input"
            />
            <button className="newsletter-btn">
              Berlangganan
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Promo;
