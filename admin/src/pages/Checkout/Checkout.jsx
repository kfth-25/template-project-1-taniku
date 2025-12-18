import React, { useState } from 'react'
import './Checkout.css'
import { assets } from '../../assets/assets'

const Checkout = () => {
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const [address, setAddress] = useState({ line1: '', city: '', province: '', postalCode: '' })
  const [shippingMethod, setShippingMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost'
  const envBase = import.meta.env.VITE_API_BASE
  const fallbackBase = `http://${host}:5176`
  const API_BASE = (() => {
    try {
      if (typeof envBase === 'string' && envBase.trim().length > 0) {
        const u = new URL(envBase)
        if (['5173','5174','5175','5177'].includes(u.port)) {
          return fallbackBase
        }
        return envBase
      }
      return fallbackBase
    } catch {
      return fallbackBase
    }
  })()
  const ORDERS_ENDPOINT = `${API_BASE}/api/orders.php`

  const validate = () => {
    const e = {}
    if (!customer.name.trim()) e.name = 'Nama wajib diisi'
    if (!customer.phone.trim()) e.phone = 'No. HP wajib diisi'
    if (!address.line1.trim()) e.line1 = 'Alamat wajib diisi'
    if (!address.city.trim()) e.city = 'Kota wajib diisi'
    if (!address.province.trim()) e.province = 'Provinsi wajib diisi'
    if (!address.postalCode.trim()) e.postalCode = 'Kode pos wajib diisi'
    if (!shippingMethod) e.shippingMethod = 'Pilih metode pengiriman'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    if (!validate()) return
    try {
      setIsSubmitting(true)
      const stored = (() => {
        try {
          const a = localStorage.getItem('checkout_items')
          if (a) return JSON.parse(a)
        } catch (err) { void err }
        try {
          const b = localStorage.getItem('cart_items')
          if (b) return JSON.parse(b)
        } catch (err) { void err }
        return []
      })()

      const items = Array.isArray(stored) ? stored
        .map(it => ({ product_id: Number(it.product_id || it.id || 0), quantity: Number(it.quantity || it.qty || 1) }))
        .filter(it => it.product_id > 0 && it.quantity > 0)
        : []

      if (items.length === 0) {
        alert('Keranjang kosong. Tambahkan item ke checkout terlebih dahulu.')
        return
      }

      const shipping_address = [address.line1, address.city, address.province, address.postalCode]
        .filter(Boolean)
        .join(', ')

      const metaNote = [notes, shippingMethod ? `(Pengiriman: ${shippingMethod})` : '']
        .filter(Boolean)
        .join(' ')

      const body = {
        customer_name: customer.name,
        customer_email: customer.email || `${customer.phone || 'noemail'}@example.com`,
        customer_phone: customer.phone,
        shipping_address: metaNote ? `${shipping_address} — ${metaNote}` : shipping_address,
        shipping_method: shippingMethod || null,
        shipping_cost: 0,
        discount: 0,
        items
      }

      const res = await fetch(ORDERS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const ct = res.headers.get('content-type') || ''
      const data = ct.includes('application/json') ? await res.json() : null
      if (!res.ok || !(data && data.ok)) {
        const msg = (data && data.error) ? data.error : `Gagal checkout (${res.status})`
        alert(msg)
        return
      }

      setSuccess(`Checkout berhasil. Kode: ${data.order_code}`)
      try { localStorage.removeItem('checkout_items') } catch (err) { void err }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="checkout-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-text">
              <h1>Checkout</h1>
              <p>Pengisian data setelah checkout produk</p>
            </div>
            <div className="header-icon"><img src={assets.wallet_icon} alt="" /></div>
          </div>
          <div className="header-actions">
            <a className="btn btn-secondary" href="/products">
              <img src={assets.trash_icon} alt="" />
              Batal
            </a>
            <button className="btn btn-primary" form="checkout-form" type="submit" disabled={isSubmitting}>
              <img src={assets.save_icon} alt="" />
              {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Checkout'}
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <form id="checkout-form" className="checkout-grid" onSubmit={onSubmit}>
          <div className="grid-left">
            <div className="form-card">
              <div className="card-header">
                <div className="card-icon"><img src={assets.profil_icon} alt="" /></div>
                <div className="card-title">
                  <h3>Data Pelanggan</h3>
                  <p>Lengkapi informasi pelanggan</p>
                </div>
              </div>
              <div className="card-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nama</label>
                    <input className={errors.name ? 'error' : ''} value={customer.name} onChange={e=>setCustomer(v=>({...v,name:e.target.value}))} placeholder="Nama lengkap" />
                    {errors.name && <div className="error-text">{errors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label>No. HP</label>
                    <input className={errors.phone ? 'error' : ''} value={customer.phone} onChange={e=>setCustomer(v=>({...v,phone:e.target.value}))} placeholder="08xxxxxxxxxx" />
                    {errors.phone && <div className="error-text">{errors.phone}</div>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input value={customer.email} onChange={e=>setCustomer(v=>({...v,email:e.target.value}))} placeholder="email@contoh.com" />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">
                <div className="card-icon"><img src={assets.dikirim_icon} alt="" /></div>
                <div className="card-title">
                  <h3>Alamat Pengiriman</h3>
                  <p>Detail lokasi tujuan</p>
                </div>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label>Alamat</label>
                  <input className={errors.line1 ? 'error' : ''} value={address.line1} onChange={e=>setAddress(v=>({...v,line1:e.target.value}))} placeholder="Nama jalan, nomor rumah, RT/RW" />
                  {errors.line1 && <div className="error-text">{errors.line1}</div>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Kota</label>
                    <input className={errors.city ? 'error' : ''} value={address.city} onChange={e=>setAddress(v=>({...v,city:e.target.value}))} placeholder="Kota/Kabupaten" />
                    {errors.city && <div className="error-text">{errors.city}</div>}
                  </div>
                  <div className="form-group">
                    <label>Provinsi</label>
                    <input className={errors.province ? 'error' : ''} value={address.province} onChange={e=>setAddress(v=>({...v,province:e.target.value}))} placeholder="Provinsi" />
                    {errors.province && <div className="error-text">{errors.province}</div>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Kode Pos</label>
                    <input className={errors.postalCode ? 'error' : ''} value={address.postalCode} onChange={e=>setAddress(v=>({...v,postalCode:e.target.value}))} placeholder="Kode pos" />
                    {errors.postalCode && <div className="error-text">{errors.postalCode}</div>}
                  </div>
                  <div className="form-group">
                    <label>Catatan</label>
                    <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Arah detail atau catatan kurir" />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">
                <div className="card-icon"><img src={assets.wallet_icon} alt="" /></div>
                <div className="card-title">
                  <h3>Pengiriman & Pembayaran</h3>
                  <p>Pilih opsi yang diinginkan</p>
                </div>
              </div>
              <div className="card-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>Metode Pengiriman</label>
                    <select className={errors.shippingMethod ? 'error' : ''} value={shippingMethod} onChange={e=>setShippingMethod(e.target.value)}>
                      <option value="">Pilih</option>
                      <option value="JNE">JNE</option>
                      <option value="SiCepat">SiCepat</option>
                      <option value="POS">POS</option>
                    </select>
                    {errors.shippingMethod && <div className="error-text">{errors.shippingMethod}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-right">
            <div className="summary-card">
              <div className="summary-header">
                <div className="summary-icon"><img src={assets.bag_icon} alt="" /></div>
                <div>
                  <h3>Ringkasan Pesanan</h3>
                  <p>Detail total dan biaya</p>
                </div>
              </div>
              <div className="summary-body">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>Rp0</strong>
                </div>
                <div className="summary-row">
                  <span>Ongkir</span>
                  <strong>Rp0</strong>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>Total</span>
                  <strong>Rp0</strong>
                </div>
                <div className="summary-divider" />
                <div className="summary-row"><span>Nama</span><strong>{customer.name || '—'}</strong></div>
                <div className="summary-row"><span>Email</span><strong>{customer.email || '—'}</strong></div>
                <div className="summary-row"><span>No. HP</span><strong>{customer.phone || '—'}</strong></div>
                <div className="summary-row"><span>Alamat</span><strong>{address.line1 || '—'}</strong></div>
                <div className="summary-row"><span>Kota</span><strong>{address.city || '—'}</strong></div>
                <div className="summary-row"><span>Provinsi</span><strong>{address.province || '—'}</strong></div>
                <div className="summary-row"><span>Kode Pos</span><strong>{address.postalCode || '—'}</strong></div>
              </div>
              {success && <div className="success-alert">{success}</div>}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout
