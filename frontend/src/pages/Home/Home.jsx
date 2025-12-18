import React, { useEffect, useState } from 'react'
import './home.css'
import Header from '../../components/Header/Header'
import ProdukDisplay from '../../components/ProdukDisplay/ProdukDisplay'

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`home-container ${isVisible ? 'fade-in' : ''}`}>
      <div className="home-header">
        <Header />
      </div>
      <div className="home-products">
        <ProdukDisplay />
      </div>
    </div>
  )
}


export default Home
