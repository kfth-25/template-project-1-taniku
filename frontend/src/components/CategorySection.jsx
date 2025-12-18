import React from 'react'
import './CategorySection.css'

const CategorySection = ({ category, setCategory }) => {
  const handleCategoryClick = (selectedCategory) => {
    setCategory(selectedCategory)
  }

  return (
    <div className="category-section">
      <div className="category-content">
        <h2 className="category-title">🌱 Kategori Produk</h2>
        <p className="category-subtitle">
          Temukan produk terbaik untuk kebutuhan pertanian dan perawatan tanaman Anda.
        </p>
        <div className="category-buttons">
          <button 
            className={`category-btn ${category === "All" ? "active" : ""}`}
            onClick={() => handleCategoryClick("All")}
          >
            <span className="category-icon">🌿</span>
            Semua Produk
          </button>
          <button 
            className={`category-btn ${category === "pupuk" ? "active" : ""}`}
            onClick={() => handleCategoryClick("pupuk")}
          >
            <span className="category-icon">🌱</span>
            Pupuk
          </button>
          <button 
            className={`category-btn ${category === "obat" ? "active" : ""}`}
            onClick={() => handleCategoryClick("obat")}
          >
            <span className="category-icon">🛡️</span>
            Obat Tanaman
          </button>
        </div>
      </div>
    </div>
  )
}

export default CategorySection