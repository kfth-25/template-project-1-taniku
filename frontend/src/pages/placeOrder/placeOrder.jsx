import React, { useContext, useMemo, useState, useEffect } from 'react'
import './placeOrder.css'
import { useNavigate, useLocation } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext.jsx'
import { createOrder } from '../../services/orderService'
import produkService from '../../services/produkService'
import api from '../../services/api'

const PlaceOrder = () => {
  const { user, updateUser, setCheckoutStartedAt, cart, cartDetails, barang_list, products, fetchProducts, getVoucherDiscount, processCheckout } = useContext(StoreContext)
  const navigate = useNavigate()
  const location = useLocation()
  const next = useMemo(() => new URLSearchParams(location.search).get('next') || '/cart', [location.search])

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postalCode || ''
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.phone.trim() &&
      form.address.trim() &&
      form.city.trim() &&
      form.postalCode.trim()
    )
  }, [form])

  useEffect(() => {
    setForm(f => ({
      ...f,
      name: user?.name || f.name,
      email: user?.email || f.email,
      phone: user?.phone || f.phone,
      address: user?.address || f.address,
      city: user?.city || f.city,
      postalCode: user?.postalCode || f.postalCode
    }))
  }, [user])

  const cartItems = useMemo(() => {
    const entries = Object.entries(cart || {})
    const items = []
    for (const [id, qty] of entries) {
      if (qty <= 0) continue
      const snap = (cartDetails || {})[id]
      const fromDbById = (products || []).find(p => String(p._id) === String(id))
      const fromAssets = barang_list.find(b => String(b._id) === String(id)) || barang_list.find(b => String(b.name).toLowerCase() === String(id).toLowerCase())
      const base = snap || fromDbById || fromAssets
      if (!base) continue
      const priceRibu = Number(snap?.price ?? fromDbById?.price ?? fromAssets?.price ?? 0) || 0
      items.push({
        id: fromDbById ? String(fromDbById._id) : id,
        qty: Number(qty),
        item: {
          _id: String(base._id || id),
          name: String(snap?.name ?? base.name ?? ''),
          image: snap?.image ?? base.image ?? null,
          category: String(snap?.category ?? base.category ?? ''),
          priceRibu,
          stock: Number(snap?.stock ?? base.stock ?? 0)
        }
      })
    }
    return items
  }, [cart, cartDetails, products, barang_list])
  const subtotal = useMemo(() => cartItems.reduce((sum, { item, qty }) => sum + (Number(item.priceRibu || item.price || 0) || 0) * qty, 0), [cartItems])
  const discountAmount = useMemo(() => getVoucherDiscount(subtotal), [getVoucherDiscount, subtotal])
  const total = Math.max(0, subtotal - discountAmount)

  const ensureProductId = async ({ id, item }) => {
    const nameLower = String(item?.name || '').toLowerCase()
    const matchById = (products || []).find(p => String(p._id) === String(id))
    const matchByName = (products || []).find(p => String(p.name).toLowerCase() === nameLower)
    const dbMatch = matchById || matchByName
    if (dbMatch && Number.isFinite(Number(dbMatch._id))) return Number(dbMatch._id)
    try {
      const payload = {
        name: String(item?.name || 'Produk'),
        sku: String(id || nameLower).replace(/[^a-z0-9-]/gi, '').slice(0, 20) || `SKU-${Date.now()}`,
        category: String(item?.category || 'pupuk').toLowerCase().includes('pupuk') ? 'pupuk' : (String(item?.category || '').toLowerCase().includes('obat') ? 'obat' : 'bundle'),
        price: Number(item?.price || 0) * 1000,
        stock: Number(item?.stock || 100),
        description: String(item?.description || '')
      }
      const res = await produkService.createProduk(payload)
      if (res && res.ok && res.id) {
        return Number(res.id)
      }
    } catch { /* ignore */ }
    try { await fetchProducts() } catch { /* ignore */ }
    const byName = (products || []).find(p => String(p.name).toLowerCase() === nameLower)
    if (byName && Number.isFinite(Number(byName._id))) return Number(byName._id)
    return 1
  }

  const buildNormalizedItems = async () => {
    return await Promise.all(cartItems.map(async ({ id, qty, item }) => {
      const pid = await ensureProductId({ id, item })
      const up = Number(item?.priceRibu || item?.price || 0) * 1000
      return { product_id: pid, quantity: Number(qty), name: String(item?.name || ''), unit_price: up, category: String(item?.category || '') }
    }))
  }

  useEffect(() => {
    const key = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    if (!key) return
    const s = document.createElement('script')
    s.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    s.setAttribute('data-client-key', key)
    s.async = true
    s.onload = () => void 0
    s.onerror = () => void 0
    document.body.appendChild(s)
    return () => { if (s && s.parentNode) s.parentNode.removeChild(s) }
  }, [])

  const ensureSnapReady = async () => {
    if ((window).snap) { return true }
    const key = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    if (!key) return false
    const start = Date.now()
    return await new Promise((resolve) => {
      const tick = () => {
        if ((window).snap) {
          resolve(true)
          return
        }
        if (Date.now() - start > 5000) {
          resolve(false)
          return
        }
        setTimeout(tick, 100)
      }
      tick()
    })
  }

  const payWithMidtrans = async () => {
    const key = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    if (!key) { alert('Midtrans belum dikonfigurasi. Set VITE_MIDTRANS_CLIENT_KEY.'); return }
    const ok = await ensureSnapReady()
    if (!ok) { alert('Midtrans belum siap. Coba lagi dalam beberapa detik.'); return }
    const orderId = `ORD-${Date.now()}`
    const payload = {
      order_id: orderId,
      gross_amount: Number(total) * 1000,
      customer_details: {
        first_name: String(user?.name || 'User'),
        last_name: '',
        email: String(user?.email || `${String(user?.phone||'user').replace(/[^0-9]/g,'') || 'user'}@example.com`),
        phone: String(user?.phone || ''),
      }
    }
    let token
    try {
      const res = await api.post('/api/midtrans_snap.php', payload)
      token = res?.data?.token
    } catch {
      alert('Gagal membuat transaksi Midtrans')
      return
    }
    if (!token) { alert('Token Midtrans tidak tersedia'); return }
    ;(window).snap.pay(token, {
      onSuccess: async () => {
        try {
          const normalizedItems = await buildNormalizedItems()
          const payloadOrder = {
            customer_name: user?.name || null,
            customer_email: String(user?.email || `${String(user?.phone||'user').replace(/[^0-9]/g,'') || 'user'}@example.com`),
            customer_phone: user?.phone || null,
            shipping_address: user?.address || '',
            payment_method: 'Midtrans',
            shipping_cost: 0,
            discount: discountAmount * 1000,
            items: normalizedItems,
            external_order_id: orderId
          }
          navigate(`/order-confirmation/new`, { state: { pending_order_payload: payloadOrder, external_order_id: orderId } })
        } catch { navigate(next, { replace: true }) }
      },
      onPending: () => void 0,
      onError: () => { alert('Pembayaran gagal') },
      onClose: () => void 0
    })
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (!form.phone.trim()) e.phone = 'No. HP wajib diisi'
    if (!form.address.trim()) e.address = 'Alamat wajib diisi'
    if (!form.city.trim()) e.city = 'Kota wajib diisi'
    if (!form.postalCode.trim()) e.postalCode = 'Kode pos wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setSaving(true)
      updateUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode
      })
      setCheckoutStartedAt(Date.now())
      setSaved(true)
      if (cartItems.length === 0) { navigate('/cart', { replace: true }); return }
      if (!products || products.length === 0) { try { await fetchProducts() } catch { /* ignore */ } }
      await payWithMidtrans()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="place-order-page">
      <div className="page">
        <div className="card">
          <div className="card-header">
            <h1>Informasi Checkout</h1>
          </div>
          <form className="card-body" onSubmit={onSubmit}>
            <div className="layout">
              <div className="left">
                <div className="section">
                  <div className="section-title">Data Kontak</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nama</label>
                      <input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} className={errors.name ? 'error' : ''} placeholder="Contoh: Budi Santoso" />
                      {errors.name && <div className="error-text">{errors.name}</div>}
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} placeholder="email@contoh.com" />
                    </div>
                  </div>
                </div>

                <div className="section">
                  <div className="section-title">Alamat Pengiriman</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>No. HP</label>
                      <input type="tel" value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))} className={errors.phone ? 'error' : ''} placeholder="08xxxxxxxxxx" />
                      {errors.phone && <div className="error-text">{errors.phone}</div>}
                    </div>
                    <div className="form-group">
                      <label>Kode Pos</label>
                      <input value={form.postalCode} onChange={e=>setForm(v=>({...v,postalCode:e.target.value}))} className={errors.postalCode ? 'error' : ''} placeholder="Kode pos" />
                      {errors.postalCode && <div className="error-text">{errors.postalCode}</div>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full">
                      <label>Alamat</label>
                      <textarea value={form.address} onChange={e=>setForm(v=>({...v,address:e.target.value}))} className={errors.address ? 'error' : ''} placeholder="Provinsi, Kota / Kabupaten , Kecamatan, Desa / Block ,Nama jalan, RT/RW, nomor rumah" />
                      {errors.address && <div className="error-text">{errors.address}</div>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Kota/Kabupaten</label>
                      <input value={form.city} onChange={e=>setForm(v=>({...v,city:e.target.value}))} className={errors.city ? 'error' : ''} placeholder="Kota/Kabupaten" />
                      {errors.city && <div className="error-text">{errors.city}</div>}
                    </div>
                  </div>
                </div>

                <div className="actions">
                  <button type="button" className="ghost" onClick={()=>navigate('/cart')}>Kembali</button>
                  <button type="submit" className="primary" disabled={saving || !canSubmit}>{saving ? 'Menyimpan...' : 'Simpan & Checkout'}</button>
                </div>
                {saved && <div className="saved-info">Data tersimpan.</div>}
              </div>

              <div className="right">
                <div className="preview">
                  <div className="preview-title">Ringkasan Data</div>
                  <div className="preview-row"><span>Nama</span><strong>{form.name || '-'}</strong></div>
                  <div className="preview-row"><span>Email</span><strong>{form.email || '-'}</strong></div>
                  <div className="preview-row"><span>No. HP</span><strong>{form.phone || '-'}</strong></div>
                  <div className="preview-row"><span>Alamat</span><strong>{form.address || '-'}</strong></div>
                  <div className="preview-row"><span>Kota</span><strong>{form.city || '-'}</strong></div>
                  <div className="preview-row"><span>Kode Pos</span><strong>{form.postalCode || '-'}</strong></div>
                  <div className="helper">Pastikan data valid dan lengkap.</div>
                  <div className="terms">Data Anda dijaga sesuai kebijakan privasi.</div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PlaceOrder
