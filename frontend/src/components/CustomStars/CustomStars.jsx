import React, { useState } from 'react'
import './CustomStars.css'

const CustomStars = ({ 
  rating = 0, 
  maxRating = 5, 
  size = 'medium', 
  interactive = false, 
  onRatingChange,
  showValue = false,
  showEmptyStars = true // New prop to control empty star display
}) => {
  const [hoverRating, setHoverRating] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'custom-stars-small'
      case 'large': return 'custom-stars-large'
      default: return 'custom-stars-medium'
    }
  }

  const handleStarClick = (starValue) => {
    if (interactive && onRatingChange) {
      console.log('Star clicked:', starValue) // Debug log
      onRatingChange(starValue)
      
      // Show visual feedback
      setShowFeedback(true)
      setTimeout(() => {
        setShowFeedback(false)
      }, 2000)
    }
  }

  const handleStarHover = (starValue) => {
    if (interactive) {
      setHoverRating(starValue)
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setIsHovering(false)
      setHoverRating(0)
    }
  }

  const currentRating = isHovering ? hoverRating : rating

  // Show placeholder text when no rating and not interactive
  if (rating === 0 && !interactive && !showEmptyStars) {
    return (
      <div className={`custom-stars ${getSizeClass()}`}>
        <span className="no-rating-text">Belum ada rating</span>
      </div>
    )
  }

  // Create simple star using CSS
  const StarIcon = ({ filled, index }) => (
    <div
      className={`custom-star ${filled ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
      onClick={() => handleStarClick(index + 1)}
      onMouseEnter={() => handleStarHover(index + 1)}
    >
      ★
    </div>
  )

  return (
    <div className={`custom-stars ${getSizeClass()}`}>
      <div 
        className="custom-stars-container"
        onMouseLeave={handleMouseLeave}
      >
        {[...Array(maxRating)].map((_, index) => (
          <StarIcon
            key={index}
            filled={index < currentRating}
            index={index}
          />
        ))}
        
        {/* Feedback tooltip */}
        {showFeedback && (
          <div className="custom-rating-feedback">
            Rating tersimpan!
          </div>
        )}
      </div>
      
      {showValue && (
        <span className="custom-rating-value">
          {currentRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default CustomStars
