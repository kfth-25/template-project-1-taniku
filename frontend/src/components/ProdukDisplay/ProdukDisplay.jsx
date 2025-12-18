import React, { useState, useContext, useEffect, useMemo } from 'react';
import './ProdukDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import CustomStars from '../CustomStars/CustomStars';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import api from '../../services/api';

// Loading Skeleton Component
const ProductSkeleton = () => (
    <div className="skeleton-card">
        <div className="skeleton-image"></div>
        <div className="skeleton-text title"></div>
        <div className="skeleton-text description"></div>
        <div className="skeleton-text price"></div>
        <div className="skeleton-button"></div>
    </div>
);

const ProdukDisplay = () => {
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [sortBy, setSortBy] = useState('terbaru');
    const [viewMode, setViewMode] = useState('grid');
    const [isLoading, setIsLoading] = useState(false);
    const [dbProducts, setDbProducts] = useState([]);
    const [quantities, setQuantities] = useState({}); // Add state for quantities
    const { addToCart, removeFromCart, toggleWishlist, wishlist, isInCart, getCartItemQuantity, setUserRating, getUserRating } = useContext(StoreContext);
    const navigate = useNavigate(); // Add navigate hook

    // Initialize quantities for all products
    const initializeQuantities = (products) => {
        const initialQuantities = {};
        products.forEach(product => {
            initialQuantities[product._id] = 1;
        });
        setQuantities(initialQuantities);
    };

    

    // Direct add to cart function
    const handleAddToCart = (productId) => {
        const quantity = quantities[productId] || 1;
        for (let i = 0; i < quantity; i++) {
            addToCart(productId);
        }
        // User tetap di halaman home, tidak redirect
    };

    const handleCategoryClick = (category) => {
        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            setActiveCategory(category);
            setIsLoading(false);
        }, 500);
    };

    const handleSortChange = (sortType) => {
        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            setSortBy(sortType);
            setIsLoading(false);
        }, 300);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    // Fetch produk dari taniku_db via PHP API
    useEffect(() => {
        let mounted = true;
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const res = await api.get('/api/products.php');
                const items = ((res.data && res.data.data) || []).map((row) => {
                    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
                    const img = row.image ? `${base}${row.image.startsWith('/') ? row.image : '/' + row.image}` : null;
                    const slug = (row.category_slug || '').toLowerCase();
                    const cname = (row.category_name || '').toLowerCase();
                    const cat = slug === 'pupuk' || cname.includes('pupuk') ? 'Pupuk'
                              : slug === 'obat' || cname.includes('obat') ? 'Obat'
                              : (row.category_name || 'Semua');
                    const priceRibu = Math.round((Number(row.price) || 0) / 1000);
                    const originalRibuFromRow = Math.round((Number(row.original_price) || 0) / 1000);
                    let discountPct = Number(row.discount || 0);
                    let originalRibu = originalRibuFromRow || null;
                    if (!discountPct && originalRibuFromRow && originalRibuFromRow > priceRibu) {
                        discountPct = Math.round((1 - (priceRibu / originalRibuFromRow)) * 100);
                    }
                    if (!discountPct) {
                        const DEF = [12, 15, 19, 21, 27, 29, 33, 38];
                        const idx = Math.abs(parseInt(row.id, 10) || 0) % DEF.length;
                        discountPct = DEF[idx];
                    }
                    if (!originalRibu && discountPct > 0) {
                        const denom = 1 - (discountPct / 100);
                        if (denom > 0) originalRibu = Math.round(priceRibu / denom);
                    }
                    return {
                        _id: String(row.id),
                        name: row.name || 'Produk',
                        description: row.description || '',
                        image: img || '/placeholder.png',
                        category: cat,
                        price: priceRibu,
                        originalPrice: originalRibu,
                        discount: discountPct,
                        rating: Number(row.rating || 0),
                        reviewCount: Number(row.review_count || 0),
                        stock: row.stock || 0,
                        createdAt: row.created_at || null,
                        updatedAt: row.updated_at || null,
                    };
                });
                if (mounted) {
                    setDbProducts(items);
                }
            } catch (e) {
                console.error('Gagal mengambil produk dari API:', e);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        fetchProducts();
        return () => { mounted = false; };
    }, []);

    // Filter dan sort produk
    const filteredAndSortedProducts = useMemo(() => {
        const source = dbProducts || [];
        let filtered = source;
        
        // Filter berdasarkan kategori
        if (activeCategory !== 'Semua') {
            filtered = source.filter(product => 
                product.category.toLowerCase() === activeCategory.toLowerCase()
            );
        }

        // Sort berdasarkan pilihan
        const primaryCompare = (a, b) => {
            switch (sortBy) {
                case 'terbaru':
                    {
                        const tb = new Date(b.createdAt || b.created_at || 0).getTime();
                        const ta = new Date(a.createdAt || a.created_at || 0).getTime();
                        if (tb !== ta) return tb - ta;
                        return parseInt(b._id) - parseInt(a._id);
                    }
                case 'terlama':
                    {
                        const tb = new Date(b.createdAt || b.created_at || 0).getTime();
                        const ta = new Date(a.createdAt || a.created_at || 0).getTime();
                        if (ta !== tb) return ta - tb;
                        return parseInt(a._id) - parseInt(b._id);
                    }
                case 'termahal':
                    return b.price - a.price;
                case 'termurah':
                    return a.price - b.price;
                case 'huruf':
                    return a.name.localeCompare(b.name);
                case 'discount-high':
                    return (b.discount || 0) - (a.discount || 0);
                default:
                    return 0;
            }
        };

        let sorted;
        if (activeCategory === 'Semua') {
            const isObat = (p) => String(p.category).toLowerCase().includes('obat');
            const isPupuk = (p) => String(p.category).toLowerCase().includes('pupuk');
            const obats = filtered.filter(isObat).sort(primaryCompare);
            const pupuks = filtered.filter(isPupuk).sort(primaryCompare);
            const others = filtered.filter(p => !isObat(p) && !isPupuk(p)).sort(primaryCompare);
            sorted = [...obats, ...pupuks, ...others];
        } else {
            sorted = [...filtered].sort(primaryCompare);
        }

        return sorted;
    }, [activeCategory, sortBy, dbProducts]);

    const renderList = useMemo(() => {
        if (activeCategory !== 'Semua') return filteredAndSortedProducts;
        const isObat = (p) => String(p.category).toLowerCase().includes('obat');
        const isPupuk = (p) => String(p.category).toLowerCase().includes('pupuk');
        const obats = filteredAndSortedProducts.filter(isObat);
        const pupuks = filteredAndSortedProducts.filter(isPupuk);
        const others = filteredAndSortedProducts.filter(p => !isObat(p) && !isPupuk(p));
        return [...obats, ...pupuks, ...others];
    }, [filteredAndSortedProducts, activeCategory]);

    // Initialize quantities when products change
    useEffect(() => {
        if (filteredAndSortedProducts.length > 0) {
            initializeQuantities(filteredAndSortedProducts);
        }
    }, [filteredAndSortedProducts]);

    // Handle user rating change
    const handleRatingChange = (productId, newRating) => {
        console.log('Rating changed for product:', productId, 'New rating:', newRating);
        setUserRating(productId, newRating);
    };

    return (
        <div className="produk-display" id="produk-display">
            <div className="category-selection">
                <h2 className="category-title">Pilih Kategori</h2>
                <p className="category-subtitle">
                    Filter produk berdasarkan kategori yang kamu butuhkan.
                </p>
                <div className="category-buttons">
                    <button 
                        className={`category-button ${activeCategory === 'Semua' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('Semua')}
                    >
                        Semua
                    </button>
                    <button 
                        className={`category-button ${activeCategory === 'Pupuk' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('Pupuk')}
                    >
                        Pupuk
                    </button>
                    <button 
                        className={`category-button ${activeCategory === 'Obat' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('Obat')}
                    >
                        Obat
                    </button>
                </div>
            </div>

            {/* Section Produk Pilihan */}
            <div className="products-section">
                <div className="products-header">
                    <h3 className="products-title">Produk Pilihan</h3>
                    <div className="sort-controls">
                        <label htmlFor="sort-select">Urutkan:</label>
                        <select 
                            id="sort-select"
                            value={sortBy} 
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="sort-select"
                        >
                            <option value="terbaru">Terbaru</option>
                            <option value="terlama">Terlama</option>
                            <option value="termahal">Harga Tertinggi</option>
                            <option value="termurah">Harga Terendah</option>
                            <option value="huruf">A-Z</option>
                            <option value="discount-high">Diskon Terbesar</option>
                        </select>
                        <div className="view-controls">
                            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => handleViewModeChange('grid')} aria-label="Tampilan Grid">⊞</button>
                            <button className={`view-btn ${viewMode === 'carousel' ? 'active' : ''}`} onClick={() => handleViewModeChange('carousel')} aria-label="Tampilan Carousel">☰</button>
                        </div>
                    </div>
                </div>

                <div className="products-swiper-container" style={{display: viewMode === 'carousel' ? 'block' : 'none'}}>
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={20}
                        slidesPerView={2}
                        navigation={true}
                        pagination={{ clickable: true }}
                        breakpoints={{
                            480: {
                                slidesPerView: 2,
                                spaceBetween: 20,
                            },
                            640: {
                                slidesPerView: 3,
                                spaceBetween: 20,
                            },
                            768: {
                                slidesPerView: 4,
                                spaceBetween: 20,
                            },
                            1024: {
                                slidesPerView: 5,
                                spaceBetween: 20,
                            },
                        }}
                        className="products-swiper"
                    >
                        {isLoading ? (
                            // Show skeleton loading
                            Array.from({ length: 5 }).map((_, index) => (
                                <SwiperSlide key={`skeleton-${index}`}>
                                    <ProductSkeleton />
                                </SwiperSlide>
                            ))
                        ) : (
                            // Show actual products
                            renderList.map((product) => (
                            <SwiperSlide key={product._id}>
                                <div className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
                                    {Number(product.discount) > 0 && (
                                        <div className="discount-badge">
                                            -{product.discount}%
                                        </div>
                                    )}
                                    
                                    <div className="product-image">
                                        <img src={product.image} alt={product.name} />
                                        <div className="product-overlay">
                                            <button 
                                                className="quick-view-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/product/${product._id}`);
                                                }}
                                            >
                                                Lihat Detail
                                            </button>
                                        </div>
                                    </div>
                                    <div className="product-info">
                                        <h4 className="product-name">{product.name}</h4>
                                        <p className="product-description">{product.description}</p>
                                        
                                        {/* Rating Stars */}
                        <div className="product-rating" onClick={(e) => e.stopPropagation()}>
                            <CustomStars 
                                rating={getUserRating(product._id) || product.rating || 0} 
                                maxRating={5}
                                size="small"
                                showValue={false}
                                interactive={true}
                                onRatingChange={(newRating) => handleRatingChange(product._id, newRating)}
                                showEmptyStars={false}
                            />
                                            <span className="rating-text">
                                                {getUserRating(product._id) || product.rating ? 
                                                    `${(getUserRating(product._id) || product.rating).toFixed(1)} (${product.reviewCount || 0} ulasan)` :
                                                    'Belum ada rating'
                                                }
                                            </span>
                                        </div>
                                        
                                        <div className="product-price">
                                            <span className="price">Rp {(product.price * 1000).toLocaleString()}</span>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <span className="original-price">Rp {(product.originalPrice * 1000).toLocaleString()}</span>
                                            )}
                                        </div>
                                        <div className="product-actions">
                                            {isInCart(product._id) ? (
                                                <div className="cart-quantity-controls">
                                                    <button 
                                                        className="cart-control-btn minus"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFromCart(product._id);
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="cart-quantity">{getCartItemQuantity(product._id)}</span>
                                                    <button 
                                                        className="cart-control-btn plus"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(product._id);
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    className="add-to-cart-btn" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToCart(product._id);
                                                    }}
                                                >
                                                    <span className="btn-icon">🛒</span>
                                                    TAMBAHKAN KERANJANG
                                                </button>
                                            )}
                                            <button 
                                                className={`wishlist-btn ${wishlist[product._id] ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(product._id);
                                                }}
                                            >
                                                <svg className="wishlist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        )))}
                    </Swiper>
                </div>
                {viewMode === 'grid' && (
                    <div className="products-grid">
                        {isLoading ? (
                            Array.from({ length: 16 }).map((_, index) => (
                                <ProductSkeleton key={`skeleton-grid-${index}`} />
                            ))
                        ) : (
                            renderList.length === 0 ? (
                                <div className="products-empty">Belum ada produk dari database.</div>
                            ) : (
                            renderList.map((product) => (
                                <div key={product._id} className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
                                    {Number(product.discount) > 0 && (
                                        <div className="discount-badge">-{product.discount}%</div>
                                    )}
                                        <div className="product-image">
                                            <img src={product.image} alt={product.name} />
                                            <div className="product-overlay">
                                                <button className="quick-view-btn" onClick={(e) => { e.stopPropagation(); navigate(`/product/${product._id}`); }}>Lihat Detail</button>
                                            </div>
                                        </div>
                                        <div className="product-info">
                                            <h4 className="product-name">{product.name}</h4>
                                            <p className="product-description">{product.description}</p>
                                            <div className="product-rating" onClick={(e) => e.stopPropagation()}>
                                                <CustomStars rating={getUserRating(product._id) || product.rating || 0} maxRating={5} size="small" showValue={false} interactive={true} onRatingChange={(newRating) => handleRatingChange(product._id, newRating)} showEmptyStars={false} />
                                                <span className="rating-text">
                                                    {getUserRating(product._id) || product.rating ? `${(getUserRating(product._id) || product.rating).toFixed(1)} (${product.reviewCount || 0} ulasan)` : 'Belum ada rating'}
                                                </span>
                                            </div>
                                            <div className="product-price">
                                                <span className="price">Rp {(product.price * 1000).toLocaleString()}</span>
                                                {product.originalPrice && product.originalPrice > product.price && (
                                                    <span className="original-price">Rp {(product.originalPrice * 1000).toLocaleString()}</span>
                                                )}
                                            </div>
                                            <div className="product-actions">
                                                {isInCart(product._id) ? (
                                                    <div className="cart-quantity-controls">
                                                        <button className="cart-control-btn minus" onClick={(e) => { e.stopPropagation(); removeFromCart(product._id); }}>-</button>
                                                        <span className="cart-quantity">{getCartItemQuantity(product._id)}</span>
                                                        <button className="cart-control-btn plus" onClick={(e) => { e.stopPropagation(); addToCart(product._id); }}>+</button>
                                                    </div>
                                                ) : (
                                                    <button className="add-to-cart-btn" onClick={(e) => { e.stopPropagation(); handleAddToCart(product._id); }}>
                                                        <span className="btn-icon">🛒</span>
                                                        TAMBAHKAN KERANJANG
                                                    </button>
                                                )}
                                                <button className={`wishlist-btn ${wishlist[product._id] ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleWishlist(product._id); }}>
                                                    <svg className="wishlist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProdukDisplay;
