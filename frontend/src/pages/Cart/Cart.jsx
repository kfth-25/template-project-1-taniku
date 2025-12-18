import React, { useContext, useMemo, useState } from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext.jsx'
import { createOrder } from '../../services/orderService'
import { useNavigate } from 'react-router-dom'
import { assets } from '../../assets/assets'

 

const Cart = () => {
  const { cart, cartDetails, barang_list, products, setCartItemQuantity, removeFromCart, clearCart, processCheckout, user, appliedVoucher, setAppliedVoucher, VOUCHERS } = useContext(StoreContext)
  const [voucherCode, setVoucherCode] = useState('')
  const [error, setError] = useState('')
  const [notification, setNotification] = useState('') // Add notification state
  const [shippingAddress] = useState('')
  const navigate = useNavigate()

  const cartItems = useMemo(() => {
    const entries = Object.entries(cart || {})
    const items = []
    for (const [id, qty] of entries) {
      if (qty <= 0) continue
      const fromDb = (products || []).find(p => String(p._id) === String(id))
      const fromAssets =
        barang_list.find(b => String(b._id) === String(id)) ||
        barang_list.find(b => String(b.name).toLowerCase() === String(id).toLowerCase())
      const snap = (cartDetails || {})[id]
      const base = snap || fromDb || fromAssets
      if (!base) continue
      const priceRibu = Number(snap?.price ?? fromDb?.price ?? fromAssets?.price ?? 0) || 0
      const originalRibu = (snap?.originalPrice != null ? Number(snap.originalPrice) : (Number(fromDb?.originalPrice ?? fromAssets?.originalPrice ?? 0) || null))
      const discountPct = Number(snap?.discount ?? fromDb?.discount ?? fromAssets?.discount ?? 0) || 0
      const isBundle = String(snap?.category ?? base.category ?? '').toLowerCase() === 'bundle' || String(snap?.name ?? base.name ?? '').toLowerCase().includes('paket')
      const img = isBundle ? assets.package_icon : (snap?.image ?? base.image ?? '/placeholder.png')
      items.push({
        id,
        qty: Number(qty),
        item: {
          _id: String(base._id || id),
          name: String(snap?.name ?? base.name ?? ''),
          image: img,
          category: snap?.category ?? base.category ?? '',
          priceRibu,
          originalRibu,
          discount: discountPct,
          stock: Number(snap?.stock ?? base.stock ?? 80)
        }
      })
    }
    return items
  }, [cart, cartDetails, barang_list, products])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, { item, qty }) => sum + (Number(item.priceRibu) || 0) * qty, 0)
  }, [cartItems])

  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0
    const conf = VOUCHERS[appliedVoucher]
    if (!conf) return 0
    if (conf.minSubtotal && subtotal < conf.minSubtotal) return 0
    if (conf.type === 'percent') return Math.floor((subtotal * conf.value) / 100)
    if (conf.type === 'fixed') return Math.min(subtotal, conf.value)
    return 0
  }, [appliedVoucher, subtotal, VOUCHERS])

  const total = Math.max(0, subtotal - discountAmount)

  const applyVoucher = () => {
    const code = String(voucherCode || '').trim().toUpperCase()
    setError('')
    setNotification('')
    if (!code) {
      setError('Masukkan kode voucher.')
      return
    }
    if (!VOUCHERS[code]) {
      setError('Kode voucher tidak valid.')
      return
    }
    const conf = VOUCHERS[code]
    if (conf.minSubtotal && subtotal < conf.minSubtotal) {
      setError(`Min. subtotal Rp ${conf.minSubtotal}.000 untuk voucher ini.`)
      return
    }
    setAppliedVoucher(code)
    setNotification(`Voucher ${code} berhasil diterapkan!`)
    setTimeout(() => setNotification(''), 3000) // Clear notification after 3 seconds
  }

  const removeVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCode('')
    setError('')
    setNotification('Voucher berhasil dihapus!')
    setTimeout(() => setNotification(''), 3000)
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Keranjang kosong. Tambahkan produk terlebih dahulu.')
      return
    }

    // Check stock availability
    const stockIssues = []
    for (const { qty, item } of cartItems) {
      const currentStock = item.stock || 80
      if (qty > currentStock) {
        stockIssues.push(`${item.name} (stok tersedia: ${currentStock}, diminta: ${qty})`)
      }
    }

    if (stockIssues.length > 0) {
      setError(`Stok tidak mencukupi untuk: ${stockIssues.join(', ')}`)
      return
    }

    // Process checkout
    if (!shippingAddress.trim()) {
      navigate('/place-order?next=/cart')
      return
    }
    const payload = {
      products: cartItems.map(({ id, qty, item }) => ({ id, name: item.name, qty, price: Number(item.priceRibu) })),
      total: Number(total),
      shipping_address: shippingAddress,
      customer_name: user?.name || null,
      customer_email: user?.email || null,
      customer_phone: user?.phone || null
    }
    try {
      const res = await createOrder(payload)
      if (res.ok && res.data?.order_id) {
        processCheckout()
        setAppliedVoucher(null)
        setVoucherCode('')
        setError('')
        navigate(`/order-confirmation/${res.data.order_id}`, { state: { email_sent: res.data.email_sent, whatsapp_link: res.data.whatsapp_link } })
      } else {
        setError('Gagal membuat pesanan.')
      }
    } catch (e) {
      setError(`Terjadi kesalahan saat membuat pesanan: ${e?.message || 'Unknown error'}`)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <h2>Keranjang Belanja</h2>
        <p>Keranjang Anda kosong.</p>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h2>Keranjang Belanja</h2>
      
      {/* Notification */}
      {notification && (
        <div className="notification success">
          {notification}
        </div>
      )}

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map(({ id, qty, item }) => (
            <div key={id} className="cart-row">
              <div className="cart-info">
                <img src={item.image} alt={item.name} />
                <div>
                  <h4>{item.name}</h4>
                  <div className="price-line">
                    <span className="price">Rp {(item.priceRibu * 1000).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
              <div className="cart-actions">
                <div className="stepper">
                  <button onClick={() => setCartItemQuantity(id, Math.max(1, qty - 1))}>-</button>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val)) setCartItemQuantity(id, Math.max(1, val))
                    }}
                  />
                  <button onClick={() => setCartItemQuantity(id, qty + 1)}>+</button>
                </div>
                <button className="remove" onClick={() => removeFromCart(id)}>Hapus</button>
              </div>
            </div>
          ))}
          <div className="cart-tools">
            <button className="clear" onClick={clearCart}>Kosongkan Keranjang</button>
          </div>
        </div>

          <div className="cart-summary">
            <h3>Ringkasan</h3>
            <div className="row">
              <span>Subtotal</span>
              <span>Rp {(subtotal * 1000).toLocaleString('id-ID')}</span>
            </div>

          <div className="voucher">
            <label>Kode Voucher</label>
            <div className="voucher-input">
              <input
                type="text"
                placeholder="Masukkan kode, contoh: DISKON10"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <button onClick={applyVoucher}>Terapkan</button>
            </div>
            {error && <p className="error">{error}</p>}
            {appliedVoucher && (
              <div className="applied">
                <span>Voucher: {appliedVoucher} ({VOUCHERS[appliedVoucher]?.label})</span>
                <button className="remove" onClick={removeVoucher}>Hapus Voucher</button>
              </div>
            )}
          </div>

            <div className="row">
              <span>Diskon</span>
              <span>- Rp {(discountAmount * 1000).toLocaleString('id-ID')}</span>
            </div>
            <div className="row total">
              <span>Total</span>
              <span>Rp {(total * 1000).toLocaleString('id-ID')}</span>
            </div>

          <div className="checkout-form">
          </div>

          <button className="checkout" onClick={handleCheckout}>Checkout</button>
        </div>
      </div>

      <div className="voucher-hints">
        <p>Contoh kode: DISKON10, DISKON20 (min Rp 200.000), HEMAT50</p>
      </div>
    </div>
  )
}

export default Cart
