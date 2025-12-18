import React, { useContext, useEffect, useMemo, useState } from 'react'
import './PaymentMethod.css'
import { useNavigate, useLocation } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext.jsx'
import { createOrder } from '../../services/orderService'
import produkService from '../../services/produkService'
import { assets } from '../../assets/assets'
import api from '../../services/api'

const PaymentMethod = () => {
  const { checkoutPaymentMethod, setCheckoutPaymentMethod, cart, cartDetails, barang_list, user, processCheckout, products, fetchProducts, getVoucherDiscount } = useContext(StoreContext)
  const navigate = useNavigate()
  const location = useLocation()
  const next = useMemo(() => new URLSearchParams(location.search).get('next') || '/cart', [location.search])
  const [method, setMethod] = useState(checkoutPaymentMethod || 'Transfer Bank')
  const [bank, setBank] = useState('BCA')
  const [ewallet, setEwallet] = useState('OVO')
  const [snapReady, setSnapReady] = useState(false)
  const [snapLoading, setSnapLoading] = useState(false)
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
  const vaNumber = useMemo(() => {
    const base = String(user?.phone || '').replace(/[^0-9]/g, '') || '0812'
    const pad = String(Date.now()).slice(-6)
    return `${bank === 'BCA' ? '88' : bank === 'BNI' ? '444' : bank === 'BRI' ? '777' : '555'}${base.slice(-6)}${pad}`
  }, [bank, user])
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

  const onSubmit = async (e) => {
    e.preventDefault()
    setCheckoutPaymentMethod(method)
    if (!user?.name || !user?.phone || !user?.address) { navigate('/place-order?next=/payment-method', { replace: true }); return }
    if (cartItems.length === 0) { navigate('/cart', { replace: true }); return }
    if (!products || products.length === 0) {
      try { await fetchProducts() } catch (err) { void err }
    }
    const fallbackEmail = (user?.email && String(user.email).trim().length > 0)
      ? user.email
      : `${String(user?.phone || 'user').replace(/[^0-9]/g,'') || 'noemail'}@example.com`

    // Pastikan setiap item punya product_id numerik yang valid di DB

    const normalizedItems = await Promise.all(cartItems.map(async ({ id, qty, item }) => {
      const pid = await ensureProductId({ id, item })
      const up = Number(item?.priceRibu || item?.price || 0) * 1000
      return { product_id: pid, quantity: Number(qty), name: String(item?.name || ''), unit_price: up, category: String(item?.category || '') }
    }))

    const payload = {
      customer_name: user?.name || null,
      customer_email: fallbackEmail,
      customer_phone: user?.phone || null,
      shipping_address: user.address,
      payment_method: method,
      shipping_cost: 0,
      discount: discountAmount * 1000,
      items: normalizedItems
    }
    try {
      const res = await createOrder(payload)
      if (res.ok && res.data?.order_id) {
        processCheckout()
        navigate(`/order-confirmation/${String(res.data.order_id)}`, { state: { email_sent: res.data.email_sent, whatsapp_link: res.data.whatsapp_link } })
      } else {
        navigate(next, { replace: true })
      }
    } catch {
      navigate(next, { replace: true })
    }
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
    const isProduction = !key.includes('SB-')
    const s = document.createElement('script')
    s.src = isProduction 
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    s.setAttribute('data-client-key', key)
    s.async = true
    s.onload = () => { if ((window).snap) setSnapReady(true) }
    s.onerror = () => { setSnapReady(false) }
    document.body.appendChild(s)
    return () => { if (s && s.parentNode) s.parentNode.removeChild(s) }
  }, [])

  const ensureSnapReady = async () => {
    if ((window).snap) { setSnapReady(true); return true }
    const key = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    if (!key) return false
    setSnapLoading(true)
    const start = Date.now()
    return await new Promise((resolve) => {
      const tick = () => {
        if ((window).snap) {
          setSnapReady(true)
          setSnapLoading(false)
          resolve(true)
          return
        }
        if (Date.now() - start > 5000) {
          setSnapLoading(false)
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

    // Save pending order for recovery
    let payloadOrder
    try {
      const normalizedItems = await buildNormalizedItems()
      payloadOrder = {
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
      localStorage.setItem('pending_midtrans_order', JSON.stringify(payloadOrder))
    } catch (e) { console.error(e) }

    ;(window).snap.pay(token, {
      onSuccess: async () => {
        try {
          if (!payloadOrder) {
            const normalizedItems = await buildNormalizedItems()
            payloadOrder = {
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
          }
          const res = await createOrder(payloadOrder)
          if (res.ok && res.data?.order_id) {
            localStorage.removeItem('pending_midtrans_order')
            processCheckout()
            navigate(`/order-confirmation/${String(res.data.order_id)}`)
          } else { navigate(next, { replace: true }) }
        } catch { navigate(next, { replace: true }) }
      },
      onPending: () => void 0,
      onError: () => { alert('Pembayaran gagal') },
      onClose: () => void 0
    })
  }

  return (
    <div className="payment-page">
      <div className="page">
        <div className="card">
          <div className="card-header">
            <h1>Pilih Metode Pembayaran</h1>
            <p>Desain modern dengan pilihan yang jelas</p>
          </div>
          <form className="card-body" onSubmit={onSubmit}>
            <div className="summary">
              <div className="row"><span>Subtotal</span><strong>Rp {(subtotal * 1000).toLocaleString('id-ID')}</strong></div>
              <div className="row"><span>Diskon</span><strong>- Rp {(discountAmount * 1000).toLocaleString('id-ID')}</strong></div>
              <div className="row total"><span>Total</span><strong>Rp {(total * 1000).toLocaleString('id-ID')}</strong></div>
            </div>

            <div className="payment-grid">
              <div className={`option-card ${method==='Transfer Bank'?'active':''}`} onClick={()=>setMethod('Transfer Bank')}>
                <div className="option-header">
                  <div className="logos">
                    <img src={assets.bca} alt="BCA" />
                    <img src={assets.bni} alt="BNI" />
                    <img src={assets.mandiri} alt="Mandiri" />
                  </div>
                  <div className="title">Transfer Bank</div>
                </div>
                {method==='Transfer Bank' && (
                  <div className="subform">
                    <div className="inline">
                      <select value={bank} onChange={e=>setBank(e.target.value)}>
                        <option>BCA</option>
                        <option>BNI</option>
                        <option>BRI</option>
                        <option>Mandiri</option>
                      </select>
                      <div className="va-box">
                        <div className="va-label">Nomor VA</div>
                        <div className="va-value">{vaNumber}</div>
                        <button type="button" className="ghost" onClick={()=>navigator.clipboard?.writeText(vaNumber)}>Salin</button>
                      </div>
                    </div>
                    <div className="hint">Selesaikan pembayaran sebelum 24 jam</div>
                  </div>
                )}
              </div>

              <div className={`option-card ${method==='E-Wallet'?'active':''}`} onClick={()=>setMethod('E-Wallet')}>
                <div className="option-header">
                  <div className="logos">
                    <img src={assets.ovo} alt="OVO" />
                    <img src={assets.gopay} alt="GoPay" />
                    <img src={assets.dana} alt="DANA" />
                    <img src={assets.shopepay} alt="ShopeePay" />
                  </div>
                  <div className="title">E‑Wallet</div>
                </div>
                {method==='E-Wallet' && (
                  <div className="subform">
                    <div className="inline">
                      <select value={ewallet} onChange={e=>setEwallet(e.target.value)}>
                        <option>OVO</option>
                        <option>GoPay</option>
                        <option>DANA</option>
                        <option>ShopeePay</option>
                      </select>
                      <div className="qr-box">
                        <div className="qr">{`${ewallet}-${String(total)}K`}</div>
                        <div className="hint">Scan {ewallet} untuk bayar</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`option-card ${method==='COD'?'active':''}`} onClick={()=>setMethod('COD')}>
                <div className="option-header">
                  <div className="title">COD</div>
                </div>
                {method==='COD' && (
                  <div className="subform">
                    <div className="hint">Bayar di tempat saat barang diterima</div>
                  </div>
                )}
              </div>
            </div>

            <div className="security">
              <span>Pembayaran aman</span>
              <img src={assets.visa} alt="Visa" />
              <img src={assets.paypal} alt="PayPal" />
            </div>

            <div className="actions">
              <button type="button" className="ghost" onClick={()=>navigate('/place-order')}>Kembali</button>
              <button type="submit" className="primary">Buat Pesanan</button>
              <button type="button" className="primary" onClick={payWithMidtrans} disabled={snapLoading || !snapReady}>Bayar via Midtrans</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethod
