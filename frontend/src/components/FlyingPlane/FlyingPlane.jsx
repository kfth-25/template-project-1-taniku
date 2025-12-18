import React from 'react';
import './FlyingPlane.css';

const FlyingPlane = ({ 
  size = 40, 
  color = '#2E7D32', 
  duration = 8, 
  delay = 0,
  className = '' 
}) => {
  return (
    <div 
      className={`flying-plane-container ${className}`}
      style={{
        '--plane-size': `${size}px`,
        '--flight-duration': `${duration}s`,
        '--flight-delay': `${delay}s`
      }}
    >
      <div className="flying-plane">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="plane-svg"
        >
          {/* Pesawat SVG */}
          <g className="plane-body">
            {/* Badan pesawat */}
            <ellipse cx="50" cy="50" rx="35" ry="8" fill={color} opacity="0.9"/>
            
            {/* Sayap utama */}
            <ellipse cx="45" cy="50" rx="25" ry="15" fill={color} opacity="0.8"/>
            
            {/* Sayap belakang */}
            <ellipse cx="25" cy="50" rx="8" ry="12" fill={color} opacity="0.7"/>
            
            {/* Ekor pesawat */}
            <path 
              d="M15 50 L8 45 L8 55 Z" 
              fill={color} 
              opacity="0.8"
            />
            
            {/* Detail jendela */}
            <circle cx="55" cy="50" r="3" fill="rgba(255,255,255,0.8)"/>
            <circle cx="65" cy="50" r="2" fill="rgba(255,255,255,0.6)"/>
            <circle cx="72" cy="50" r="1.5" fill="rgba(255,255,255,0.4)"/>
            
            {/* Propeller */}
            <g className="propeller">
              <line x1="85" y1="50" x2="92" y2="50" stroke={color} strokeWidth="2"/>
              <line x1="88.5" y1="47" x2="88.5" y2="53" stroke={color} strokeWidth="1.5"/>
            </g>
          </g>
          
          {/* Jejak awan */}
          <g className="cloud-trail" opacity="0.4">
            <circle cx="10" cy="48" r="2" fill="#87CEEB"/>
            <circle cx="5" cy="52" r="1.5" fill="#87CEEB"/>
            <circle cx="15" cy="52" r="1" fill="#87CEEB"/>
          </g>
        </svg>
        
        {/* Efek sparkle */}
        <div className="sparkle sparkle-1"></div>
        <div className="sparkle sparkle-2"></div>
        <div className="sparkle sparkle-3"></div>
      </div>
    </div>
  );
};

export default FlyingPlane;