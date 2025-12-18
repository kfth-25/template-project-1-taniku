import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  // Debug: cek apakah assets dimuat
  console.log('Assets loaded:', {
    facebook_icon: assets.facebook_icon,
    instagram_icon: assets.instagram_icon,
    linkedin_icon: assets.linkedin_icon
  });
  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.logo} alt="" />
          <p>Taniku adalah platform pertanian digital yang menghubungkan petani lokal dengan konsumen secara langsung. Kami menyediakan produk pertanian segar berkualitas tinggi, mulai dari pupuk, obat tanaman, hingga hasil panen terbaik untuk kebutuhan Anda.</p>
          <div className="footer-social-icons">
            <a href="https://facebook.com/your_facebook_page" target="_blank" rel="noopener noreferrer" className="social-icon-link">
              {assets.facebook_icon ? (
                <img src={assets.facebook_icon} alt="Facebook" onError={(e) => console.log('Facebook icon failed to load')} />
              ) : (
                <div className="social-icon-fallback">FB</div>
              )}
            </a>
            <a href="https://instagram.com/your_instagram" target="_blank" rel="noopener noreferrer" className="social-icon-link">
              {assets.instagram_icon ? (
                <img src={assets.instagram_icon} alt="Instagram" onError={(e) => console.log('Instagram icon failed to load')} />
              ) : (
                <div className="social-icon-fallback">IG</div>
              )}
            </a>
            <a href="https://linkedin.com/company/your_company" target="_blank" rel="noopener noreferrer" className="social-icon-link">
              {assets.linkedin_icon ? (
                <img src={assets.linkedin_icon} alt="LinkedIn" onError={(e) => console.log('LinkedIn icon failed to load')} />
              ) : (
                <div className="social-icon-fallback">LI</div>
              )}
            </a>
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>Home</li>
            <li>Tentng kami</li>
            <li>Pesanan </li>
            <li>Privasi</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>
              <a href="https://wa.me/6283199364600" target="_blank" rel="noopener noreferrer">
                WhatsApp: +62 831-9936-4600
              </a>
            </li>
            <li>
              <a href="https://instagram.com/your_instagram" target="_blank" rel="noopener noreferrer">
                Instagram: @your_instagram
              </a>
            </li>
            <li>
              <a href="https://facebook.com/your_facebook_page" target="_blank" rel="noopener noreferrer">
                Facebook: your_facebook_page
              </a>
            </li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">Copyright 2024 © Taniku.com - All Right Reserved.</p>
    </div>
  )
}

export default Footer