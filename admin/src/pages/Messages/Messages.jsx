import React, { useEffect, useMemo, useRef, useState } from 'react'
import './Messages.css'
import { assets } from '../../assets/assets'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
)

const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const opt = chart?.options?.plugins?.centerText
    if (!opt || opt.enabled !== true) return
    const ds = chart?.data?.datasets?.[0]?.data || []
    const total = ds.reduce((a, b) => a + b, 0)
    if (!total) return
    const { ctx, chartArea } = chart
    const x = (chartArea.left + chartArea.right) / 2
    const y = (chartArea.top + chartArea.bottom) / 2
    ctx.save()
    ctx.fillStyle = opt.color || '#334155'
    ctx.font = opt.font || '600 14px system-ui, -apple-system, Segoe UI, Roboto'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(total), x, y)
    ctx.restore()
  }
}
ChartJS.register(centerTextPlugin)

const formatTime = (iso) => {
  try {
    const d = new Date(iso)
    return d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const formatDate = (iso) => {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  } catch {
    return ''
  }
}

const Messages = () => {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [timeWindow, setTimeWindow] = useState(7)
  const [showTemplates, setShowTemplates] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [attachments, setAttachments] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const seed = [
      {
        id: 'CONV-001',
        customerName: 'Siti Aminah',
        customerEmail: 'siti@example.com',
        customerPhone: '0812-1111-2222',
        subject: 'Pengiriman pupuk terlambat',
        status: 'open',
        priority: 'high',
        lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        unreadCount: 2,
        assignedTo: 'CS-01',
        tags: ['pengiriman', 'pupuk'],
        messages: [
          { id: 'MSG-001', sender: 'customer', senderName: 'Siti Aminah', content: 'Pesanan saya belum datang.', timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), type: 'text' },
          { id: 'MSG-002', sender: 'admin', senderName: 'Customer Service', content: 'Kami cek status pengiriman ya Bu.', timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), type: 'text' },
          { id: 'MSG-003', sender: 'customer', senderName: 'Siti Aminah', content: 'Baik, terima kasih.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'text' },
        ],
      },
      {
        id: 'CONV-002',
        customerName: 'Budi Santoso',
        customerEmail: 'budi@example.com',
        customerPhone: '0813-3333-4444',
        subject: 'Konsultasi hama tanaman',
        status: 'pending',
        priority: 'medium',
        lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        unreadCount: 1,
        assignedTo: 'Expert',
        tags: ['konsultasi', 'obat'],
        messages: [
          { id: 'MSG-004', sender: 'customer', senderName: 'Budi Santoso', content: 'Daun banyak dimakan ulat, saran insektisida?', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'text' },
          { id: 'MSG-005', sender: 'admin', senderName: 'Customer Service', content: 'Bisa coba insektisida sistemik A.', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), type: 'text' },
        ],
      },
      {
        id: 'CONV-003',
        customerName: 'Ahmad Rahman',
        customerEmail: 'ahmad@example.com',
        customerPhone: '0814-5555-6666',
        subject: 'Cara pakai fungisida',
        status: 'resolved',
        priority: 'low',
        lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        unreadCount: 0,
        assignedTo: 'CS-02',
        tags: ['panduan', 'fungisida'],
        messages: [
          { id: 'MSG-006', sender: 'customer', senderName: 'Ahmad Rahman', content: 'Berapa dosis?', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'text' },
          { id: 'MSG-007', sender: 'admin', senderName: 'Customer Service', content: 'Ikuti label 5ml/L.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), type: 'text' },
          { id: 'MSG-008', sender: 'customer', senderName: 'Ahmad Rahman', content: 'Siap, terima kasih.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'text' },
        ],
      },
    ]

    setConversations(seed)
    setSelectedConversation(seed[0])
    
  }, [])

  const templates = [
    { id: 'TMP-1', title: 'Sapaan CS', content: 'Halo, terima kasih telah menghubungi Taniku. Ada yang bisa kami bantu?' },
    { id: 'TMP-2', title: 'Info Pengiriman', content: 'Pesanan Anda sedang dalam proses dan akan dikirim hari ini.' },
    { id: 'TMP-3', title: 'Penutup', content: 'Terima kasih, jika butuh bantuan lagi silakan hubungi kami kapan saja.' },
  ]

  const filtered = useMemo(() => {
    let list = [...conversations]
    const q = (search || '').trim().toLowerCase()
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean)
      list = list.filter(c => {
        const hay = [
          (c.id || '').toLowerCase(),
          (c.customerName || '').toLowerCase(),
          (c.subject || '').toLowerCase(),
          ...(c.tags || []).map(t => (t || '').toLowerCase()),
          ...(c.messages || []).map(m => (m.content || '').toLowerCase())
        ]
        return terms.every(t => hay.some(h => h.includes(t)))
      })
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter)
    if (priorityFilter !== 'all') list = list.filter(c => c.priority === priorityFilter)
    list.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
    if (sortBy === 'priority') {
      const rank = { high: 0, medium: 1, low: 2 }
      list.sort((a, b) => rank[a.priority] - rank[b.priority])
    }
    return list
  }, [conversations, search, statusFilter, priorityFilter, sortBy])

  const messagesPerDay = useMemo(() => {
    const days = Array.from({ length: timeWindow }).map((_, i) => {
      const d = new Date(Date.now() - (timeWindow - 1 - i) * 24 * 60 * 60 * 1000)
      return d.toISOString().slice(0, 10)
    })
    const counts = days.map(day => {
      let count = 0
      conversations.forEach(c => c.messages.forEach(m => {
        if (m.timestamp.slice(0, 10) === day) count += 1
      }))
      return count
    })
    return { labels: days.map(d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })), data: counts }
  }, [conversations, timeWindow])

  const statusDist = useMemo(() => {
    const keys = ['open', 'pending', 'resolved']
    const counts = keys.map(k => conversations.filter(c => c.status === k).length)
    return { labels: ['Aktif', 'Menunggu', 'Selesai'], data: counts }
  }, [conversations])

  const tagDist = useMemo(() => {
    const map = new Map()
    conversations.forEach(c => (c.tags || []).forEach(t => map.set(t, (map.get(t) || 0) + 1)))
    const labels = Array.from(map.keys())
    const data = Array.from(map.values())
    return { labels, data }
  }, [conversations])

  const avgResponseMinutes = useMemo(() => {
    let diffs = []
    conversations.forEach(c => {
      for (let i = 1; i < c.messages.length; i++) {
        const prev = c.messages[i - 1]
        const cur = c.messages[i]
        if (prev.sender === 'customer' && cur.sender === 'admin') {
          const d = (new Date(cur.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000
          diffs.push(d)
        }
      }
    })
    const avg = diffs.length ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : 0
    return avg
  }, [conversations])

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { color: '#475569' } },
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#475569' } }
    }
  }), [])

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  }), [])

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { color: '#475569' } },
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#475569' } }
    }
  }), [])

  const isEmptyMessages = useMemo(() => (messagesPerDay.data || []).reduce((a, b) => a + b, 0) === 0, [messagesPerDay])
  const isEmptyStatus = useMemo(() => (statusDist.data || []).reduce((a, b) => a + b, 0) === 0, [statusDist])
  const isEmptyTags = useMemo(() => (tagDist.data || []).reduce((a, b) => a + b, 0) === 0, [tagDist])

  const handleSelectConversation = (c) => {
    setSelectedConversation(c)
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return
    const msg = { id: `MSG-${Date.now()}`, sender: 'admin', senderName: 'Customer Service', content: newMessage, timestamp: new Date().toISOString(), type: 'text', attachments }
    const updated = conversations.map(c => c.id === selectedConversation.id ? { ...c, messages: [...c.messages, msg], lastMessageTime: msg.timestamp } : c)
    setConversations(updated)
    setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, msg], lastMessageTime: msg.timestamp } : prev)
    setNewMessage('')
    setAttachments([])
    setShowTemplates(false)
  }

  const onAttachFiles = (e) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size }))])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  return (
    <div className="messages">
      <div className="page-header">
        <div className="header-content">
          <h1>Customer Support</h1>
          <p>Kelola percakapan pelanggan dan pantau performa tim</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary"><img src={assets.stats_icon} alt="stats" /> Laporan</button>
          <button className="btn btn-primary"><img src={assets.chat_icon} alt="new" /> Chat Baru</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card open">
          <div className="stat-icon"><img src={assets.chat_icon} alt="Aktif" style={{width:24,height:24}} /></div>
          <div className="stat-content">
            <div className="stat-number">{conversations.filter(c => c.status === 'open').length}</div>
            <div className="stat-label">Chat Aktif</div>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon"><img src={assets.menunggu_icon} alt="Menunggu" style={{width:24,height:24}} /></div>
          <div className="stat-content">
            <div className="stat-number">{conversations.filter(c => c.status === 'pending').length}</div>
            <div className="stat-label">Menunggu</div>
          </div>
        </div>
        <div className="stat-card unread">
          <div className="stat-icon"><img src={assets.notifiksi_icon} alt="Belum Dibaca" style={{width:24,height:24}} /></div>
          <div className="stat-content">
            <div className="stat-number">{conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)}</div>
            <div className="stat-label">Belum Dibaca</div>
          </div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-icon"><img src={assets.check_icon} alt="Selesai" style={{width:24,height:24}} /></div>
          <div className="stat-content">
            <div className="stat-number">{conversations.filter(c => c.status === 'resolved').length}</div>
            <div className="stat-label">Selesai</div>
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,marginBottom:30}}>
        <div className="chart-card" style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #e2e8f0',position:'relative'}}>
          <h4 style={{margin:'0 0 12px 0'}}>Aktivitas Chat {timeWindow} Hari</h4>
          <div className="chart-body">
            <Line
              data={{
                labels: messagesPerDay.labels,
                datasets: [{ label: 'Pesan/Hari', data: messagesPerDay.data, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.2)', tension: 0.3 }]
              }}
              options={lineOptions}
            />
          </div>
          {isEmptyMessages && (<div className="no-data-overlay">Tidak ada data</div>)}
          <div style={{marginTop:12}}>
            <label>Rentang: </label>
            <select className="status-select" value={timeWindow} onChange={(e)=>setTimeWindow(parseInt(e.target.value))}>
              <option value={7}>7 hari</option>
              <option value={14}>14 hari</option>
              <option value={30}>30 hari</option>
            </select>
          </div>
        </div>
        <div className="chart-card" style={{background:'#fff',borderRadius:12,padding:16,border:'1px solid #e2e8f0',position:'relative'}}>
          <h4 style={{margin:'0 0 12px 0'}}>Distribusi Status</h4>
          <div className="chart-body">
            <Doughnut
              data={{ labels: statusDist.labels, datasets: [{ data: statusDist.data, backgroundColor: ['#22c55e','#f59e0b','#3b82f6'] }] }}
              options={doughnutOptions}
            />
          </div>
          {isEmptyStatus && (<div className="no-data-overlay">Tidak ada data</div>)}
          <div style={{marginTop:12, fontSize:13, color:'#64748b'}}>Rata-rata waktu respons: {avgResponseMinutes} menit</div>
        </div>
        <div className="chart-card" style={{gridColumn:'1 / -1', background:'#fff',borderRadius:12,padding:16,border:'1px solid #e2e8f0',position:'relative'}}>
          <h4 style={{margin:'0 0 12px 0'}}>Top Tags</h4>
          <div className="chart-body">
            <Bar
              data={{ labels: tagDist.labels, datasets: [{ label: 'Jumlah', data: tagDist.data, backgroundColor: '#60a5fa' }] }}
              options={barOptions}
            />
          </div>
          {isEmptyTags && (<div className="no-data-overlay">Tidak ada data</div>)}
        </div>
      </div>

      <div className="chat-container">
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <div className="filters">
              <select className="status-select" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                <option value="all">Semua Status</option>
                <option value="open">Aktif</option>
                <option value="pending">Menunggu</option>
                <option value="resolved">Selesai</option>
              </select>
              <select className="status-select" value={priorityFilter} onChange={(e)=>setPriorityFilter(e.target.value)}>
                <option value="all">Semua Prioritas</option>
                <option value="high">Tinggi</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
              <select className="status-select" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
                <option value="recent">Terbaru</option>
                <option value="priority">Prioritas</option>
              </select>
            </div>
          </div>
          <div className="conversations-list">
            {filtered.map(c => (
              <div key={c.id} className={`conversation-item ${selectedConversation?.id===c.id?'active':''}`} onClick={()=>handleSelectConversation(c)}>
                <div className="customer-info">
                  <div className="customer-avatar small">{c.customerName.charAt(0).toUpperCase()}</div>
                  <div className="customer-details">
                    <h4>{c.customerName}</h4>
                    <p>{c.subject}</p>
                  </div>
                </div>
                <div className="conversation-meta">
                  <span className="time">{formatDate(c.lastMessageTime)} {formatTime(c.lastMessageTime)}</span>
                  {c.unreadCount>0 && <span className="unread-badge">{c.unreadCount}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-area">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="customer-info">
                  <div className="customer-avatar large">{selectedConversation.customerName.charAt(0).toUpperCase()}</div>
                  <div className="customer-details">
                    <h3>{selectedConversation.customerName}</h3>
                    <p>{selectedConversation.subject}</p>
                  </div>
                </div>
                <div className="chat-actions">
                  <select className="status-select" value={selectedConversation.status} onChange={(e)=>{
                    const v=e.target.value
                    setConversations(prev=>prev.map(cv=>cv.id===selectedConversation.id?{...cv,status:v}:cv))
                    setSelectedConversation(prev=>prev?{...prev,status:v}:prev)
                  }}>
                    <option value="open">Aktif</option>
                    <option value="pending">Menunggu</option>
                    <option value="resolved">Selesai</option>
                  </select>
                  <div className="action-buttons">
                    <button className="btn-action" title="Tandai dibaca">📬</button>
                    <button className="btn-action" title="Hapus"><img src={assets.trash_icon} alt="hapus" style={{width:18,height:18}} /></button>
                  </div>
                </div>
              </div>
              <div className="messages-list">
                {selectedConversation.messages.map(m => (
                  <div key={m.id} className={`message ${m.sender==='admin'?'sent':'received'}`}>
                    <div className="message-avatar">
                      {m.sender==='admin' ? (
                        <img src={assets.gojo} alt="CS" style={{width:24,height:24,borderRadius:999}} />
                      ) : (
                        <span>{m.senderName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="sender-name">{m.senderName}</span>
                        <span className="message-time">{formatTime(m.timestamp)}</span>
                      </div>
                      <div className="message-text">{m.content}</div>
                      {m.attachments && m.attachments.length>0 && (
                        <div className="message-attachments" style={{marginTop:8,fontSize:12,color:'#64748b'}}>
                          Lampiran: {m.attachments.map((a,i)=>(<span key={i} style={{marginRight:6}}>{a.name}</span>))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="message-input">
                {showTemplates && (
                  <div className="templates-dropdown">
                    <div className="templates-header"><h4>Template Pesan</h4><button className="btn" onClick={()=>setShowTemplates(false)}>Tutup</button></div>
                    {templates.map(t => (
                      <button key={t.id} className="action-btn" onClick={()=>{setNewMessage(t.content);setShowTemplates(false)}}>{t.title}</button>
                    ))}
                  </div>
                )}
                <div className="input-row" style={{display:'flex',gap:8}}>
                  <button className="btn" onClick={()=>setShowTemplates(v=>!v)}><img src={assets.edit_icon} alt="tpl" /> Template</button>
                  <label className="btn" style={{cursor:'pointer'}}>
                    <img src={assets.package_icon} alt="attach" /> Lampirkan
                    <input type="file" multiple onChange={onAttachFiles} style={{display:'none'}} />
                  </label>
                </div>
                {attachments.length>0 && (
                  <div style={{fontSize:12,color:'#64748b',marginTop:6}}>Lampiran siap kirim: {attachments.map((a,i)=>(<span key={i} style={{marginRight:6}}>{a.name}</span>))}</div>
                )}
                <div className="input-row" style={{display:'flex',gap:8,marginTop:8}}>
                  <input className="message-textarea" placeholder="Tulis pesan..." value={newMessage} onChange={(e)=>setNewMessage(e.target.value)} />
                  <button className="btn btn-primary" onClick={sendMessage}><img src={assets.save_icon} alt="send" /> Kirim</button>
                </div>
              </div>
            </>
          ) : (
            <div className="messages-empty" style={{padding:24,color:'#64748b'}}>Pilih percakapan di sisi kiri</div>
          )}
        </div>

        <div className="customer-panel">
          {selectedConversation && (
            <>
              <div className="customer-search">
                <div className="search-box">
                  <img src={assets.search_icon} alt="Cari" style={{width:18,height:18}} />
                  <input className="search-input" placeholder="Cari nama, subjek, tag" value={search} onChange={(e)=>setSearch(e.target.value)} />
                </div>
              </div>
              <div className="customer-profile">
                <div className="profile-avatar">{selectedConversation.customerName.charAt(0).toUpperCase()}</div>
                <div className="profile-info">
                  <h4>{selectedConversation.customerName}</h4>
                  <p>{selectedConversation.customerEmail}</p>
                  <p>{selectedConversation.customerPhone}</p>
                </div>
              </div>
              <div className="conversation-details">
                <div className="detail-item"><label>ID</label><span>{selectedConversation.id}</span></div>
                <div className="detail-item"><label>Subjek</label><span>{selectedConversation.subject}</span></div>
                <div className="detail-item"><label>Status</label><span>{selectedConversation.status}</span></div>
                <div className="detail-item"><label>Prioritas</label><span>{selectedConversation.priority}</span></div>
                <div className="detail-item"><label>Ditangani</label><span>{selectedConversation.assignedTo}</span></div>
              </div>
              <div className="conversation-tags">
                <label>Tags</label>
                <div className="tags-list">
                  {(selectedConversation.tags||[]).map(t=>(<span key={t} className="tag">{t}</span>))}
                </div>
              </div>
              <div className="quick-actions">
                <h4>Tindakan Cepat</h4>
                <button className="action-btn">Tandai selesai</button>
                <button className="action-btn">Naikkan prioritas</button>
                <button className="action-btn">Assign ke ahli</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages
