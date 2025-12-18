import React from 'react';
import './Header.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { assets } from '../../assets/assets';

const Header = () => {
  return (
    <div className='header'>
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="header-swiper"
      >
        <SwiperSlide>
          <div className="header-contents">
            <div className="header-left">
              <div className="badge">Koleksi Minggu Ini</div>
              <h2>
                <span className="title-top">Temukan Produk Unggulan&nbsp;dengan</span>
                <span className="title-bottom">Diskon Spesial</span>
              </h2>
              <div className="buttons">
                <button className="btn-primary">Belanja Sekarang</button>
                <button className="btn-secondary">Lihat Promo →</button>
              </div>
            </div>
            <div className="header-right">
              <img src={assets.header_img} alt="Produk Unggulan" />
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="header-contents">
            <div className="header-left">
              <div className="badge">Promo Terbatas</div>
              <h2>Hemat Hingga 50% untuk Semua Kategori</h2>
              <div className="buttons">
                <button className="btn-primary">Dapatkan Diskon</button>
                <button className="btn-secondary">Syarat & Ketentuan →</button>
              </div>
            </div>
            <div className="header-right">
              <img src={assets.header_2} alt="Promo Spesial" />
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  )
}

export default Header
