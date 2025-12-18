import React, { useMemo, useState, useEffect, useRef } from 'react';
import { assets } from '../../assets/assets';
import './Tracking.css';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
const statusStages = ['In Transit', 'Out for Delivery', 'Delivered'];

const Tracking = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [courier, setCourier] = useState('');
  const [active, setActive] = useState(null);
  const [newMapUrl, setNewMapUrl] = useState('');
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const trackingStages = statusStages;
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
  const TRACKING_ENDPOINT = `${API_BASE}/api/tracking.php`;
  const ORDERS_ENDPOINT = `${API_BASE}/api/orders.php`;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const processedRef = useRef(new Set());

  const parseLatLng = (u) => {
    try {
      const s = String(u || '');
      const m1 = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m1) { const lat = Number(m1[1]); const lng = Number(m1[2]); if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }; }
      const m2 = s.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m2) { const lat = Number(m2[1]); const lng = Number(m2[2]); if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }; }
      return null;
    } catch { return null; }
  };

  const geocodeQueryAny = async (q) => {
    const tryProviders = [
      async (query) => {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) return null; const a = await r.json();
        if (Array.isArray(a) && a[0]) { const lat = a[0].lat != null ? Number(a[0].lat) : null; const lon = a[0].lon != null ? Number(a[0].lon) : null; if (lat != null && lon != null) return { lat, lng: lon }; }
        return null;
      },
      async (query) => {
        const r = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(query)}&limit=1`, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) return null; const a = await r.json();
        if (Array.isArray(a) && a[0]) { const lat = a[0].lat != null ? Number(a[0].lat) : null; const lon = a[0].lon != null ? Number(a[0].lon) : null; if (lat != null && lon != null) return { lat, lng: lon }; }
        return null;
      },
      async (query) => {
        const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) return null; const a = await r.json();
        if (a && a.features && a.features[0] && a.features[0].geometry && Array.isArray(a.features[0].geometry.coordinates)) {
          const lon = Number(a.features[0].geometry.coordinates[0]); const lat = Number(a.features[0].geometry.coordinates[1]); if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lng: lon };
        }
        return null;
      }
    ];
    for (const fn of tryProviders) { try { const res = await fn(q); if (res) return res; } catch { void 0; } }
    return null;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError('');
        const [resTrack, resOrders, resTrackAlt, resOrdersAlt] = await Promise.all([
          fetch(TRACKING_ENDPOINT).catch(()=>null),
          fetch(`${ORDERS_ENDPOINT}?limit=200`).catch(()=>null),
          fetch(`${API_BASE}/tracking`).catch(()=>null),
          fetch(`${API_BASE}/orders?limit=200`).catch(()=>null),
        ]);
        const dataTrack = resTrack ? await resTrack.json() : null;
        const dataOrders = resOrders.ok ? await resOrders.json().catch(()=>null) : null;
        const dataTrackAlt = resTrackAlt && resTrackAlt.ok ? await resTrackAlt.json().catch(()=>null) : null;
        const dataOrdersAlt = resOrdersAlt && resOrdersAlt.ok ? await resOrdersAlt.json().catch(()=>null) : null;
        const trackSource = (dataTrack && dataTrack.ok) ? dataTrack : (dataTrackAlt && dataTrackAlt.ok ? dataTrackAlt : null);
        if (!trackSource) throw new Error('Gagal memuat tracking');
        const trackRows = (trackSource.data || []).map(t => ({
          db_id: t.id,
          id: (t.tracking_code || `TRK-${t.order_id}`),
          tracking_code: (t.tracking_code || `TRK-${t.order_id}`),
          order_id: t.order_id,
          order_code: t.order_code,
          courier: t.courier || '—',
          status: t.status || 'In Transit',
          lastLocation: t.last_location || '—',
          map_url: t.map_url || '',
          eta: t.eta || '',
          lat: t.lat != null ? Number(t.lat) : -6.2,
          lng: t.lng != null ? Number(t.lng) : 106.8,
        }));
        const orderRows = (dataOrders && dataOrders.ok && Array.isArray(dataOrders.data))
          ? dataOrders.data
          : ((dataOrdersAlt && dataOrdersAlt.ok && Array.isArray(dataOrdersAlt.data)) ? dataOrdersAlt.data : []);
        const byId = new Map(trackRows.map(r => [r.tracking_code || r.order_code, r]));
        for (const o of orderRows) {
          const key = (o.tracking_code && o.tracking_code.trim().length > 0) ? o.tracking_code : (o.order_code || `ORD-${o.id}`);
          const mu = o.map_url || '';
          const ex = byId.get(key);
          if (ex) {
            if (mu && !ex.map_url) {
              ex.map_url = mu;
              const p = parseLatLng(mu);
              if (p) { ex.lat = p.lat; ex.lng = p.lng; }
            }
          } else {
            const p = parseLatLng(mu);
            byId.set(key, {
              db_id: null,
              id: key,
              tracking_code: key,
              order_id: o.id,
              order_code: o.order_code,
              courier: '—',
              status: o.status || 'In Transit',
              lastLocation: o.shipping_address || '—',
              map_url: mu,
              eta: '',
              lat: p ? p.lat : -6.2,
              lng: p ? p.lng : 106.8,
            });
          }
          if (!mu && o.shipping_address) {
            const q = o.shipping_address;
            geocodeQueryAny(q).then(g => {
              if (g) {
                setRows(prev => {
                  const exists = prev.find(x => (x.tracking_code === key));
                  if (exists) {
                    return prev.map(x => x.tracking_code === key ? { ...x, lat: g.lat, lng: g.lng, map_url: `https://www.google.com/maps?q=${encodeURIComponent(q)}` } : x);
                  }
                  return prev.concat([{
                    db_id: null,
                    id: key,
                    tracking_code: key,
                    order_id: o.id,
                    order_code: o.order_code,
                    courier: '—',
                    status: o.status || 'In Transit',
                    lastLocation: o.shipping_address || '—',
                    map_url: `https://www.google.com/maps?q=${encodeURIComponent(q)}`,
                    eta: '',
                    lat: g.lat,
                    lng: g.lng,
                  }]);
                });
              }
            }).catch(()=>{});
          }
        }
        const merged = Array.from(byId.values());
        setRows(merged);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [TRACKING_ENDPOINT, ORDERS_ENDPOINT]);

  useEffect(() => {
    const run = async () => {
      const upd = [];
      for (const r of rows) {
        if (!r || !r.map_url) continue;
        const key = r.tracking_code;
        if (processedRef.current.has(key)) continue;
        const hasValid = Number.isFinite(r.lat) && Number.isFinite(r.lng) && !(r.lat === -6.2 && r.lng === 106.8);
        if (hasValid) { processedRef.current.add(key); continue; }
        const p = parseLatLng(r.map_url);
        if (p) { upd.push({ code: key, lat: p.lat, lng: p.lng }); processedRef.current.add(key); }
        else {
          const u = String(r.map_url);
          let q = null;
          const mq = u.match(/[?&]query=([^&]+)/);
          if (mq) q = decodeURIComponent(mq[1]);
          if (!q) { const mp = u.match(/\/place\/([^/]+)/); if (mp) q = decodeURIComponent(mp[1]); }
          if (q) {
            const g = await geocodeQueryAny(q);
            if (g) { upd.push({ code: key, lat: g.lat, lng: g.lng }); processedRef.current.add(key); }
          }
        }
      }
      if (upd.length) {
        setRows(prev => prev.map(r => {
          const f = upd.find(u => u.code === r.tracking_code);
          return f ? { ...r, lat: f.lat, lng: f.lng } : r;
        }));
      }
    };
    if (rows && rows.length) { run(); }
  }, [rows, TRACKING_ENDPOINT]);

  const openMaps = async () => {
    if (!active) return;
    const link = active.map_url || `https://maps.google.com/?q=${active.lat},${active.lng}`;
    const params = new URLSearchParams();
    params.set('map_url', link);
    params.set('lat', '');
    params.set('lng', '');
    if (active.db_id != null) { params.set('id', String(active.db_id)); }
    params.set('code', active.tracking_code);
    const fields = params.toString();
    const target = active.db_id ? `${TRACKING_ENDPOINT}?id=${encodeURIComponent(active.db_id)}` : `${TRACKING_ENDPOINT}?code=${encodeURIComponent(active.tracking_code)}`;
    const fallbackTarget = `${target}&_method=PATCH`;
    try {
      let respPatch, jr;
      try {
        respPatch = await fetch(target, { method: 'PATCH', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fields });
        jr = await respPatch.json().catch(() => ({}));
      } catch {
        respPatch = await fetch(fallbackTarget, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fields });
        jr = await respPatch.json().catch(() => ({}));
      }
      if (respPatch.ok && jr && jr.ok) {
        setRows(prev => prev.map(r => ((active.db_id && r.db_id === active.db_id) || r.tracking_code === active.tracking_code) ? { ...r, map_url: link } : r));
        setActive(a => a ? { ...a, map_url: link } : a);
        try {
          const refUrl = active.db_id ? `${TRACKING_ENDPOINT}?id=${encodeURIComponent(active.db_id)}` : `${TRACKING_ENDPOINT}?code=${encodeURIComponent(active.tracking_code)}`;
          const rf = await fetch(refUrl);
          const j = await rf.json();
          if (rf.ok && j && j.ok && j.data) {
            const t = j.data;
            setRows(prev => prev.map(r => ((active.db_id && r.db_id === active.db_id) || r.tracking_code === active.tracking_code) ? { ...r, map_url: t.map_url || r.map_url } : r));
            setActive(a => a ? { ...a, map_url: t.map_url || a.map_url } : a);
          }
        } catch { void 0; }
      } else {
        setError(`Gagal menyimpan: ${jr && jr.error ? jr.error : respPatch.statusText}`);
      }
    } catch (e) { setError(`Gagal menyimpan: ${e.message}`); }
    window.open(link, '_blank', 'noopener');
  };

  const saveMapUrl = async () => {
    if (!active || !newMapUrl) { setError('Pilih baris tracking dan isi link terlebih dahulu'); return; }
    const params = new URLSearchParams();
    params.set('map_url', newMapUrl);
    params.set('lat', '');
    params.set('lng', '');
    if (active.db_id != null) { params.set('id', String(active.db_id)); }
    params.set('code', active.tracking_code);
    const fields = params.toString();
    const target = active.db_id ? `${TRACKING_ENDPOINT}?id=${encodeURIComponent(active.db_id)}` : `${TRACKING_ENDPOINT}?code=${encodeURIComponent(active.tracking_code)}`;
    const fallbackTarget = `${target}&_method=PATCH`;
    let res, jr;
    try {
      res = await fetch(target, { method: 'PATCH', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fields });
      jr = await res.json().catch(() => ({}));
    } catch {
      res = await fetch(fallbackTarget, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fields });
      jr = await res.json().catch(() => ({}));
    }
    if (res.ok && jr && jr.ok) {
      setRows(prev => prev.map(r => ((active.db_id && r.db_id === active.db_id) || r.tracking_code === active.tracking_code) ? { ...r, map_url: newMapUrl } : r));
      setActive(a => a ? { ...a, map_url: newMapUrl } : a);
      try {
        const refUrl = active.db_id ? `${TRACKING_ENDPOINT}?id=${encodeURIComponent(active.db_id)}` : `${TRACKING_ENDPOINT}?code=${encodeURIComponent(active.tracking_code)}`;
        const rf = await fetch(refUrl);
        const j = await rf.json();
        if (rf.ok && j && j.ok && j.data) {
          const t = j.data;
          setRows(prev => prev.map(r => ((active.db_id && r.db_id === active.db_id) || r.tracking_code === active.tracking_code) ? { ...r, map_url: t.map_url || r.map_url } : r));
          setActive(a => a ? { ...a, map_url: t.map_url || a.map_url } : a);
        }
      } catch { void 0; }
      setNewMapUrl('');
    } else {
      setError(`Gagal menyimpan: ${jr && jr.error ? jr.error : res.statusText}`);
    }
  };


  const filtered = useMemo(() => {
    return rows.filter(r => (
      (!query || r.id.toLowerCase().includes(query.toLowerCase())) &&
      (!status || r.status === status) &&
      (!courier || r.courier === courier)
    ));
  }, [rows, query, status, courier]);

  // Inisialisasi peta sekali
  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = L.map('tracking-map').setView([-6.2, 106.8], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);
  }, []);

  // Perbarui marker setiap data terfilter berubah
  useEffect(() => {
    if (!mapRef.current) return;
    if (markersLayerRef.current) {
      markersLayerRef.current.remove();
    }
    markersLayerRef.current = L.layerGroup();
    const pts = [];
    filtered.forEach(r => {
      let lat = r.lat; let lng = r.lng;
      const valid = Number.isFinite(lat) && Number.isFinite(lng);
      if (!valid) {
        const p = parseLatLng(r.map_url);
        if (p) { lat = p.lat; lng = p.lng; }
        else {
          const u = String(r.map_url || '');
          let q = null;
          const mq = u.match(/[?&]query=([^&]+)/);
          if (mq) q = decodeURIComponent(mq[1]);
          if (!q) {
            const mq2 = u.match(/[?&]q=([^&]+)/);
            if (mq2) q = decodeURIComponent(mq2[1]);
          }
          if (!q) { const mp = u.match(/\/place\/([^/]+)/); if (mp) q = decodeURIComponent(mp[1]); }
          if (q) {
            // Best-effort geocode client-side
            // Note: non-blocking, markers may update on next render
            geocodeQueryAny(q).then(g => {
              if (g) {
                setRows(prev => prev.map(x => x.tracking_code === r.tracking_code ? { ...x, lat: g.lat, lng: g.lng } : x));
              }
            }).catch(()=>{});
          }
        }
      }
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const marker = L.marker([lat, lng]);
        marker.bindPopup(`<strong>${r.id}</strong><br/>${r.courier}<br/>${r.status}`);
        markersLayerRef.current.addLayer(marker);
        pts.push([lat, lng]);
      }
    });
    markersLayerRef.current.addTo(mapRef.current);
    if (pts.length) { const bounds = L.latLngBounds(pts); mapRef.current.fitBounds(bounds, { padding: [20, 20] }); }
  }, [filtered]);

  // Fokus ke item aktif
  useEffect(() => {
    if (active && mapRef.current) {
      let lat = active.lat; let lng = active.lng;
      if (!(Number.isFinite(lat) && Number.isFinite(lng))) { const p = parseLatLng(active.map_url); if (p) { lat = p.lat; lng = p.lng; } }
      if (Number.isFinite(lat) && Number.isFinite(lng)) { mapRef.current.setView([lat, lng], 12); }
    }
  }, [active]);

  const exportCsv = () => {
    const header = 'ID,Courier,Status,Last Location,ETA,Lat,Lng\n';
    const rows = filtered.map(r => [r.id, r.courier, r.status, r.lastLocation, r.eta, r.lat, r.lng].join(',')).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tracking_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };


  return (
    <div className="tracking-page">
      <div className="tracking-header">
        <div className="icon">
          <img src={assets.maps_icon} alt="Tracking" />
        </div>
        <h1>Tracking</h1>
        <p className="subtitle">Location Tracking</p>
      </div>

      {/* Quick navigation */}
      <div className="tracking-nav" style={{ marginBottom: '12px' }}>
        <a className="btn btn-secondary" href="/logistik">Logistik</a>
        <a className="btn btn-primary" href="/tracking">Tracking</a>
      </div>

      <div className="tracking-controls card">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari ID Tracking" />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option>In Transit</option>
          <option>Out for Delivery</option>
          <option>Delivered</option>
        </select>
        <select value={courier} onChange={e => setCourier(e.target.value)}>
          <option value="">Semua Kurir</option>
          <option>JNE</option>
          <option>SiCepat</option>
          <option>POS</option>
        </select>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="tracking-content">
        {loading && <div className="card" style={{marginBottom:'12px'}}>Memuat data tracking...</div>}
        {error && <div className="card" style={{marginBottom:'12px', color:'#b91c1c'}}>Gagal memuat: {error}</div>}
        <table className="tracking-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Kurir</th>
              <th>Status</th>
              <th>Lokasi Terakhir</th>
              <th>ETA</th>
              <th>Koordinat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className={active?.id === r.id ? 'active' : ''} onClick={() => setActive(r)}>
                <td>{r.id}</td>
                <td>{r.courier}</td>
                <td>{r.status}</td>
                <td>{r.lastLocation}</td>
                <td>{r.eta}</td>
                <td>{r.lat}, {r.lng}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div id="tracking-map" className="tracking-map card"></div>
        {active && (
          <div className="progress card">
            <div className="progress-header">
              <img src={assets.package_icon || assets.maps_icon} alt="" />
              <div>
                <strong>{active.id}</strong>
                <p>{active.courier} • {active.lastLocation}</p>
                {(active.map_url || (active.lat && active.lng)) && (
                  <a className="link-button" href={active.map_url || `https://maps.google.com/?q=${active.lat},${active.lng}`} target="_blank" rel="noreferrer" onClick={(e)=>{ e.preventDefault(); openMaps(); }}>Buka Maps</a>
                )}
              </div>
            </div>
            <div className="card map-card">
              <div className="map-input-group">
                <input className="map-url" value={newMapUrl} onChange={e=>setNewMapUrl(e.target.value)} placeholder="Tempel link Google Maps" />
                <button className="btn btn-primary" onClick={saveMapUrl} disabled={!active || !newMapUrl}>Simpan Link</button>
              </div>
            </div>
            {(() => {
              const u = String(active.map_url || '');
              let q = '';
              const m1 = u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
              const m2 = u.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
              if (m1 || m2) { q = `${m1 ? m1[1] : m2[1]},${m1 ? m1[2] : m2[2]}`; }
              if (!q) {
                const mq = u.match(/[?&]query=([^&]+)/);
                if (mq) { q = decodeURIComponent(mq[1]); }
              }
              if (!q) {
                const mp = u.match(/\/place\/([^/]+)/);
                if (mp) { q = decodeURIComponent(mp[1]); }
              }
              if (!q && active.lat && active.lng) { q = `${active.lat},${active.lng}`; }
              const src = q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed` : null;
              return src ? (
                <div className="card" style={{ padding: 0, marginTop: '10px' }}>
                  <iframe title="Google Maps" src={src} style={{ width: '100%', height: 300, border: 0 }} allowFullScreen loading="lazy"></iframe>
                </div>
              ) : null;
            })()}
            <div className="progress-steps">
              {trackingStages.map((st, idx) => {
                const done = trackingStages.indexOf(active.status) >= idx;
                return (
                  <div key={st} className={`step ${done ? 'done' : ''}`}>
                    <div className="dot"></div>
                    <span className="label">{st}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;
