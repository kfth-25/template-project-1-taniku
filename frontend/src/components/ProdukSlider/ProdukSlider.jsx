import React, { useState, useEffect } from 'react'
import './ProdukSlider.css'

const ProdukSlider = ({ products = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && products.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % products.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isAutoPlaying, products.length])

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % products.length)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + products.length) % products.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  if (!products || products.length === 0) {
    return (
      <div className="produk-slider">
        <div className="slider-placeholder">
          <h3>No products available</h3>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="produk-slider"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="slider-container">
        <div 
          className="slider-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {products.map((product, index) => (
            <div key={index} className="slide">
              <div className="slide-content">
                <div className="slide-image">
                  <img src={product.image} alt={product.name} />
                  <div className="slide-overlay">
                    <button className="view-product-btn">View Product</button>
                  </div>
                </div>
                <div className="slide-info">
                  <h3>{product.name}</h3>
                  <p className="slide-description">{product.description}</p>
                  <div className="slide-price">
                    <span className="current-price">${product.price}</span>
                    {product.originalPrice && (
                      <span className="original-price">${product.originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button className="slider-nav prev" onClick={prevSlide}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <button className="slider-nav next" onClick={nextSlide}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="slider-dots">
          {products.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProdukSlider