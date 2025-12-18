import React from 'react'
import RatingStars from '../RatingStars/RatingStars'
import './RatingBreakdown.css'

const RatingBreakdown = ({ 
  ratings = {},
  totalReviews = 0,
  averageRating = 0,
  showPercentages = true,
  showCounts = true,
  maxStars = 5,
  compact = false
}) => {
  // Calculate rating distribution
  const getRatingData = () => {
    const data = []
    for (let i = maxStars; i >= 1; i--) {
      const count = ratings[i] || 0
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
      data.push({
        stars: i,
        count,
        percentage: Math.round(percentage * 10) / 10
      })
    }
    return data
  }

  const ratingData = getRatingData()

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (totalReviews === 0) {
    return (
      <div className={`rating-breakdown ${compact ? 'compact' : ''}`}>
        <div className="no-ratings">
          <div className="no-ratings-icon">⭐</div>
          <h3>Belum ada rating</h3>
          <p>Jadilah yang pertama memberikan rating untuk produk ini!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rating-breakdown ${compact ? 'compact' : ''}`}>
      <div className="rating-summary">
        <div className="average-rating">
          <span className="rating-number">{averageRating.toFixed(1)}</span>
          <div className="rating-stars-display">
            <RatingStars 
              rating={averageRating} 
              size={compact ? 'medium' : 'large'}
              interactive={false}
            />
          </div>
        </div>
        <div className="total-reviews">
          <span className="review-count">{formatNumber(totalReviews)}</span>
          <span className="review-text">
            {totalReviews === 1 ? 'ulasan' : 'ulasan'}
          </span>
        </div>
      </div>

      <div className="rating-distribution">
        {ratingData.map(({ stars, count, percentage }) => (
          <div key={stars} className="rating-row">
            <div className="rating-label">
              <span className="star-count">{stars}</span>
              <svg className="star-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            
            <div className="rating-stats">
              {showPercentages && (
                <span className="percentage">{percentage}%</span>
              )}
              {showCounts && (
                <span className="count">({formatNumber(count)})</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="rating-insights">
          <div className="insight-item">
            <span className="insight-label">Rating tertinggi:</span>
            <span className="insight-value">
              {ratingData.find(r => r.count > 0)?.stars || 0} bintang
            </span>
          </div>
          <div className="insight-item">
            <span className="insight-label">Kepuasan pelanggan:</span>
            <span className={`insight-value ${averageRating >= 4 ? 'positive' : averageRating >= 3 ? 'neutral' : 'negative'}`}>
              {averageRating >= 4.5 ? 'Sangat Tinggi' : 
               averageRating >= 4 ? 'Tinggi' : 
               averageRating >= 3 ? 'Sedang' : 
               averageRating >= 2 ? 'Rendah' : 'Sangat Rendah'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RatingBreakdown