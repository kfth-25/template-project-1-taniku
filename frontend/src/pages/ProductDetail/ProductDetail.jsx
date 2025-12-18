import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import RatingStars from '../../components/RatingStars/RatingStars'
import RatingBreakdown from '../../components/RatingBreakdown/RatingBreakdown'
import { StoreContext } from '../../context/StoreContext'
import './ProductDetail.css'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, setUserRating, getUserRating, userRatings, products, fetchProducts } = useContext(StoreContext)
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [userRatingForm, setUserRatingState] = useState(0)
  const [userReview, setUserReview] = useState('')
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserRating, setCurrentUserRating] = useState(0)
  const [userHasWrittenReview, setUserHasWrittenReview] = useState(false)
  const loadStoredReviews = (pid) => {
    try {
      const raw = localStorage.getItem('productReviews') || '{}'
      const map = JSON.parse(raw)
      const arr = Array.isArray(map[pid]) ? map[pid] : []
      return arr
    } catch { return [] }
  }
  const saveStoredReviews = (pid, arr) => {
    try {
      const raw = localStorage.getItem('productReviews') || '{}'
      const map = JSON.parse(raw)
      map[pid] = arr
      localStorage.setItem('productReviews', JSON.stringify(map))
    } catch { /* ignore */ }
  }

  // Update current user rating when userRatings context changes
  useEffect(() => {
    if (product && product._id) {
      const rating = getUserRating(product._id);
      setCurrentUserRating(rating);
      // Selalu sinkronkan nilai form dengan rating dari context
      setUserRatingState(rating || 0);
    }
  }, [getUserRating, product, userRatings]);

  // Calculate total reviews: gabungkan jumlah ulasan tertulis + rating pengguna (jika ada)
  const calculateTotalReviews = () => {
    if (!product || !product._id) return 0;
    const userHasRating = userRatings[product._id] && userRatings[product._id] > 0;
    const base = reviews.length;
    return base + (userHasRating && !userHasWrittenReview ? 1 : 0);
  };

  // Calculate average rating including user ratings
  const calculateAverageRating = () => {
    if (!product || !product._id) return 0;
    let totalRating = 0;
    let totalCount = 0;
    reviews.forEach(review => {
      totalRating += review.rating;
      totalCount++;
    });
    const ratingFromUser = userRatings[product._id] || 0;
    if (ratingFromUser > 0 && !userHasWrittenReview) {
      totalRating += ratingFromUser;
      totalCount++;
    }
    const average = totalCount > 0 ? totalRating / totalCount : 0;
    return average;
  };

  // Calculate rating breakdown including user ratings
  const calculateRatingBreakdown = () => {
    if (!product || !product._id) return {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    const breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        breakdown[review.rating]++;
      }
    });
    const ratingFromUser = userRatings[product._id] || 0;
    if (ratingFromUser > 0 && !userHasWrittenReview) {
      const r = Math.round(ratingFromUser);
      if (r >= 1 && r <= 5) breakdown[r]++;
    }
    return breakdown;
  };

  // Update product rating data when reviews or userRatings change
  useEffect(() => {
    if (product && product._id) {
      const newTotalReviews = calculateTotalReviews();
      const newAverageRating = calculateAverageRating();
      const newRatingBreakdown = calculateRatingBreakdown();
      setProduct(prevProduct => ({
        ...prevProduct,
        rating: newAverageRating,
        totalReviews: newTotalReviews,
        ratingBreakdown: newRatingBreakdown
      }));
    }
  }, [reviews, userRatings, userHasWrittenReview]);

  // Fetch product data based on ID
  useEffect(() => {
    const fetchProduct = () => {
      setLoading(true)
      
      const foundProduct = (products || []).find(item => item._id === id)
      
      if (foundProduct) {
        // Transform the product data to match our component structure
        const transformedProduct = {
          id: foundProduct._id,
          _id: foundProduct._id, // Add _id for consistency
          name: foundProduct.name,
          price: foundProduct.price * 1000, // Convert to rupiah (assuming price is in thousands)
          originalPrice: foundProduct.originalPrice ? foundProduct.originalPrice * 1000 : null,
          discount: foundProduct.discount || 0,
          images: [
            foundProduct.image, // Main image
            foundProduct.image, // Duplicate for gallery
            foundProduct.image  // Duplicate for gallery
          ],
          description: foundProduct.description || "Deskripsi produk tidak tersedia",
          category: foundProduct.category || "Tidak dikategorikan",
          sku: `SKU${foundProduct._id.padStart(3, '0')}`,
          inStock: true,
          stock: foundProduct.stock || 80, // Use stock from product data or default to 80
          rating: 0, // Start with 0 rating
          totalReviews: 0, // Start with 0 reviews
          ratingBreakdown: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
          },
          specifications: {
            "Berat": "1 kg",
            "Jenis": foundProduct.category === 'pupuk' ? "Organik" : "Pestisida",
            "Kandungan": foundProduct.category === 'pupuk' ? "NPK 15-15-15" : "Bahan aktif sesuai standar",
            "pH": foundProduct.category === 'pupuk' ? "6.5-7.0" : "Netral",
            "Kemasan": "Plastik kedap udara"
          },
          benefits: foundProduct.category === 'pupuk' ? [
            "Meningkatkan kesuburan tanah",
            "Mempercepat pertumbuhan tanaman",
            "Ramah lingkungan",
            "Mudah diserap akar"
          ] : [
            "Efektif mengendalikan hama",
            "Aman untuk tanaman",
            "Tahan cuaca",
            "Hasil tahan lama"
          ]
        }
        
        setProduct(transformedProduct)
      } else {
        setProduct(null)
      }
      
      const pid = foundProduct?._id ? String(foundProduct._id) : null
      if (pid) {
        setReviews(loadStoredReviews(pid))
      } else {
        setReviews([])
      }
      setLoading(false)
    }

    if (id) {
      if (!products || products.length === 0) {
        fetchProducts()
      }
      fetchProduct()
    }
  }, [id, products, fetchProducts])

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 999)) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (product && product.inStock && quantity > 0) {
      addToCart(id, quantity)
      console.log(`Added ${quantity} of product ${id} to cart`)
      // Reset quantity to 0 after adding to cart
      setQuantity(0)
    }
  }

  const handleAddToWishlist = () => {
    if (product) {
      toggleWishlist(id)
      console.log(`Toggled wishlist for product ${id}`)
    }
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (userRatingForm > 0 && userReview.trim()) {
      const newReview = {
        id: reviews.length + 1,
        userName: "User", // In real app, get from auth
        rating: userRatingForm,
        date: new Date().toISOString().split('T')[0],
        comment: userReview,
        helpful: 0
      }
      const updatedReviews = [newReview, ...reviews]
      setReviews(updatedReviews)
      if (product && product._id) {
        saveStoredReviews(String(product._id), updatedReviews)
      }
      if (product && product._id) {
        setUserRating(product._id, userRatingForm)
        setCurrentUserRating(userRatingForm)
      }
      setUserHasWrittenReview(true)
      setUserRatingState(0)
      setUserReview('')
    }
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="product-detail-loading">
            <div className="product-detail-loading-spinner">
              <div className="product-detail-spinner"></div>
              <p>Memuat detail produk...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="product-detail-not-found">
            <h2>Produk tidak ditemukan</h2>
            <button onClick={() => navigate('/')} className="product-detail-back-home-btn">
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <div className="product-detail-breadcrumb">
          <span onClick={() => navigate('/')} className="product-detail-breadcrumb-link">Beranda</span>
          <span className="product-detail-breadcrumb-separator">/</span>
          <span onClick={() => navigate('/')} className="product-detail-breadcrumb-link">Produk</span>
          <span className="product-detail-breadcrumb-separator">/</span>
          <span className="product-detail-breadcrumb-current">{product.name}</span>
        </div>

        {/* Product Main Section */}
        <div className="product-detail-main">
          {/* Product Images */}
          <div className="product-detail-images">
            <div className="product-detail-main-image">
              <img 
                src={product.images[selectedImage]} 
                alt={product.name}
              />
              {product.discount && (
                <div className="product-detail-discount-badge">-{product.discount}%</div>
              )}
            </div>
            
            <div className="product-detail-thumbnails">
              {product.images.map((image, index) => (
                <div 
                  key={index}
                  className={`product-detail-thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-detail-info">
            <h1 className="product-detail-title">{product.name}</h1>
            
            <div className="product-detail-rating-section">
              <RatingStars 
                rating={currentUserRating || 0} 
                size="medium"
                interactive={true}
                onRatingChange={(newRating) => {
                  setUserRating(product._id, newRating);
                  setCurrentUserRating(newRating);
                  console.log(`Rating untuk produk ${product._id}: ${newRating}`);
                }}
              />
              <span className="product-detail-rating-text">
                {currentUserRating > 0 ? 
                  `Rating Anda: ${currentUserRating.toFixed(1)} | ` : ''
                }
                Rata-rata: {product.rating > 0 ? product.rating.toFixed(1) : '0.0'} ({product.totalReviews} ulasan)
              </span>
            </div>

            <div className="product-detail-price-section">
              <span className="product-detail-current-price">
                Rp {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="product-detail-original-price">
                  Rp {product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.discount && (
                <span className="product-detail-discount-percent">
                  -{product.discount}%
                </span>
              )}
            </div>

            <p className="product-detail-description">{product.description}</p>

            <div className="product-detail-meta">
              <div className="product-detail-meta-item">
                <span className="product-detail-meta-label">SKU:</span>
                <span className="product-detail-meta-value">{product.sku}</span>
              </div>
              <div className="product-detail-meta-item">
                <span className="product-detail-meta-label">Kategori:</span>
                <span className="product-detail-meta-value">{product.category}</span>
              </div>
              <div className="product-detail-meta-item">
                <span className="product-detail-meta-label">Stok:</span>
                <span className={`product-detail-meta-value ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                  {product.inStock ? `${product.stock} tersedia` : 'Habis'}
                </span>
              </div>
            </div>

            <div className="product-detail-actions">
              <div className="product-detail-quantity-section">
                <span className="product-detail-quantity-label">Jumlah:</span>
                <div className="product-detail-quantity-controls">
                  <button 
                    className="product-detail-quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={quantity} 
                    readOnly 
                    className="product-detail-quantity-display"
                  />
                  <button 
                    className="product-detail-quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="product-detail-action-buttons">
                <button 
                  className="product-detail-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  Tambah ke Keranjang
                </button>
                <button 
                  className="product-detail-wishlist-btn"
                  onClick={handleAddToWishlist}
                >
                  <svg className="product-detail-wishlist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="product-detail-tabs">
          <div className="product-detail-tab-buttons">
            <button 
              className={`product-detail-tab-button ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Deskripsi
            </button>
            <button 
              className={`product-detail-tab-button ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              Spesifikasi
            </button>
            <button 
              className={`product-detail-tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Ulasan ({product.totalReviews})
            </button>
          </div>

          <div className="product-detail-tab-content">
            {activeTab === 'description' && (
              <div className="product-detail-description-content">
                <h3>Deskripsi Produk</h3>
                <p>{product.description}</p>
                
                <h4>Manfaat:</h4>
                <ul className="product-detail-benefits-list">
                  {product.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="product-detail-specifications-content">
                <h3>Spesifikasi Produk</h3>
                <table className="product-detail-specifications-table">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="product-detail-reviews-content">
                <h3>Ulasan Pelanggan</h3>
                
                {/* Rating Breakdown */}
                <RatingBreakdown 
                  averageRating={product.rating}
                  totalReviews={product.totalReviews}
                  ratings={product.ratingBreakdown}
                />

                {/* Review Form */}
                <div className="product-detail-review-form">
                  <h4>Tulis Ulasan</h4>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="product-detail-form-group">
                      <label className="product-detail-form-label">Rating:</label>
                      <RatingStars 
                        rating={userRatingForm}
                        size="medium"
                        interactive={true}
                        onRatingChange={(newRating) => {
                          setUserRatingState(newRating)
                          if (product && product._id) {
                            setUserRating(product._id, newRating)
                            setCurrentUserRating(newRating)
                          }
                        }}
                      />
                    </div>
                    <div className="product-detail-form-group">
                      <label className="product-detail-form-label">Ulasan:</label>
                      <textarea 
                        className="product-detail-form-textarea"
                        value={userReview}
                        onChange={(e) => setUserReview(e.target.value)}
                        placeholder="Tulis ulasan Anda tentang produk ini..."
                        required
                      />
                    </div>
                    <button type="submit" className="product-detail-submit-review">
                      Kirim Ulasan
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="product-detail-reviews-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="product-detail-review-item">
                      <div className="product-detail-review-header">
                        <div className="product-detail-reviewer-info">
                          <h5>{review.userName}</h5>
                          <span className="product-detail-review-date">{review.date}</span>
                        </div>
                        <RatingStars 
                          rating={review.rating}
                          size="small"
                          interactive={false}
                        />
                      </div>
                      <div className="product-detail-review-content">
                        <p>{review.comment}</p>
                      </div>
                      <div className="product-detail-review-actions">
                        <button className="product-detail-helpful-btn">
                          👍 Membantu ({review.helpful})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
