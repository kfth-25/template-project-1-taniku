import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard/Dashboard';

import Logistik from './pages/Logistik/Logistik';
import Tracking from './pages/Tracking/Tracking';
import AddProduct from './pages/AddProduct/AddProduct';
import EditProduct from './pages/EditProduct/EditProduct';
import ProductList from './pages/ProductList/ProductList';
import Orders from './pages/Orders/Orders';
import Promotions from './pages/Promotions/Promotions';
import Messages from './pages/Messages/Messages';
import Checkout from './pages/Checkout/Checkout';
import Login from './pages/Login/Login';
import Profile from './pages/Profile/Profile';
import Logout from './pages/Logout/Logout';
import './App.css';
import AdminStoreProvider from './context/AdminStore.jsx';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('adminUser') || 'null'); } catch { return null }
  });
  useEffect(() => {
    const read = () => {
      try { setUser(JSON.parse(localStorage.getItem('adminUser') || 'null')); } catch { setUser(null) }
    };
    const onStorage = (e) => { if (!e || e.key === 'adminUser') read(); };
    window.addEventListener('auth-changed', read);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth-changed', read);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const authed = !!(user && (user.username || user.email || user.id));

  const RequireAuth = (el) => authed ? el : <Navigate to="/login" replace />;
  const AdminLayout = () => (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );

  return (
    <AdminStoreProvider>
      <Router>
        <Routes>
          <Route path="/login" element={authed ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route element={RequireAuth(<AdminLayout />)}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/logistik" element={<Logistik />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/edit-product" element={<EditProduct />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>
        </Routes>
      </Router>
    </AdminStoreProvider>
  );
}

export default App;
