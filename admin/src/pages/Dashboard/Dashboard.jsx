import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { assets } from '../../assets/assets';
import './Dashboard.css';

function Dashboard() {
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('7d'); // 7d | 30d | 12m
  const [fullscreen, setFullscreen] = useState(null); // 'profit' | 'aov' | 'status' | 'orders' | null
  const profitRef = useRef(null);
  const aovRef = useRef(null);
  const statusRef = useRef(null);
  const ordersRef = useRef(null);
  const profitChartObj = useRef(null);
  const aovChartObj = useRef(null);
  const statusChartObj = useRef(null);
  const ordersChartObj = useRef(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topError, setTopError] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [kpiOverride, setKpiOverride] = useState(null);
  const statusMap = useRef({ pending: 0, processing: 1, shipped: 2, delivered: 3, completed: 3, selesai: 3, finished: 3, done: 3 });

  // Util: ekspor CSV dari chart.js
  const exportChartCSV = (chartObj, filename) => {
    const chart = chartObj;
    if (!chart) return;
    const labels = chart.data.labels || [];
    const datasets = chart.data.datasets || [];
    const header = ['Label', ...datasets.map(d => d.label || 'Series')].join(',');
    let csv = header + '\n';
    const maxLen = labels.length || (datasets[0]?.data?.length || 0);
    for (let i = 0; i < maxLen; i++) {
      const label = labels[i] ?? `Item ${i + 1}`;
      const values = datasets.map(d => (Array.isArray(d.data) ? d.data[i] ?? '' : ''));
      csv += [label, ...values].join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const getTimeframeData = (tf) => {
    const genSeries = (n, base, varr) => Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i / 3) * varr + (i % 5) * 2));
    if (tf === '7d') {
      const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      return {
        labels,
        profit: genSeries(7, 200, 60),
        refund: genSeries(7, 15, 5),
        aov: genSeries(7, 85, 10),
        orders: genSeries(7, 150, 40),
        status: [15, 28, 22, 40]
      };
    }
    if (tf === '30d') {
      const labels = Array.from({ length: 30 }, (_, i) => `D${i + 1}`);
      return {
        labels,
        profit: genSeries(30, 210, 50),
        refund: genSeries(30, 16, 6),
        aov: genSeries(30, 88, 12),
        orders: genSeries(30, 160, 45),
        status: [40, 90, 70, 130]
      };
    }
    // 12m
    const labels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return {
      labels,
      profit: genSeries(12, 230, 55),
      refund: genSeries(12, 18, 6),
      aov: genSeries(12, 92, 10),
      orders: genSeries(12, 170, 50),
      status: [60, 120, 95, 180]
    };
  };

  const getProfitData = (tf) => (profitChartObj.current?.data?.datasets?.[0]?.data) || getTimeframeData(tf).profit;
  const getAovData = (tf) => (aovChartObj.current?.data?.datasets?.[0]?.data) || getTimeframeData(tf).aov;
  const getOrdersData = (tf) => (ordersChartObj.current?.data?.datasets?.[0]?.data) || getTimeframeData(tf).orders;
  const getStatusData = (tf) => (statusChartObj.current?.data?.datasets?.[0]?.data) || getTimeframeData(tf).status;
  const sum = (arr) => (arr || []).reduce((a, b) => a + (Number(b) || 0), 0);
  const avg = (arr) => {
    const n = (arr || []).length;
    return n ? Math.round(sum(arr) / n) : 0;
  };
  const getTotalProfit = (tf) => sum(getProfitData(tf));
  const getAvgAOV = (tf) => avg(getAovData(tf));
  const getTotalOrders = (tf) => sum(getOrdersData(tf));
  const getSelesaiCount = (tf) => {
    const statusData = getStatusData(tf);
    return Array.isArray(statusData) ? (statusData[3] || 0) : 0;
  };
  const KPI_BOXES = {
    'Total Profit': (tf) => (kpiOverride && typeof kpiOverride.totalProfit === 'number') ? kpiOverride.totalProfit : getTotalProfit(tf),
    'Rata-rata AOV': (tf) => (kpiOverride && typeof kpiOverride.avgAOV === 'number') ? kpiOverride.avgAOV : getAvgAOV(tf),
    'Total Orders': (tf) => (kpiOverride && typeof kpiOverride.totalOrders === 'number') ? kpiOverride.totalOrders : getTotalOrders(tf),
    'Pesanan Selesai': (tf) => (kpiOverride && typeof kpiOverride.selesai === 'number') ? kpiOverride.selesai : getSelesaiCount(tf),
  };
  const getKpiValueByName = (name, tf) => {
    const fn = KPI_BOXES[name];
    return fn ? fn(tf) : 0;
  };

  useEffect(() => {
    const tfData = getTimeframeData(timeframe);

    profitChartObj.current = new Chart(profitRef.current, {
      type: 'line',
      data: {
        labels: tfData.labels,
        datasets: [
          {
            label: 'Profit',
            data: tfData.profit,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14,165,233,0.2)',
            tension: 0.3,
            borderWidth: 2,
            fill: true,
          },
          {
            label: 'Refund',
            data: tfData.refund,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.15)',
            tension: 0.3,
            borderWidth: 2,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        layout: { padding: { bottom: 36 } },
        scales: {
          x: { ticks: { padding: 12, color: '#374151', font: { size: 13 }, maxRotation: 0 }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { padding: 10, color: '#374151', font: { size: 13 } } }
        }
      }
    });

    aovChartObj.current = new Chart(aovRef.current, {
      type: 'bar',
      data: {
        labels: tfData.labels,
        datasets: [
          {
            label: 'AOV',
            data: tfData.aov,
            backgroundColor: '#f97316',
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        layout: { padding: { bottom: 36 } },
        scales: {
          x: { ticks: { padding: 12, color: '#374151', font: { size: 13 }, maxRotation: 0 }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { padding: 10, color: '#374151', font: { size: 13 } } }
        }
      }
    });

    statusChartObj.current = new Chart(statusRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Menunggu', 'Diproses', 'Dikirim', 'Selesai'],
        datasets: [{
          data: tfData.status,
          backgroundColor: ['#f59e0b', '#3b82f6', '#0ea5e9', '#10b981'],
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 32 } },
        plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 13 } } } }
      }
    });

    ordersChartObj.current = new Chart(ordersRef.current, {
      type: 'bar',
      data: {
        labels: tfData.labels,
        datasets: [{
          label: 'Orders',
          data: tfData.orders,
          backgroundColor: '#0ea5e9',
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        layout: { padding: { bottom: 40 } },
        scales: {
          x: { ticks: { padding: 12, color: '#374151', font: { size: 13 }, maxRotation: 0 }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { padding: 10, color: '#374151', font: { size: 13 } } }
        }
      }
    });

    return () => {
      profitChartObj.current?.destroy();
      aovChartObj.current?.destroy();
      statusChartObj.current?.destroy();
      ordersChartObj.current?.destroy();
    };
  }, []);

  useEffect(() => {
    // Update charts when timeframe changes
    if (!profitChartObj.current) return;
    const tfData = getTimeframeData(timeframe);

    const updateLine = (chart, labels, series1, series2) => {
      chart.data.labels = labels;
      chart.data.datasets[0].data = series1;
      if (series2) chart.data.datasets[1].data = series2;
      chart.update();
    };

    const updateBar = (chart, labels, series) => {
      chart.data.labels = labels;
      chart.data.datasets[0].data = series;
      chart.update();
    };

    const updateDoughnut = (chart, series) => {
      chart.data.datasets[0].data = series;
      chart.update();
    };

    updateLine(profitChartObj.current, tfData.labels, tfData.profit, tfData.refund);
    updateBar(aovChartObj.current, tfData.labels, tfData.aov);
    updateDoughnut(statusChartObj.current, tfData.status);
    updateBar(ordersChartObj.current, tfData.labels, tfData.orders);
  }, [timeframe]);

  useEffect(() => {
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
    const SOLD_ENDPOINT = `${API_BASE}/api/orders.php?group=by_product&limit=4`;
    const ORDERS_ENDPOINT = `${API_BASE}/api/orders.php?limit=4`;
    const fetchTop = async () => {
      try {
        setTopError('');
        const res = await fetch(SOLD_ENDPOINT);
        let data;
        try { data = await res.json(); } catch { throw new Error('Respons produk tidak valid'); }
        if (!res.ok || !data.ok) { throw new Error(data.error || `Gagal memuat produk (status ${res.status})`); }
        const rows = Array.isArray(data.data) ? data.data : [];
        const mapped = rows.map(p => ({ name: p.name, sold: Number(p.sold) || 0 }));
        setTopProducts(mapped.slice(0, 4));
      } catch (e) {
        console.error('[Dashboard] Gagal muat Produk Teratas:', e);
        setTopError('Gagal memuat Produk Teratas dari server');
        setTopProducts([]);
      }
    };
    const fetchRecentOrders = async () => {
      try {
        const res = await fetch(ORDERS_ENDPOINT);
        const data = await res.json();
        if (!res.ok || !data || !data.ok) { setRecentOrders([]); return; }
        const rows = Array.isArray(data.data) ? data.data : [];
        const mapped = rows.map(o => ({ id: o.order_code || `ORD-${o.id}`, customer: o.customer_name || '-', total: Math.round(Number(o.total) || 0), status: o.status || 'pending' }));
        setRecentOrders(mapped);
      } catch {
        setRecentOrders([]);
      }
    };
    fetchTop();
    fetchRecentOrders();
    const interval = setInterval(() => {
      fetchTop();
      fetchRecentOrders();
    }, 30000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
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
    const SUMMARY_ENDPOINT = `${API_BASE}/api/orders.php?summary=1&tf=${timeframe}`;
    const ORDERS_ENDPOINT = `${API_BASE}/api/orders.php?limit=500`;
    const bucketsForTf = (tf) => {
      if (tf === '7d') {
        const labels = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
        const key = (d) => d.getDay();
        return { labels, key, size: 7 };
      }
      if (tf === '30d') {
        const labels = Array.from({ length: 30 }, (_, i) => `D${i + 1}`);
        const start = new Date(); start.setDate(start.getDate() - 29); start.setHours(0,0,0,0);
        const key = (d) => Math.floor((d - start) / (24*60*60*1000));
        return { labels, key, size: 30 };
      }
      const labels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      const key = (d) => d.getMonth();
      return { labels, key, size: 12 };
    };
    const updateChartsFromOrders = (rows) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      const { labels, key, size } = bucketsForTf(timeframe);
      const profit = Array(size).fill(0);
      const count = Array(size).fill(0);
      const statusCounts = [0,0,0,0];
      for (const o of rows) {
        const dt = new Date(o.order_date || o.created_at || Date.now());
        const idx = Math.max(0, Math.min(size - 1, key(dt)));
        const total = Math.round(Number(o.total) || 0);
        profit[idx] += total;
        count[idx] += 1;
        const s = String(o.status || '').toLowerCase();
        const si = statusMap.current[s];
        if (typeof si === 'number') statusCounts[si] += 1;
      }
      const aov = profit.map((p, i) => (count[i] ? Math.round(p / count[i]) : 0));
      if (profitChartObj.current) {
        profitChartObj.current.data.labels = labels;
        profitChartObj.current.data.datasets[0].data = profit;
        profitChartObj.current.data.datasets[1].data = Array(size).fill(0);
        profitChartObj.current.update();
      }
      if (aovChartObj.current) {
        aovChartObj.current.data.labels = labels;
        aovChartObj.current.data.datasets[0].data = aov;
        aovChartObj.current.update();
      }
      if (ordersChartObj.current) {
        ordersChartObj.current.data.labels = labels;
        ordersChartObj.current.data.datasets[0].data = count;
        ordersChartObj.current.update();
      }
      if (statusChartObj.current) {
        statusChartObj.current.data.datasets[0].data = statusCounts;
        statusChartObj.current.update();
      }
    };
    const loadKpi = async () => {
      try {
        const [res, rf] = await Promise.all([fetch(SUMMARY_ENDPOINT), fetch(ORDERS_ENDPOINT)]);
        const data = await res.json();
        const jd = await rf.json();
        if (!res.ok || !data || !data.ok || !data.data) { throw new Error('summary failed'); }
        const d = data.data || {};
        const totalProfit = Math.round(Number(d.total_profit_total ?? d.total_profit) || 0);
        const totalOrders = Number(d.total_orders_active ?? d.total_orders_total ?? d.total_orders) || 0;
        const avgAOV = Math.round(Number(d.avg_aov_total ?? d.avg_aov) || 0);
        const selesai = Number(d.selesai_total ?? d.selesai) || 0;
        if (totalOrders > 0 || totalProfit > 0 || selesai > 0) {
          setKpiOverride({ totalProfit, avgAOV, totalOrders, selesai });
          const rows = Array.isArray(jd?.data) ? jd.data : [];
          updateChartsFromOrders(rows);
          return;
        }
        throw new Error('summary empty');
      } catch {
        try {
          const rf = await fetch(ORDERS_ENDPOINT);
          const jd = await rf.json();
          if (!rf.ok || !jd || !jd.ok) { setKpiOverride(null); return; }
          const rows = Array.isArray(jd.data) ? jd.data : [];
          const now = new Date();
          const tfDays = timeframe === '7d' ? 7 : (timeframe === '30d' ? 30 : 365);
          const start = new Date(now.getTime() - tfDays * 24 * 60 * 60 * 1000);
          const parseDate = (s) => {
            try {
              const d = new Date(s);
              if (!Number.isNaN(d.getTime())) return d;
              const iso = typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s;
              const d2 = new Date(iso);
              return Number.isNaN(d2.getTime()) ? null : d2;
            } catch { return null; }
          };
          const inRange = rows.filter(o => {
            const d = parseDate(o.order_date);
            return d && d >= start && d <= now;
          });
          const totals = inRange.map(o => {
            const v = Number(o.total);
            return Number.isFinite(v) ? Math.round(v) : 0;
          });
          const totalProfit = totals.reduce((a,b)=>a+b,0);
          const totalOrders = inRange.length;
          const avgAOV = totalOrders ? Math.round(totalProfit / totalOrders) : 0;
          const finishedSet = new Set(['delivered','completed','selesai','finished','done']);
          const selesai = inRange.filter(o => finishedSet.has(String(o.status || '').toLowerCase())).length;
          setKpiOverride({ totalProfit, avgAOV, totalOrders, selesai });
          updateChartsFromOrders(rows);
        } catch {
          setKpiOverride(null);
        }
      }
    };
    loadKpi();
    const interval = setInterval(loadKpi, 15000);
    return () => { clearInterval(interval); };
  }, [timeframe]);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px' }}>
        <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={assets.home_icon} alt="Dashboard" className="header-icon" style={{ width: 28, height: 28 }} />
            Dashboard Admin TaniKu
          </h1>
        </div>
        {/* Analytics Controls */}
        <div className="analytics-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Timeframe filter */}
          <div className="timeframe-group" style={{ display: 'inline-flex', gap: '6px' }}>
            <button className={`btn ${timeframe==='7d' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTimeframe('7d')}>7 Hari</button>
            <button className={`btn ${timeframe==='30d' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTimeframe('30d')}>30 Hari</button>
            <button className={`btn ${timeframe==='12m' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTimeframe('12m')}>12 Bulan</button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            placeholder="Cari laporan, produk, atau pelanggan..."
          />
          {/* Hapus tombol Export Refund; gunakan ekspor umum */}
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <img src={assets.save_icon} alt="Export" style={{ width: 16, height: 16 }} />
            Export PNG
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={{ padding: '0 12px' }}>
        <a className="action-btn" href="/add-product">
          <img src={assets.add_icon_white} alt="Tambah" />
          Tambah Produk
        </a>
        <a className="action-btn" href="/orders">
          <img src={assets.package_icon} alt="Pesanan" />
          Lihat Pesanan
        </a>
        <a className="action-btn" href="/promotions">
          <img src={assets.discount_icon} alt="Promo" />
          Buat Promo
        </a>
      </div>

      {/* KPI Summary */}
      {(() => {
        const totalProfit = getKpiValueByName('Total Profit', timeframe);
        const avgAOV = getKpiValueByName('Rata-rata AOV', timeframe);
        const totalOrders = getKpiValueByName('Total Orders', timeframe);
        const selesai = getKpiValueByName('Pesanan Selesai', timeframe);
        return (
          <section style={{ padding: '12px' }}>
            <div className="kpi-grid">
              <div className="kpi-card">
                <img className="kpi-icon" src={assets.wallet_icon} alt="Total Profit" />
                <div className="kpi-content">
                  <h4>Total Profit</h4>
                  <div className="kpi-value">Rp {totalProfit.toLocaleString('id-ID')}</div>
                </div>
              </div>
              <div className="kpi-card">
                <img className="kpi-icon" src={assets.aov_icon} alt="Rata-rata AOV" />
                <div className="kpi-content">
                  <h4>Rata-rata AOV</h4>
                  <div className="kpi-value">Rp {avgAOV.toLocaleString('id-ID')}</div>
                </div>
              </div>
              <div className="kpi-card">
                <img className="kpi-icon" src={assets.bag_icon} alt="Total Orders" />
                <div className="kpi-content">
                  <h4>Total Orders</h4>
                  <div className="kpi-value">{totalOrders.toLocaleString('id-ID')}</div>
                </div>
              </div>
              <div className="kpi-card">
                <img className="kpi-icon" src={assets.check_icon} alt="Pesanan Selesai" />
                <div className="kpi-content">
                  <h4>Pesanan Selesai</h4>
                  <div className="kpi-value">{selesai.toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Analytics Section */}
      <section className="analytics-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
        {/* Row 1: Profit (8) + New Customers (4) */}
        <div className="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
          <div className="col-8" style={{ gridColumn: 'span 8' }}>
            <div className={`card chart-card large ${fullscreen==='profit' ? 'fullscreen' : ''}`}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
                <h3>Profit</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setFullscreen(fs => fs==='profit' ? null : 'profit')}>{fullscreen==='profit' ? 'Tutup' : 'Fullscreen'}</button>
                  <button className="btn btn-secondary" onClick={() => exportChartCSV(profitChartObj.current, 'profit.csv')}>Export CSV</button>
                </div>
              </div>
              <div className="chart-wrapper" style={{ padding: '12px' }}>
                <div style={{ height: 380 }}>
                  <canvas ref={profitRef} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-4" style={{ gridColumn: 'span 4' }}>
            <div className="card" style={{ padding: '12px' }}>
              <h3>Pelanggan Baru</h3>
              <p>Per minggu</p>
            </div>
          </div>
        </div>

        {/* Row 2: AOV (6) + Status (6) */}
        <div className="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
          <div className="col-6" style={{ gridColumn: 'span 6' }}>
            <div className={`card chart-card ${fullscreen==='aov' ? 'fullscreen' : ''}`}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
                <h3>AOV</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setFullscreen(fs => fs==='aov' ? null : 'aov')}>{fullscreen==='aov' ? 'Tutup' : 'Fullscreen'}</button>
                  <button className="btn btn-secondary" onClick={() => exportChartCSV(aovChartObj.current, 'aov.csv')}>Export CSV</button>
                </div>
              </div>
              <div className="chart-wrapper" style={{ padding: '12px' }}>
                <div style={{ height: 320 }}>
                  <canvas ref={aovRef} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6" style={{ gridColumn: 'span 6' }}>
            <div className={`card chart-card ${fullscreen==='status' ? 'fullscreen' : ''}`}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
                <h3>Status Pesanan</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setFullscreen(fs => fs==='status' ? null : 'status')}>{fullscreen==='status' ? 'Tutup' : 'Fullscreen'}</button>
                  <button className="btn btn-secondary" onClick={() => exportChartCSV(statusChartObj.current, 'status.csv')}>Export CSV</button>
                </div>
              </div>
              <div className="chart-wrapper" style={{ padding: '12px' }}>
                <div style={{ height: 320 }}>
                  <canvas ref={statusRef} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Orders (12) */}
        <div className="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
          <div className="col-12" style={{ gridColumn: 'span 12' }}>
            <div className={`card chart-card large ${fullscreen==='orders' ? 'fullscreen' : ''}`}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
                <h3>Orders</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setFullscreen(fs => fs==='orders' ? null : 'orders')}>{fullscreen==='orders' ? 'Tutup' : 'Fullscreen'}</button>
                  <button className="btn btn-secondary" onClick={() => exportChartCSV(ordersChartObj.current, 'orders.csv')}>Export CSV</button>
                </div>
              </div>
              <div className="chart-wrapper" style={{ padding: '12px' }}>
                <div style={{ height: 400 }}>
                  <canvas ref={ordersRef} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Recent Orders (8) + Top Products (4) */}
        <div className="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
          <div className="col-8" style={{ gridColumn: 'span 8' }}>
            <div className="card" style={{ padding: '12px' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Pesanan Terbaru</h3>
                <a className="btn btn-soft" href="/orders">Lihat semua</a>
              </div>
              <table className="table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Pelanggan</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const statusClass = (
                      String(o.status).toLowerCase() === 'pending' ? 'badge badge-warning' :
                      String(o.status).toLowerCase() === 'processing' ? 'badge badge-info' :
                      String(o.status).toLowerCase() === 'shipped' ? 'badge badge-info' :
                      String(o.status).toLowerCase() === 'delivered' ? 'badge badge-success' : 'badge badge-neutral'
                    );
                    return (
                      <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{o.customer}</td>
                        <td>Rp {o.total.toLocaleString('id-ID')}</td>
                        <td><span className={statusClass}>{o.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-4" style={{ gridColumn: 'span 4' }}>
            <div className="card" style={{ padding: '12px' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Produk Teratas</h3>
                <a className="btn btn-soft" href="/products">Kelola</a>
              </div>
              <ul className="list-modern">
                {topProducts.map((p) => (
                  <li key={p.name}>
                    <span>{p.name}</span>
                    <span>{p.sold} terjual</span>
                  </li>
                ))}
              </ul>
              {topError && (
                <div className="info-banner" style={{marginTop:8}}>{topError}</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
