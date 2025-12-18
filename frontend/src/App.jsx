import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import Wishlist from './pages/Wishlist/Wishlist'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import Login from './components/Login/Login'
// import Profil from './components/Profil/Profil'
import ProfilePage from './pages/Profile/Profile'
import { useLocation } from 'react-router-dom'
import Footer from './components/Footer/Footer'
import Kontak from './pages/Kontak/Kontak'
import Promo from './pages/Promo/Promo'
import Search from './pages/Search/Search'
import Notifications from './pages/Notifications/Notifications'
import Messages from './pages/Messages/Messages'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation'
import PlaceOrder from './pages/placeOrder/placeOrder'
import PaymentMethod from './pages/PaymentMethod/PaymentMethod'

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  // const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation()
  const isProfile = location.pathname.startsWith('/profile')
  const isOrderConfirmation = location.pathname.startsWith('/order-confirmation')
  const isPlaceOrder = location.pathname.startsWith('/place-order')
  const hideNavbar = isProfile || isOrderConfirmation || isPlaceOrder
  const hideFooter = isProfile || isOrderConfirmation || isPlaceOrder

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Show loading for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const openLogin = () => setShowLogin(true);
    window.addEventListener('trigger-login', openLogin);
    return () => {
      window.removeEventListener('trigger-login', openLogin);
    };
  }, []);

  if (isLoading && !isOrderConfirmation) {
    return <LoadingScreen />;
  }
  return (
    <div className={isProfile ? 'app app-full' : hideNavbar ? 'app no-navbar' : 'app'}>
      {!hideNavbar && <Navbar setShowLogin={setShowLogin} />}
      
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/cart' element={<Cart/>} />
        <Route path='/wishlist' element={<Wishlist/>} />
        <Route path='/product/:id' element={<ProductDetail/>} />
        <Route path='/promo' element={<Promo/>} />
        <Route path='/kontak' element={<Kontak/>} />
        <Route path='/search' element={<Search/>} />
        <Route path='/notifications' element={<Notifications/>} />
        <Route path='/messages/:id' element={<Messages/>} />
        <Route path='/messages' element={<Messages/>} />
        <Route path='/order-confirmation/:id' element={<OrderConfirmation/>} />
        <Route path='/profile' element={<ProfilePage/>} />
        <Route path='/place-order' element={<PlaceOrder/>} />
        {/* <Route path='/payment-method' element={<PaymentMethod/>} /> */}
      </Routes>
      
      <Login 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
      />
      
      {/* Profil modal dihilangkan, gunakan halaman /profile */}

      {!hideFooter && <Footer />}
    </div>
  )
}

export default App
