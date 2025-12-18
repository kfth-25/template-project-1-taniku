import React, { useState } from 'react'
import './RatingStars.css'

const RatingStars = ({ 
  rating = 0, 
  maxRating = 5, 
  size = 'medium', 
  interactive = false, 
  onRatingChange,
  showValue = false,
  precision = 1 
}) => {
  const [hoverRating, setHoverRating] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleStarClick = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue)
      
      // Show visual feedback
      setIsSubmitted(true)
      setShowFeedback(true)
      
      // Reset feedback after animation
      setTimeout(() => {
        setIsSubmitted(false)
      }, 600)
      
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

  const getStarFillPercentage = (starIndex) => {
    const currentRating = isHovering ? hoverRating : rating
    const starValue = starIndex + 1
    
    if (currentRating >= starValue) {
      return 100
    } else if (currentRating > starIndex) {
      return (currentRating - starIndex) * 100
    }
    return 0
  }

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'stars-small'
      case 'large': return 'stars-large'
      case 'xlarge': return 'stars-xlarge'
      default: return 'stars-medium'
    }
  }

  return (
    <div className={`rating-stars ${getSizeClass()} ${interactive ? 'interactive' : ''} ${isSubmitted ? 'rating-submitted' : ''}`}>
      <div 
        className="stars-container"
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative' }}
      >
        {[...Array(maxRating)].map((_, index) => (
          <div
            key={index}
            className="star-wrapper"
            onClick={() => handleStarClick(index + 1)}
            onMouseEnter={() => handleStarHover(index + 1)}
          >
            <div className="star-background">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div 
              className="star-fill"
              style={{ width: `${getStarFillPercentage(index)}%` }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        ))}
        
        {/* Feedback tooltip */}
        <div className={`rating-feedback ${showFeedback ? 'show' : ''}`}>
          Rating tersimpan!
        </div>
      </div>
      
      {showValue && (
        <span className="rating-value">
          {(isHovering ? hoverRating : rating).toFixed(precision === 1 ? 0 : 1)}
        </span>
      )}
    </div>
  )
}

export default RatingStars