import React, { useEffect, useMemo, useState } from 'react';
import './Logistik.css';
import { assets } from '../../assets/assets';

const initialShipments = [
  { id: 'SP-2025001', customer: 'Budi Santoso', address: 'Jl. Merdeka No. 10, Jakarta', status: 'Diproses', items: 4, value: 350000, courier: 'JNE', resi: 'JNE123456789', date: '2025-11-01' },
  { id: 'SP-2025002', customer: 'Sari Lestari', address: 'Jl. Sudirman No. 22, Bandung', status: 'Menunggu', items: 2, value: 190000, courier: 'SiCepat', resi: 'SC987654321', date: '2025-11-02' },
  { id: 'SP-2025003', customer: 'Lukman Hadi', address: 'Perum Gading, Blok B-12, Surabaya', status: 'Dikirim', items: 1, value: 95000, courier: 'JNT', resi: 'JNT11223344', date: '2025-11-02' },
  { id: 'SP-2025004', customer: 'Rina Kurnia', address: 'Komplek Anggrek, Tangerang', status: 'Selesai', items: 3, value: 275000, courier: 'POS', resi: 'POS55667788', date: '2025-11-03' },
];

const statusOptions = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai'];
const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

export default function Logistik() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [courier, setCourier] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [detail, setDetail] = useState(null);
  const [rows, setRows] = useState(initialShipments);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
  const envBase = import.meta.env.VITE_API_BASE;
  const fallbackBase = `http://${host}:5176`;
  const API_BASE = (() => {
    try {
      if (typeof envBase === 'string' && envBase.trim().length > 0) {
        const u = new URL(envBase);
        if (['5173','5174','5175','5177'].includes(u.port)) {
          return fallbackBase;
        }
        return envBase;
      }
      return fallbackBase;
    } catch {
      return fallbackBase;
    }
  })();
  const LOGISTICS_ENDPOINT = `${API_BASE}/api/orders.php?view=logistics`;
  const TRACKING_ENDPOINT = `${API_BASE}/api/tracking.php`;

  useEffect(() => { setPage(1); }, [query, status, courier, dateFrom, dateTo]);

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (status) {
          const map = { 'Menunggu': 'pending', 'Diproses': 'processing', 'Dikirim': 'shipped', 'Selesai': 'delivered' };
          const s = map[status] || '';
          if (s) params.set('status', s);
        }
        if (courier) params.set('courier', courier);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        params.set('sort', sortBy);
        params.set('dir', sortDir);
        params.set('page', String(page));
        params.set('limit', String(perPage));
        const res = await fetch(`${LOGISTICS_ENDPOINT}&${params.toString()}`);
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : null;
        if (!res.ok || !(data && data.ok)) {
          return;
        }
        const mapStatus = { pending: 'Menunggu', processing: 'Diproses', shipped: 'Dikirim', delivered: 'Selesai', cancelled: 'Dibatalkan' };
        const mapped = (data.data || []).map(r => ({
          id: r.order_code || `ORD-${r.id}`,
          customer: r.customer_name,
          address: r.shipping_address,
          status: mapStatus[r.status] || r.status,
          items: r.items,
          value: Math.round(Number(r.total) || 0),
          courier: r.courier || '-',
          resi: r.tracking_code || '',
          date: r.order_date
        }));
        setRows(mapped);
      } catch {
        setRows(initialShipments);
      }
    };
    load();
  }, [LOGISTICS_ENDPOINT, query, status, courier, dateFrom, dateTo, sortBy, sortDir, page, perPage]);

  const filtered = useMemo(() => {
    let data = [...rows];
    if (query) {
      const q = query.toLowerCase();
      data = data.filter(r => r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || r.address.toLowerCase().includes(q) || (r.resi || '').toLowerCase().includes(q));
    }
    if (status) data = data.filter(r => r.status === status);
    if (courier) data = data.filter(r => r.courier === courier);
    if (dateFrom) data = data.filter(r => r.date >= dateFrom);
    if (dateTo) data = data.filter(r => r.date <= dateTo);
    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'date') return (a.date.localeCompare(b.date)) * dir;
      if (sortBy === 'value') return (a.value - b.value) * dir;
      if (sortBy === 'customer') return a.customer.localeCompare(b.customer) * dir;
      return a.id.localeCompare(b.id) * dir;
    });
    return data;
  }, [rows, query, status, courier, dateFrom, dateTo, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => filtered.slice((page - 1) * perPage, (page - 1) * perPage + perPage), [filtered, page, perPage]);

  const toggleSelected = (id) => { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); };
  const allSelected = selected.length > 0 && selected.length === paged.length;
  const toggleSelectAll = () => { if (allSelected) setSelected([]); else setSelected(paged.map(r => r.id)); };

  const courierOptions = ['JNE','SiCepat','JNT','POS','TIKI','Ninja'];
  const handleCourierChange = async (row, newCourier) => {
    const prev = row.courier;
    setRows(rs => rs.map(r => (r.id === row.id ? { ...r, courier: newCourier } : r)));
    try {
      const body = new URLSearchParams({ code: row.resi || row.id, courier: newCourier });
      const res = await fetch(TRACKING_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const ok = res.ok;
      if (!ok) { throw new Error('Update gagal'); }
    } catch {
      setRows(rs => rs.map(r => (r.id === row.id ? { ...r, courier: prev } : r)));
      alert('Gagal menyimpan kurir ke server');
    }
  };

  const exportCSV = () => {
    const header = 'ID,Pelanggan,Alamat,Status,Items,Nominal,Kurir,Resi,Tanggal\n';
    const rowsCsv = filtered.map(r => [r.id, r.customer, r.address, r.status, r.items, r.value, r.courier, r.resi, r.date].join(',')).join('\n');
    const blob = new Blob([header + rowsCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `logistik_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const bulkDelete = () => { if (selected.length === 0) return; setRows(prev => prev.filter(r => !selected.includes(r.id))); setSelected([]); };
  const resetFilters = () => { setQuery(''); setStatus(''); setCourier(''); setDateFrom(''); setDateTo(''); setSortBy('date'); setSortDir('desc'); setPage(1); };

  const addNewShipment = (e) => {
    e.preventDefault();
    const form = e.target;
    const newRow = {
      id: form.id.value || `SP-${Math.floor(Math.random()*1e6)}`,
      customer: form.customer.value,
      address: form.address.value,
      status: form.status.value || 'Menunggu',
      items: Number(form.items.value || 1),
      value: Number(form.value.value || 0),
      courier: form.courier.value || 'JNE',
      resi: form.resi.value || '',
      date: form.date.value || new Date().toISOString().slice(0,10)
    };
    setRows(prev => [newRow, ...prev]);
    setShowAdd(false);
    form.reset();
  };

  const summary = useMemo(() => {
    const total = rows.length;
    const menunggu = rows.filter(r => r.status === 'Menunggu').length;
    const diproses = rows.filter(r => r.status === 'Diproses').length;
    const dikirim = rows.filter(r => r.status === 'Dikirim').length;
    const selesai = rows.filter(r => r.status === 'Selesai').length;
    const value = rows.reduce((acc, r) => acc + r.value, 0);
    return { total, menunggu, diproses, dikirim, selesai, value };
  }, [rows]);

  return (
    <div className="logistik-page">
      <header className="logistik-header">
        <div className="title-group">
          <img src={assets.package_icon || assets.maps_icon} alt="Logistik" className="title-icon" />
          <div>
            <h1>Logistik</h1>
            <p>Manajemen pengiriman, kurir, dan status</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn primary" onClick={() => setShowAdd(true)}>
            <img src={assets.add_icon_white} alt="Tambah" />
            Tambah Pengiriman
          </button>
          <button className="btn outline" onClick={exportCSV}>
            <img src={assets.save_icon} alt="Export" />
            Export CSV
          </button>
          <button className="btn ghost" onClick={resetFilters}>Reset</button>
        </div>
      </header>

      <section className="summary">
        <div className="card">
          <img src={assets.menunggu_icon || assets.stats_icon} alt="Menunggu" />
          <div>
            <span className="label">Menunggu</span>
            <strong>{summary.menunggu}</strong>
          </div>
        </div>
        <div className="card">
          <img src={assets.diprosees_icon || assets.stats_icon} alt="Diproses" />
          <div>
            <span className="label">Diproses</span>
            <strong>{summary.diproses}</strong>
          </div>
        </div>
        <div className="card">
          <img src={assets.dikirim_icon || assets.stats_icon} alt="Dikirim" />
          <div>
            <span className="label">Dikirim</span>
            <strong>{summary.dikirim}</strong>
          </div>
        </div>
        <div className="card">
          <img src={assets.check_icon || assets.stats_icon} alt="Selesai" />
          <div>
            <span className="label">Selesai</span>
            <strong>{summary.selesai}</strong>
          </div>
        </div>
        <div className="card">
          <img src={assets.wallet_icon || assets.stats_icon} alt="Nominal" />
          <div>
            <span className="label">Nominal</span>
            <strong>{formatCurrency(summary.value)}</strong>
          </div>
        </div>
      </section>

      <section className="controls">
        <div className="search">
          <div className="search-input">
            <img src={assets.search_icon} alt="Cari" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari ID, pelanggan, alamat, atau resi" />
          </div>
        </div>
        <div className="filters">
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Semua Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={courier} onChange={e => setCourier(e.target.value)}>
            <option value="">Semua Kurir</option>
            <option>JNE</option>
            <option>SiCepat</option>
            <option>JNT</option>
            <option>POS</option>
          </select>
          <div className="date-range">
            <img src={assets.calender_icon} alt="tanggal" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span>—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="sort">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">Urutkan: Tanggal</option>
            <option value="value">Urutkan: Nominal</option>
            <option value="customer">Urutkan: Pelanggan</option>
            <option value="id">Urutkan: ID</option>
          </select>
          <button className="btn sort" onClick={() => setSortDir(d => d==='asc'?'desc':'asc')}>
            {sortDir === 'asc' ? 'Naik' : 'Turun'}
          </button>
        </div>
      </section>

      <section className="bulk-actions">
        <span className="bulk-count">Dipilih: {selected.length}</span>
        <button className="btn danger" onClick={bulkDelete} disabled={selected.length===0}>
          <img src={assets.trash_icon} alt="hapus" />
          Hapus
        </button>
      </section>

      <section className="table-wrap card">
        <table className="logistik-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></th>
              <th>ID</th>
              <th>Pelanggan</th>
              <th>Status</th>
              <th>Items</th>
              <th>Nominal</th>
              <th>Kurir</th>
              <th>Resi</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className={detail?.id === r.id ? 'active' : ''}>
                <td><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelected(r.id)} /></td>
                <td>{r.id}</td>
                <td>
                  <div className="cell-main">
                    <strong>{r.customer}</strong>
                    <small>{r.address}</small>
                  </div>
                </td>
                <td>
                  <span className={`badge ${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>
                <td>{r.items}</td>
                <td>{formatCurrency(r.value)}</td>
                <td>
                  <select value={r.courier} onChange={(e) => handleCourierChange(r, e.target.value)}>
                    <option value="-">Semua Kurir</option>
                    {courierOptions.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </td>
                <td>{r.resi || '-'}</td>
                <td>{r.date}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn ghost" onClick={() => setDetail(r)}>Detail</button>
                    <button className="btn" onClick={() => alert('Edit coming soon')}>
                      <img src={assets.edit_icon} alt="edit" />
                    </button>
                    <button className="btn danger" onClick={() => setRows(prev => prev.filter(x => x.id !== r.id))}>
                      <img src={assets.trash_icon} alt="hapus" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={10} className="empty">Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <div className="pagination">
            <button className="btn" disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
            <span>Halaman {page} / {totalPages}</span>
            <button className="btn" disabled={page===totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</button>
          </div>
          <div className="per-page">
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
              {[10,20,50].map(n => <option key={n} value={n}>{n} / halaman</option>)}
            </select>
          </div>
        </div>
      </section>

      <aside className={`detail-panel ${detail ? 'open' : ''}`}>
        <div className="detail-header">
          <h3>Detail Pengiriman</h3>
          <button className="btn ghost" onClick={() => setDetail(null)}>✕</button>
        </div>
        {detail ? (
          <div className="detail-body">
            <div className="detail-row"><span className="label">ID</span><span className="value">{detail.id}</span></div>
            <div className="detail-row"><span className="label">Pelanggan</span><span className="value">{detail.customer}</span></div>
            <div className="detail-row"><span className="label">Alamat</span><span className="value">{detail.address}</span></div>
            <div className="detail-row"><span className="label">Status</span><span className="value">{detail.status}</span></div>
            <div className="detail-row"><span className="label">Items</span><span className="value">{detail.items}</span></div>
            <div className="detail-row"><span className="label">Nominal</span><span className="value">{formatCurrency(detail.value)}</span></div>
            <div className="detail-row"><span className="label">Kurir</span><span className="value">{detail.courier}</span></div>
            <div className="detail-row"><span className="label">Resi</span><span className="value">{detail.resi || '-'}</span></div>
            <div className="detail-row"><span className="label">Tanggal</span><span className="value">{detail.date}</span></div>
          </div>
        ) : (
          <div className="detail-empty">Pilih baris untuk melihat detail</div>
        )}
      </aside>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Pengiriman</h3>
              <button className="btn ghost" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={addNewShipment}>
              <div className="form-grid">
                <label> ID <input name="id" placeholder="SP-..." /> </label>
                <label> Pelanggan <input name="customer" required /> </label>
                <label> Alamat <input name="address" required /> </label>
                <label> Status <select name="status" defaultValue="Menunggu">{statusOptions.map(s => <option key={s} value={s}>{s}</option>)}</select> </label>
                <label> Items <input type="number" min="1" name="items" defaultValue="1" /> </label>
                <label> Nominal <input type="number" min="0" name="value" defaultValue="0" /> </label>
                <label> Kurir <select name="courier" defaultValue="JNE"><option>JNE</option><option>SiCepat</option><option>JNT</option><option>POS</option></select> </label>
                <label> Resi <input name="resi" /> </label>
                <label> Tanggal <input type="date" name="date" defaultValue={new Date().toISOString().slice(0,10)} /> </label>
              </div>
              <div className="modal-footer">
                <button className="btn" type="button" onClick={() => setShowAdd(false)}>Batal</button>
                <button className="btn primary" type="submit">
                  <img src={assets.add_icon_white} alt="Tambah" /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
