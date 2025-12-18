import React, { useState, useEffect } from 'react'
import './QuickViewModal.css'

const QuickViewModal = ({ isOpen, onClose, product }) => {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change))
  }

  const productImages = product.images || [product.image]

  return (
    <div className="quick-view-overlay" onClick={handleOverlayClick}>
      <div className="quick-view-modal">
        <button className="close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="modal-content">
          <div className="product-images">
            <div className="main-image">
              <img 
                src={productImages[selectedImage]} 
                alt={product.name}
                className="main-product-image"
              />
              <div className="image-zoom-indicator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
            </div>
            
            {productImages.length > 1 && (
              <div className="thumbnail-images">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-details">
            <div className="product-header">
              <h2 className="product-title">{product.name}</h2>
              <div className="product-rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < (product.rating || 4) ? 'filled' : ''}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-text">({product.reviews || 24} reviews)</span>
              </div>
            </div>

            <div className="product-price">
              <span className="current-price">${product.price}</span>
              {product.originalPrice && (
                <span className="original-price">${product.originalPrice}</span>
              )}
              {product.discount && (
                <span className="discount-badge">-{product.discount}%</span>
              )}
            </div>

            <div className="product-description">
              <p>{product.description || "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, voluptatum."}</p>
            </div>

            <div className="product-options">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-display">{quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="product-actions">
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                TAMBAHKAN KERANJANG
              </button>
              <button className="wishlist-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Tambah ke Wishlist
              </button>
            </div>

            <div className="product-info">
              <div className="info-item">
                <strong>SKU:</strong> {product.sku || 'N/A'}
              </div>
              <div className="info-item">
                <strong>Category:</strong> {product.category || 'General'}
              </div>
              <div className="info-item">
                <strong>Availability:</strong> 
                <span className={`stock-status ${product.inStock !== false ? 'in-stock' : 'out-of-stock'}`}>
                  {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickViewModal