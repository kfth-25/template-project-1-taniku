import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Logo Animation */}
        <div className="logo-container">
          <div className="logo-text">
            <span className="logo-letter">T</span>
            <span className="logo-letter">a</span>
            <span className="logo-letter">n</span>
            <span className="logo-letter">i</span>
            <span className="logo-letter">k</span>
            <span className="logo-letter">u</span>
          </div>
          <div className="logo-underline"></div>
        </div>

        {/* Loading Animation */}
        <div className="loading-animation">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <p className="loading-text">Memuat aplikasi...</p>
        </div>

        {/* Decorative Elements */}
        <div className="decorative-elements">
          {/* Text Elements */}
          <div className="text-element text-1">LOADING</div>
          <div className="text-element text-2">PLEASE WAIT</div>
          <div className="text-element text-3">TANIKU</div>
          <div className="text-element text-4">SYSTEM</div>
          <div className="text-element text-5">READY</div>
          <div className="text-element text-6">MODERN</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;