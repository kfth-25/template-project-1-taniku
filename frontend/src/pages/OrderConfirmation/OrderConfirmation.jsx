import React, { useEffect, useMemo, useState, useContext } from 'react'
import './OrderConfirmation.css'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getOrderById, createOrder, getOrderByNumber } from '../../services/orderService'
import api from '../../services/api'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext.jsx'

const OrderConfirmation = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { processCheckout } = useContext(StoreContext) || {}
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [mapEmbedUrl, setMapEmbedUrl] = useState('')
  const [mapLinkUrl, setMapLinkUrl] = useState('')
  const emailSent = location.state?.email_sent || false
  const waLinkFromState = location.state?.whatsapp_link || null
  const pendingPayload = location.state?.pending_order_payload || null

  const formattedDate = useMemo(() => {
    if (!order?.created_at) return '-'
    try {
      const d = new Date(order.created_at)
      return d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
    } catch {
      return order.created_at
    }
  }, [order])

  const whatsappLink = useMemo(() => {
    if (waLinkFromState) return waLinkFromState
    if (!order?.customer_phone) return null
    const totalStr = (Number(order.total) || 0).toLocaleString('id-ID')
    const text = `Pesanan ${order.order_number} berhasil dibuat. Total Rp ${totalStr}`
    return `https://wa.me/${order.customer_phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(text)}`
  }, [order, waLinkFromState])

  const toEmbedUrl = (url) => {
    try {
      const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (atMatch) {
        const lat = atMatch[1]
        const lng = atMatch[2]
        return `https://www.google.com/maps?q=${lat},${lng}&output=embed`
      }
      const qMatch = url.match(/[?&]q=([^&]+)/)
      if (qMatch) {
        const q = decodeURIComponent(qMatch[1])
        const coord = q.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
        if (coord) {
          const lat = coord[1]
          const lng = coord[2]
          return `https://www.google.com/maps?q=${lat},${lng}&output=embed`
        }
        return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
      }
      const u = new URL(url)
      if ((u.hostname || '').includes('google')) {
        if (!u.searchParams.has('output')) { u.searchParams.set('output', 'embed') }
        return u.toString()
      }
      return url
    } catch {
      return url
    }
  }

  const geocodeQueryAny = async (q) => {
    const tryProviders = [
      async (query) => {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } })
        if (!r.ok) return null; const a = await r.json()
        if (Array.isArray(a) && a[0]) { const lat = a[0].lat != null ? Number(a[0].lat) : null; const lon = a[0].lon != null ? Number(a[0].lon) : null; if (lat != null && lon != null) return { lat, lng: lon } }
        return null
      },
      async (query) => {
        const r = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(query)}&limit=1`, { headers: { 'Accept': 'application/json' } })
        if (!r.ok) return null; const a = await r.json()
        if (Array.isArray(a) && a[0]) { const lat = a[0].lat != null ? Number(a[0].lat) : null; const lon = a[0].lon != null ? Number(a[0].lon) : null; if (lat != null && lon != null) return { lat, lng: lon } }
        return null
      },
      async (query) => {
        const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`, { headers: { 'Accept': 'application/json' } })
        if (!r.ok) return null; const a = await r.json()
        if (a && a.features && a.features[0] && a.features[0].geometry && Array.isArray(a.features[0].geometry.coordinates)) {
          const lon = Number(a.features[0].geometry.coordinates[0]); const lat = Number(a.features[0].geometry.coordinates[1]); if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lng: lon }
        }
        return null
      }
    ]
    for (const fn of tryProviders) { try { const res = await fn(q); if (res) return res } catch { void 0 } }
    return null
  }

  useEffect(() => {
    const load = async () => {
      try {
        if (pendingPayload && (String(id).toLowerCase() === 'new' || !/^\d+$/.test(String(id)))) {
          try {
            const res = await createOrder(pendingPayload)
            if (res.ok && res.data?.order_id) {
              try { processCheckout && processCheckout() } catch { /* ignore */ }
              navigate(`/order-confirmation/${String(res.data.order_id)}`, { replace: true })
              return
            }
          } catch { /* fallback to normal flow below */ }
        }
        
        if (String(id).toLowerCase() === 'new') {
          setLoading(false)
          return
        }

        let res = await getOrderById(id)
        if (res.ok && res.data?.order) {
          const ord = res.data.order
          setOrder(ord)
          setItems(res.data.items || [])
          const u = String(ord.map_url || '')
          if (u) {
            setMapEmbedUrl(toEmbedUrl(u))
            setMapLinkUrl(u)
          }
          const params = ord.order_number ? { order_code: ord.order_number } : { order_id: ord.id }
          let tr = null
          try {
            const r1 = await api.get('/tracking', { params })
            const d1 = r1?.data
            if (d1 && d1.ok && d1.data) tr = d1.data
          } catch { void 0 }
          if (!tr) {
            try {
              const r2 = await api.get('/api/tracking.php', { params })
              const d2 = r2?.data
              if (d2 && d2.ok && d2.data) tr = d2.data
            } catch { void 0 }
          }
          if (tr) {
            const mu = tr.map_url || ''
            const lat = tr.lat != null ? Number(tr.lat) : null
            const lng = tr.lng != null ? Number(tr.lng) : null
            if (lat != null && lng != null) {
              setMapEmbedUrl(`https://www.google.com/maps?q=${lat},${lng}&output=embed`)
            }
            if (mu) {
              setMapLinkUrl(mu)
              if (lat == null || lng == null) {
                setMapEmbedUrl(toEmbedUrl(mu))
                try {
                  let q = null
                  const s = String(mu)
                  const mq = s.match(/[?&]query=([^&]+)/)
                  if (mq) q = decodeURIComponent(mq[1])
                  if (!q) { const mp = s.match(/\/place\/([^/]+)/); if (mp) q = decodeURIComponent(mp[1]) }
                  if (!q) { const mqq = s.match(/[?&]q=([^&]+)/); if (mqq) { const raw = decodeURIComponent(mqq[1]); const isCoord = /-?\d+\.\d+\s*,\s*-?\d+\.\d+/.test(raw); if (!isCoord) q = raw } }
                  if (q) {
                    const g = await geocodeQueryAny(q)
                    if (g) {
                      setMapEmbedUrl(`https://www.google.com/maps?q=${g.lat},${g.lng}&output=embed`)
                      if (!mu) setMapLinkUrl(`https://www.google.com/maps?q=${g.lat},${g.lng}`)
                    }
                  }
                } catch { void 0 }
              }
            }
            if (!mu && lat != null && lng != null) {
              setMapLinkUrl(`https://www.google.com/maps?q=${lat},${lng}`)
            }
            }
          }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, location.search, pendingPayload, navigate, processCheckout])

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <div className="order-confirmation-card">
          <div className="order-loading">
            <div className="spinner" />
            <p>Memuat konfirmasi pesanan...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-confirmation-page">
        <div className="order-confirmation-card">
          <h2>Pesanan tidak ditemukan</h2>
          <button className="primary" onClick={() => navigate('/')}>Kembali ke Beranda</button>
        </div>
      </div>
    )
  }

  return (
    <div className="order-confirmation-page">
      <div className="order-confirmation-card">
        <div className="header">
          <img src={assets.package_icon} alt="Success" className="icon" />
          <div>
            <h1>Pesanan Berhasil Dibuat</h1>
            <p>Nomor Pesanan {order.order_number}</p>
          </div>
        </div>

        <div className="subheader">
          <div className="status-badge">Status: {order.status}</div>
          <div className="order-date">Tanggal: {formattedDate}</div>
          <div className="order-actions-inline">
            <button className="ghost" onClick={() => navigator.clipboard?.writeText(order.order_number)}>Salin Nomor</button>
            <button className="ghost" onClick={() => window.print()}>Cetak/Unduh</button>
          </div>
        </div>
        {emailSent && (
          <div className="email-info">Email konfirmasi telah dikirim.</div>
        )}

        <div className="grid">
          <div className="section">
            <h3>Ringkasan Pesanan</h3>
            <div className="items">
              {items.map((it, idx) => (
                <div key={idx} className="item-row">
                  <div className="info">
                    <img src={(String(it.product_name || '').toLowerCase().includes('paket') ? assets.package_icon : assets.bag_icon)} alt="Item" />
                    <div>
                      <div className="name">{it.product_name}</div>
                      <div className="meta">Qty {it.quantity} • Rp {(Number(it.price) || 0).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                  <div className="subtotal">Rp {(Number(it.subtotal) || 0).toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>
            <div className="total-row">
              <span>Total</span>
              <span className="total">Rp {(Number(order.total) || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="section">
            <h3>Informasi Pengiriman</h3>
            <div className="detail">
              <div className="label">Nama</div>
              <div className="value">{order.customer_name || '-'}</div>
            </div>
            <div className="detail">
              <div className="label">Email</div>
              <div className="value">{order.customer_email || '-'}</div>
            </div>
            <div className="detail">
              <div className="label">Telepon</div>
              <div className="value">{order.customer_phone || '-'}</div>
            </div>
            <div className="detail">
              <div className="label">Alamat</div>
              <div className="value">{order.shipping_address}</div>
            </div>
            <div className="detail">
              <div className="label">Metode Pembayaran</div>
              <div className="value">{order.payment_method}</div>
            </div>
            <div className="instructions">
              {order.payment_method === 'COD' && (
                <div className="instruction-box">
                  <div className="instruction-title">Instruksi COD</div>
                  <div className="instruction-body">Pembayaran dilakukan saat barang diterima. Pastikan nomor telepon aktif untuk koordinasi kurir.</div>
                </div>
              )}
              {order.payment_method === 'E-Wallet' && (
                <div className="instruction-box">
                  <div className="instruction-title">Instruksi E‑Wallet</div>
                  <div className="instruction-body">Anda akan menerima tautan pembayaran melalui E‑Wallet. Selesaikan pembayaran untuk memproses pesanan.</div>
                </div>
              )}
            </div>

            {(mapEmbedUrl || mapLinkUrl) && (
              <div className="map-section">
                <h3>Peta Lokasi Pengiriman</h3>
                <div className="map-wrapper">
                  {mapEmbedUrl && (
                    <iframe
                      title={`Map ${order.order_number}`}
                      className="map-frame"
                      src={mapEmbedUrl}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  )}
                </div>
                <div className="map-actions">
                  {mapLinkUrl && (<a href={mapLinkUrl} target="_blank" rel="noreferrer" className="open-map-link">Buka di Google Maps</a>)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="actions">
          <a className="primary" href={`mailto:${order.customer_email}?subject=Konfirmasi Pesanan ${order.order_number}`}>Kirim Email</a>
          {whatsappLink && (
            <a className="secondary" href={whatsappLink} target="_blank" rel="noreferrer">Kirim WhatsApp</a>
          )}
          <button className="ghost" onClick={() => navigate('/')}>Belanja Lagi</button>
            </div>
          </div>
        </div>

        
  )
}

export default OrderConfirmation
