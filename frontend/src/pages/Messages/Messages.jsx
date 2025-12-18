import React, { useState, useContext, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import './Messages.css'
import { assets } from '../../assets/assets'
import api from '../../services/api'

const Messages = () => {
  const { notifications, markNotificationAsRead, deleteNotification, addNotification, user } = useContext(StoreContext)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [replyText, setReplyText] = useState('')
  const { id } = useParams()

  const messages = useMemo(() => notifications.filter(n => n.type === 'message' || n.type === 'welcome'), [notifications])
  const unreadCount = useMemo(() => messages.filter(n => !n.isRead).length, [messages])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return messages
    return messages.filter(n => (n.title || '').toLowerCase().includes(q) || (n.sender || '').toLowerCase().includes(q) || (n.message || '').toLowerCase().includes(q))
  }, [messages, query])

  useEffect(() => {
    if (id) {
      const target = messages.find(n => String(n.id) === String(id))
      if (target) {
        setSelected(target)
        if (!target.isRead) markNotificationAsRead(target.id)
      }
    }
  }, [id, messages, markNotificationAsRead])

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const threadReplies = useMemo(() => {
    if (!selected) return []
    return notifications.filter(n => (n.type === 'message') && String(n.replyTo || '') === String(selected.id))
  }, [notifications, selected])

  return (
    <div className="messages-page">
      <div className="messages-wrapper">
        <aside className="messages-sidebar">
          <div className="sidebar-header">
            <h2>Pesan</h2>
            {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
          </div>
          <div className="searchbox">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pesan" />
          </div>
          <div className="messages-list">
            {filtered.length === 0 && (
              <div className="empty-state">Tidak ada pesan</div>
            )}
            {filtered.map((n) => (
              <button key={n.id} className={`message-item ${selected && selected.id === n.id ? 'active' : ''}`} onClick={() => { setSelected(n); if (!n.isRead) markNotificationAsRead(n.id) }}>
                <div className="item-icon">
                  <img src={assets.notifiksi_icon} alt="Pesan" />
                </div>
                <div className="item-content">
                  <div className="item-top">
                    <span className="item-title">{n.title || 'Pesan'}</span>
                    <span className="item-time">{n.timestamp ? formatTimestamp(n.timestamp) : n.time}</span>
                  </div>
                  <div className="item-sub">
                    <span className="item-sender">{n.sender || 'Taniku'}</span>
                    {!n.isRead && <span className="item-unread">Baru</span>}
                  </div>
                  <div className="item-preview">{n.message}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="messages-detail">
          {!selected ? (
            <div className="detail-placeholder">
              <div className="placeholder-icon">
                <img src={assets.notifiksi_icon} alt="Pesan" />
              </div>
              <h3>Pilih pesan untuk melihat detail</h3>
              <p>Kelola komunikasi Anda dengan tampilan yang rapi dan profesional.</p>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-header">
                <div className="header-left">
                  <div className="detail-avatar">
                    <img src={assets.profile_icon} alt="Pengirim" />
                  </div>
                  <div className="detail-title">
                    <h2>{selected.title || 'Pesan'}</h2>
                    <div className="detail-meta">
                      <span className="meta-type">PESAN</span>
                      <span className="meta-sender">{selected.sender || 'Taniku'}</span>
                      <span className="meta-time">{selected.timestamp ? formatTimestamp(selected.timestamp) : selected.time}</span>
                    </div>
                  </div>
                </div>
                <div className="header-actions">
                  <button className="btn-outline" onClick={() => deleteNotification(selected.id)}>Hapus</button>
                </div>
              </div>

              <div className="detail-body">
                <div className="reply-bubble admin">
                  <div className="reply-meta">{selected.sender || 'Admin Taniku'} • {selected.timestamp ? formatTimestamp(selected.timestamp) : selected.time}</div>
                  <div className="reply-text">{selected.message}</div>
                </div>
                {threadReplies.length > 0 && (
                  <div className="thread-list">
                    {threadReplies.map((r) => (
                      <div key={r.id} className="reply-bubble self">
                        <div className="reply-meta">Anda • {formatTimestamp(r.timestamp)}</div>
                        <div className="reply-text">{r.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-footer">
                <div className="reply-box">
                  <textarea
                    className="reply-textarea"
                    placeholder="Tulis balasan untuk admin"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="reply-actions">
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const text = replyText.trim()
                        if (!text) return
                        let userId = null
                        try {
                          if (user && user.id) {
                            userId = user.id
                          } else {
                            const u1 = localStorage.getItem('user_data')
                            if (u1) userId = JSON.parse(u1)?.id || null
                            if (!userId) {
                              const u2 = localStorage.getItem('user')
                              if (u2) userId = JSON.parse(u2)?.id || null
                            }
                          }
                          if (!userId) {
                            const gid = localStorage.getItem('guest_user_id')
                            if (gid) {
                              userId = Number(gid)
                            } else {
                              const newId = Date.now()
                              localStorage.setItem('guest_user_id', String(newId))
                              userId = newId
                            }
                          }
                        } catch (err) { console.warn(err) }
                        addNotification({
                          title: 'Balasan Anda',
                          message: text,
                          type: 'message',
                          sender: 'Anda',
                          replyTo: selected.id,
                          isRead: true,
                        })
                        ;(async () => {
                          try {
                            await api.post('/api/messages.php', {
                              title: 'Balasan Anda',
                              message: text,
                              sender: 'user',
                              replyTo: selected.id,
                              user_id: userId,
                            })
                          } catch (e) {
                            console.error('Gagal menyimpan pesan:', e)
                          }
                        })()
                        setReplyText('')
                      }}
                    >
                      Kirim
                    </button>
                    <button className="btn-success" onClick={() => markNotificationAsRead(selected.id)}>Tandai Dibaca</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Messages
