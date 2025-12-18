import React, { useContext, useEffect, useMemo, useState } from 'react'
import './Profile.css'
import { StoreContext } from '../../context/StoreContext.jsx'
import { listOrders, getOrderById } from '../../services/orderService'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const ProfilePage = () => {
  const { user, updateUser, logout, products, fetchProducts } = useContext(StoreContext)
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postalCode || ''
  })
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')

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

  const initials = useMemo(() => {
    const n = String(form.name || '').trim()
    if (!n) return 'U'
    return n.split(' ').map(s => s[0]).join('').toUpperCase()
  }, [form.name])

  useEffect(() => {
    const load = async () => {
      if (!products || products.length === 0) {
        try { await fetchProducts() } catch { void 0 }
      }
      const q = (user?.email && String(user.email).trim().length > 0)
        ? user.email
        : (user?.phone ? String(user.phone).replace(/[^0-9]/g,'') : null)
      if (!q) { setOrders([]); return }
      try {
        setOrdersLoading(true)
        setOrdersError('')
        const res = await listOrders({ q, limit: 20 })
        const list = (res && res.ok && Array.isArray(res.data)) ? res.data : []
        const detailed = []
        for (const o of list) {
          try {
            const det = await getOrderById(o.id)
            if (det && det.ok) {
              const items = det.data.items || []
              detailed.push({
                ...o,
                items: items.map(it => ({ product_id: it.product_id, name: it.product_name, quantity: it.quantity })),
                itemCount: items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
              })
            } else {
              detailed.push({ ...o, items: [], itemCount: 0 })
            }
          } catch {
            detailed.push({ ...o, items: [], itemCount: 0 })
          }
        }
        setOrders(detailed)
      } catch {
        setOrdersError('Gagal memuat pesanan')
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }
    load()
  }, [user, products, fetchProducts])

  const onSave = () => { updateUser(form); setIsEditing(false) }
  const onCancel = () => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      postalCode: user?.postalCode || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="page-shell profile-page">
      <div className="profile-topbar">
        <button className="btn back" onClick={() => navigate('/')}>← Kembali ke Home</button>
        <div className="title">Profil Saya</div>
      </div>
      <div className="layout">
        <aside className="aside">
          <div className="card user-card">
            <div className="user-header">
              <div className="avatar-lg">{initials}</div>
              <div className="user-meta">
                <div className="user-name">{form.name || 'Nama Pengguna'}</div>
                <div className="user-email">{form.email || 'email@example.com'}</div>
              </div>
            </div>
            <div className="user-actions">
              {!isEditing ? (
                <>
                  <button className="btn primary" onClick={() => setIsEditing(true)}>Edit Profil</button>
                  <button className="btn danger" onClick={logout}>Logout</button>
                </>
              ) : (
                <>
                  <button className="btn primary" onClick={onSave}>Simpan</button>
                  <button className="btn ghost" onClick={onCancel}>Batal</button>
                </>
              )}
            </div>
          </div>
        </aside>
        <main className="main">
          <section className="card section">
            <div className="section-title">Informasi Akun</div>
            <div className="grid">
              <div className="field">
                <label>Nama</label>
                <input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} disabled={!isEditing} placeholder="Nama lengkap" />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} disabled={!isEditing} placeholder="email" />
              </div>
              <div className="field">
                <label>No. HP</label>
                <input value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))} disabled={!isEditing} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="field">
                <label>Kota</label>
                <input value={form.city} onChange={e=>setForm(v=>({...v,city:e.target.value}))} disabled={!isEditing} placeholder="Kota" />
              </div>
              <div className="field full">
                <label>Alamat</label>
                <input value={form.address} onChange={e=>setForm(v=>({...v,address:e.target.value}))} disabled={!isEditing} placeholder="Alamat lengkap" />
              </div>
              <div className="field">
                <label>Kode Pos</label>
                <input value={form.postalCode} onChange={e=>setForm(v=>({...v,postalCode:e.target.value}))} disabled={!isEditing} placeholder="Kode pos" />
              </div>
            </div>
          </section>
          <section className="card section">
            <div className="section-title">Pesanan Terakhir</div>
            {ordersLoading && <div className="state info">Memuat pesanan...</div>}
            {ordersError && <div className="state error">{ordersError}</div>}
            {!ordersLoading && orders.length === 0 && <div className="state muted">Belum ada pesanan.</div>}
            {!ordersLoading && orders.length > 0 && (
              <div className="order-list">
                {orders.map(o => {
                  const itemsText = (o.items || []).map(it => `${it.name} x ${it.quantity}`).join(', ')
                  const statusColor = o.status === 'delivered' ? '#27ae60'
                    : o.status === 'shipped' ? '#9b59b6'
                    : o.status === 'processing' ? '#3498db'
                    : o.status === 'cancelled' ? '#e74c3c'
                    : '#f39c12'
                  const first = (o.items || [])[0]
                  const match = first ? (
                    (products || []).find(p => String(p._id) === String(first.product_id)) ||
                    (products || []).find(p => String(p.name).toLowerCase() === String(first.name || '').toLowerCase())
                  ) : null
                  const isBundleName = String(first?.name || '').toLowerCase().includes('paket')
                  const img = isBundleName ? assets.package_icon : (match?.image || assets.bag_icon)
                  return (
                    <div key={o.id} className="order-row">
                      <div className="order-left">
                        <img src={img} alt={first?.name || 'Order'} className="order-photo" />
                        <div className="order-info">
                          <div className="order-items">{itemsText || 'Tanpa item'}</div>
                        </div>
                      </div>
                      <div className="order-right">
                        <div className="order-total">Rp {(Number(o.total) || 0).toLocaleString('id-ID')}</div>
                        <div className="order-count">Items: {o.itemCount || 0}</div>
                        <div className="order-status"><span className="dot" style={{ backgroundColor: statusColor }}></span>{String(o.status || 'pending')}</div>
                        <a className="track" href={`/order-confirmation/${o.id}`}>Lacak Pesanan</a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default ProfilePage
