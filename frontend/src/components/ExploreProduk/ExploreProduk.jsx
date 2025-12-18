import React from 'react'
import './ExploreProduk.css'
import { produk_list } from '../../assets/assets'

const ExploreProduk = ({category, setCategory}) => {
  return (
    <div className='explore-produk' id='explore-produk'>
      <h1 className="section-title">🌿 Jelajahi Produk Kami</h1>
      <p className='section-subtitle'>
        Temukan berbagai produk berkualitas tinggi untuk kebutuhan pertanian dan perawatan tanaman Anda. 
        Dari pupuk organik hingga obat tanaman terpercaya.
      </p>
      <div className="explore-produk-list">
        {produk_list.map((item, index) => {
          return (
            <div 
              onClick={() => setCategory(prev => prev === item.produk_name ? "All" : item.produk_name)} 
              key={index} 
              className={`explore-produk-list-item ${category === item.produk_name ? "active-category" : ""}`}
            >
              <img src={item.produk_image} alt={item.produk_name} />
              <span className="category-name">{item.produk_name}</span>
            </div>
          )
        })}
      </div> 
    </div>
  )
}

export default ExploreProduk
