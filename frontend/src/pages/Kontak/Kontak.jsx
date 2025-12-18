import React, { useState } from "react";
import "./Kontak.css";
import instagramIcon from "../../assets/instagram.png";
import facebookIcon from "../../assets/facebook_icon.png";

export default function Kontak() {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const rawNumber = "6283199364600"; // for wa.me
  const displayNumber = "+62 831-9936-4600";
  const companyEmail = "info@taniku.com";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Gagal menyalin nomor:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');

    // Simulasi pengiriman form (dalam implementasi nyata, kirim ke backend)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kontak-container">
      <section className="kontak-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" className="hero-badge-icon">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Layanan Pelanggan Profesional
          </div>
          <h1>Hubungi Kami</h1>
          <p>Tim customer service profesional kami siap memberikan pelayanan terbaik untuk Anda. Kami berkomitmen memberikan respon cepat dan solusi yang tepat untuk setiap kebutuhan Anda.</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Layanan</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">&lt;1h</span>
              <span className="stat-label">Respon Time</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">Kepuasan</span>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider">
        <div className="divider-line"></div>
        <div className="divider-content">
          <h2 className="section-title">Informasi Kontak Perusahaan</h2>
          <p className="section-subtitle">Hubungi kami melalui berbagai channel yang tersedia</p>
        </div>
        <div className="divider-line"></div>
      </div>

      <div className="kontak-main-grid">
        {/* Informasi Perusahaan */}
        <div className="kontak-info-section">
          <div className="card glass">
            <div className="card-header">
              <h2>Informasi Perusahaan</h2>
              <span className="badge">PT. Taniku Indonesia</span>
            </div>
            <div className="card-body">
              <div className="info-item">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div className="info-content">
                  <h4>Alamat Kantor</h4>
                  <p>Jl. Sidomulya <br/> indramayu 12345<br/>Indonesia</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="info-content">
                  <h4>Email</h4>
                  <p><a href={`mailto:${companyEmail}`}>{companyEmail}</a></p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8 13.5l4-2.5 4 2.5V16H8v-2.5z"/>
                  </svg>
                </div>
                <div className="info-content">
                  <h4>Jam Operasional</h4>
                  <p>Senin - Jumat: 08:00 - 17:00 WIB<br/>Sabtu: 08:00 - 15:00 WIB<br/>Minggu: Tutup</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card glass">
            <div className="card-header">
              <h2>Kontak Langsung</h2>
              <span className="badge">Respon cepat via WhatsApp</span>
            </div>
            <div className="card-body">
              <div className="actions">
                <a
                  className="btn btn-wa"
                  href={`https://wa.me/${rawNumber}?text=Halo%20Tim%20Taniku,%20saya%20butuh%20bantuan.`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="btn-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.52 3.48A11.87 11.87 0 0 0 12.01 0C5.4 0 .04 5.36.04 11.97c0 2.1.57 4.15 1.66 5.95L0 24l6.23-1.64a11.95 11.95 0 0 0 5.77 1.49h.01c6.61 0 11.97-5.36 11.97-11.97 0-3.2-1.25-6.21-3.46-8.4ZM12 21.83h-.01a9.86 9.86 0 0 1-5.02-1.38l-.36-.21-3.7.98 1-3.61-.24-.37a9.77 9.77 0 0 1-1.5-5.16c0-5.41 4.41-9.82 9.84-9.82 2.62 0 5.08 1.02 6.93 2.87a9.8 9.8 0 0 1 2.89 6.94c0 5.42-4.41 9.86-9.83 9.86Zm5.41-7.35c-.29-.15-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.93-.91 1.12-.17.19-.34.21-.63.07-.29-.15-1.21-.45-2.3-1.44-.85-.75-1.43-1.67-1.6-1.96-.17-.29-.02-.45.12-.6.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.03-.51-.08-.15-.64-1.54-.88-2.11-.23-.55-.46-.48-.64-.49-.17-.01-.36-.01-.55-.01-.19 0-.5.07-.77.36-.26.29-1.01.98-1.01 2.38 0 1.39 1.04 2.74 1.19 2.93.15.19 2.05 3.14 4.96 4.4.69.3 1.22.48 1.64.61.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.34.24-.65.24-1.21.17-1.34-.07-.13-.26-.21-.55-.36Z"></path>
                    </svg>
                  </span>
                  Buka WhatsApp
                </a>
                <button
                  type="button"
                  className={`btn btn-outline ${copied ? "btn-copied" : ""}`}
                  onClick={handleCopy}
                >
                  {copied ? "Disalin!" : "Salin Nomor"}
                </button>
              </div>
              <div className="number">Nomor: {displayNumber}</div>
            </div>
          </div>

          <div className="card glass">
            <div className="card-header">
              <h2>Media Sosial</h2>
              <span className="badge">Ikuti update terbaru kami</span>
            </div>
            <div className="card-body">
              <ul className="social-list">
                <li>
                  <a href="https://instagram.com/taniku" target="_blank" rel="noreferrer" aria-label="Instagram Taniku">
                    <img src={instagramIcon} alt="Instagram" className="social-icon-img" />
                    <div>
                      <span className="social-name">Instagram</span>
                      <span className="social-handle">@taniku</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://facebook.com/taniku" target="_blank" rel="noreferrer" aria-label="Facebook Taniku">
                    <img src={facebookIcon} alt="Facebook" className="social-icon-img" />
                    <div>
                      <span className="social-name">Facebook</span>
                      <span className="social-handle">Taniku Indonesia</span>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="card glass">
            <div className="card-header">
              <h2>Lokasi Kami</h2>
              <span className="badge">Kunjungi kantor kami</span>
            </div>
            <div className="card-body">
              <div className="map-container">
                <div className="map-wrapper">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.123456789!2d108.495003!3d-6.5304!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f1e123456789%3A0x123456789abcdef!2sMasjid%20Sidomulya%2FKrutug!5e0!3m2!1sen!2sid!4v1635123456789!5m2!1sen!2sid"
                    width="100%"
                    height="350"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Lokasi Kantor Taniku - Sidomulya"
                  ></iframe>
                  <div className="map-overlay">
                    <div className="map-badge">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="map-badge-icon">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Kantor Pusat
                    </div>
                  </div>
                </div>
                <div className="map-info">
                  <div className="map-details">
                    <div className="map-detail-item">
                      <div className="map-detail-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      </div>
                      <div className="map-detail-content">
                        <h5>Alamat Lengkap</h5>
                        <p>Sidomulya, Kec. Sidomulya<br/>Kabupaten indramayu <br/>Provinsi Jawa barat, Indonesia</p>
                      </div>
                    </div>
                    <div className="map-detail-item">
                      <div className="map-detail-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div className="map-detail-content">
                        <h5>Status Operasional</h5>
                        <p>Buka 24 Jam<br/>Senin - Minggu</p>
                      </div>
                    </div>
                  </div>
                  <div className="map-actions">
                    <a 
                      href="https://maps.app.goo.gl/Khmst6SSx3FqZAH2A?g_st=aw"
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary map-directions-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Buka di Google Maps
                    </a>
                    <button 
                      className="btn btn-outline share-location-btn"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Lokasi Kantor Taniku',
                            text: 'Kunjungi kantor kami di Sidomulya',
                            url: 'https://maps.app.goo.gl/Khmst6SSx3FqZAH2A?g_st=aw'
                          });
                        } else {
                          navigator.clipboard.writeText('https://maps.app.goo.gl/Khmst6SSx3FqZAH2A?g_st=aw');
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                      </svg>
                      Bagikan Lokasi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Kontak */}
        <div className="kontak-form-section">
          <div className="form-section-header">
            <h3 className="form-section-title">Formulir Kontak Resmi</h3>
            <p className="form-section-subtitle">Silakan isi formulir di bawah ini untuk menghubungi tim kami</p>
          </div>
          
          {/* Contact Form Card */}
          <div className="card glass">
            <div className="card-header">
              <h2>Kirim Pesan</h2>
              <span className="badge">Form Kontak</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Nama Lengkap *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subjek *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Pilih subjek pesan</option>
                    <option value="pertanyaan-produk">Pertanyaan Produk</option>
                    <option value="keluhan">Keluhan</option>
                    <option value="saran">Saran</option>
                    <option value="kerjasama">Kerjasama</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Pesan *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    placeholder="Tulis pesan Anda di sini..."
                  ></textarea>
                </div>

                {submitStatus === 'success' && (
                  <div className="form-status success">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Pesan berhasil dikirim! Kami akan segera merespon.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="form-status error">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Terjadi kesalahan. Silakan coba lagi.
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Pesan'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="card glass">
            <div className="card-header">
              <h2>Pertanyaan Umum</h2>
              <span className="badge">FAQ</span>
            </div>
            <div className="card-body">
              <div className="faq-list">
                <div className="faq-item">
                  <h4>Bagaimana cara memesan produk?</h4>
                  <p>Anda dapat memesan produk melalui website kami atau menghubungi customer service via WhatsApp.</p>
                </div>
                <div className="faq-item">
                  <h4>Berapa lama waktu pengiriman?</h4>
                  <p>Waktu pengiriman bervariasi tergantung lokasi, umumnya 2-5 hari kerja untuk area Jabodetabek.</p>
                </div>
                <div className="faq-item">
                  <h4>Apakah ada garansi produk?</h4>
                  <p>Ya, semua produk kami memiliki garansi sesuai dengan ketentuan yang berlaku.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}