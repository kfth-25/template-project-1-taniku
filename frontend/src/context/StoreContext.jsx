import { createContext, useState, useEffect } from "react";
import { barang_list } from "../assets/assets";
import api from "../services/api";
import { logout as apiLogout, getCurrentUser, isAuthenticated } from "../services/authService";

export const StoreContext = createContext(null);

export const StoreContextProvider = (props) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState({});
    const [cartDetails, setCartDetails] = useState({});
    const [wishlist, setWishlist] = useState({});
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRatings, setUserRatings] = useState({});
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: "Pesan dari Admin",
            message: "Selamat datang di Taniku! Kami senang Anda bergabung dengan platform kami. Jika ada pertanyaan, jangan ragu untuk menghubungi customer service.",
            type: "message",
            isRead: false,
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            sender: "Admin Taniku"
        },
        {
            id: 2,
            title: "Pesan dari Admin",
            message: "Informasi penting: Sistem akan mengalami maintenance pada hari Minggu pukul 02:00 - 04:00 WIB. Mohon maaf atas ketidaknyamanannya.",
            type: "message",
            isRead: false,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            sender: "Admin Taniku"
        },
        {
            id: 3,
            title: "Selamat datang!",
            message: "Terima kasih telah bergabung dengan toko kami. Nikmati pengalaman berbelanja yang menyenangkan!",
            type: "welcome",
            isRead: false,
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 4,
            title: "Promo Spesial",
            message: "Dapatkan diskon hingga 50% untuk produk pilihan. Jangan sampai terlewat!",
            type: "promo",
            isRead: false,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 5,
            title: "Pesanan Berhasil",
            message: "Pesanan Anda telah berhasil diproses dan akan segera dikirim.",
            type: "order",
            isRead: true,
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 6,
            title: "Pesan dari Admin",
            message: "Terima kasih atas feedback Anda! Kami terus berusaha meningkatkan layanan untuk memberikan pengalaman terbaik.",
            type: "message",
            isRead: true,
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            sender: "Admin Taniku"
        }
    ]);

    const [products, setProducts] = useState([]);
    const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('Transfer Bank');
    const [checkoutStartedAt, setCheckoutStartedAt] = useState(null);
    const [productsLoading, setProductsLoading] = useState(false);
    const VOUCHERS = {
        DISKON10: { type: 'percent', value: 10, label: 'Diskon 10%' },
        DISKON20: { type: 'percent', value: 20, minSubtotal: 200, label: 'Diskon 20% min Rp 200.000' },
        HEMAT50: { type: 'fixed', value: 50, label: 'Potongan Rp 50.000' },
    };
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const getVoucherDiscount = (subtotal) => {
        if (!appliedVoucher) return 0;
        const conf = VOUCHERS[appliedVoucher];
        if (!conf) return 0;
        if (conf.minSubtotal && subtotal < conf.minSubtotal) return 0;
        if (conf.type === 'percent') return Math.floor((subtotal * conf.value) / 100);
        if (conf.type === 'fixed') return Math.min(subtotal, conf.value);
        return 0;
    };

    const login = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
        // Store user data in localStorage (token sudah disimpan di authService)
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
    };

    const logout = async () => {
        try {
            // Panggil API logout untuk invalidate token di server
            await apiLogout();
        } catch (error) {
            console.error('Logout API error:', error);
            // Tetap lanjutkan logout meskipun API error
        }
        
        // Clear local state dan localStorage
        setUser(null);
        setIsLoggedIn(false);
        setCart({});
        setWishlist({});
        setUserRatings({});
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        // Token sudah dihapus di authService.logout()
    };

    const updateUser = (updatedData) => {
        const newUserData = { ...user, ...updatedData };
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
    };

    // Check for existing login on app start
    useEffect(() => {
        const initializeAuth = async () => {
            const savedRatings = localStorage.getItem('userRatings');
            
            if (savedRatings) {
                setUserRatings(JSON.parse(savedRatings));
            }
            
            // Cek apakah ada token yang valid
            if (isAuthenticated()) {
                try {
                    // Ambil data user terbaru dari server
                    const response = await getCurrentUser();
                    let userData = null;
                    
                    if (response.data && response.data.user) {
                        userData = response.data.user;
                    } else if (response.user) {
                        userData = response.user;
                    } else if (response.data) {
                        userData = response.data;
                    }
                    
                    if (userData) {
                        setUser({
                            id: userData.id,
                            name: userData.name,
                            email: userData.email,
                            phone: userData.phone || '',
                            address: userData.address || '',
                            city: userData.city || '',
                            postalCode: userData.postal_code || ''
                        });
                        setIsLoggedIn(true);
                        localStorage.setItem('user', JSON.stringify(userData));
                        localStorage.setItem('isLoggedIn', 'true');
                    }
                } catch (error) {
                    console.error('Failed to get current user:', error);
                    // Token mungkin expired atau invalid, logout
                    logout();
                }
            } else {
                // Tidak ada token, pastikan state bersih
                const savedUser = localStorage.getItem('user');
                const savedLoginStatus = localStorage.getItem('isLoggedIn');
                
                if (savedUser && savedLoginStatus === 'true') {
                    // Ada data user tersimpan tapi tidak ada token, gunakan data tersimpan
                    setUser(JSON.parse(savedUser));
                    setIsLoggedIn(true);
                }
            }
        };
        
        initializeAuth();
    }, []);

    const fetchProducts = async () => {
        try {
            setProductsLoading(true);
            let res;
            try {
                res = await api.get('/api/products.php');
            } catch {
                try { res = await api.get('http://localhost/backend/api/products.php') } catch {
                    res = await api.get('http://localhost:5176/api/products.php')
                }
            }
            const items = ((res.data && res.data.data) || []).map((row) => {
                const base = (api.defaults.baseURL || '').replace(/\/$/, '');
                const img = row.image ? `${base}${row.image.startsWith('/') ? row.image : '/' + row.image}` : null;
                const slug = (row.category_slug || '').toLowerCase();
                const cname = (row.category_name || '').toLowerCase();
                const cat = slug === 'pupuk' || cname.includes('pupuk') ? 'Pupuk'
                          : slug === 'obat' || cname.includes('obat') ? 'Obat'
                          : (row.category_name || 'Semua');
                const priceRibu = Math.round((Number(row.price) || 0) / 1000);
                const originalRibuFromRow = Math.round((Number(row.original_price) || 0) / 1000);
                let discountPct = Number(row.discount || 0);
                let originalRibu = originalRibuFromRow || null;
                if (!discountPct && originalRibuFromRow && originalRibuFromRow > priceRibu) {
                    discountPct = Math.round((1 - (priceRibu / originalRibuFromRow)) * 100);
                }
                if (!discountPct) {
                    const DEF = [12, 15, 19, 21, 27, 29, 33, 38];
                    const idx = Math.abs(parseInt(row.id, 10) || 0) % DEF.length;
                    discountPct = DEF[idx];
                }
                if (!originalRibu && discountPct > 0) {
                    const denom = 1 - (discountPct / 100);
                    if (denom > 0) originalRibu = Math.round(priceRibu / denom);
                }
                return {
                    _id: String(row.id),
                    name: row.name || 'Produk',
                    description: row.description || '',
                    image: img || '/placeholder.png',
                    category: cat,
                    price: priceRibu,
                    originalPrice: originalRibu,
                    discount: discountPct,
                    rating: Number(row.rating || 0),
                    reviewCount: Number(row.review_count || 0),
                    stock: row.stock || 0,
                    createdAt: row.created_at || null,
                    updatedAt: row.updated_at || null,
                };
            });
            setProducts(items);
        } catch (e) {
            console.error('[StoreContext] Gagal ambil produk:', e);
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        const onFocus = () => fetchProducts();
        window.addEventListener('focus', onFocus);
        return () => {
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const getCartCount = () =>
        Object.values(cart).reduce((sum, qty) => sum + (Number(qty) || 0), 0);

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const itemId in cart) {
            if (cart[itemId] > 0) {
                const itemDb = (products || []).find((product) => String(product._id) === String(itemId));
                const itemAsset = barang_list.find((product) => String(product._id) === String(itemId));
                const ap = itemAsset ? Number(itemAsset.price) : NaN;
                const dp = itemDb ? Number(itemDb.price) : NaN;
                let price = 0;
                if (Number.isFinite(ap) && ap > 0) {
                    price = Number.isFinite(dp) && dp > 0 ? Math.min(ap, dp) : ap;
                } else {
                    price = Number.isFinite(dp) ? dp : 0;
                }
                totalAmount += price * cart[itemId];
            }
        }
        return totalAmount;
    };

    const addToCart = (itemId, quantity = 1, details = null) => {
        setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + quantity }));
        if (details && typeof details === 'object') {
            const snap = {
                name: String(details.name || ''),
                price: Number(details.price || 0),
                originalPrice: details.originalPrice != null ? Number(details.originalPrice) : null,
                discount: Number(details.discount || 0),
                image: details.image || null,
                category: String(details.category || ''),
                stock: Number(details.stock || 0)
            };
            setCartDetails((prev) => ({ ...prev, [itemId]: snap }));
        }
    };

    const removeFromCart = (itemId) => {
        setCart((prev) => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) {
                newCart[itemId] -= 1;
            } else {
                delete newCart[itemId];
            }
            return newCart;
        });
        setCartDetails((prev) => {
            const next = { ...prev };
            if (!cart[itemId] || cart[itemId] - 1 <= 0) {
                delete next[itemId];
            }
            return next;
        });
    };

    const addToWishlist = (itemId) => {
        setWishlist((prev) => ({ ...prev, [itemId]: true }));
    };

    const removeFromWishlist = (itemId) => {
        setWishlist((prev) => {
            const newWishlist = { ...prev };
            delete newWishlist[itemId];
            return newWishlist;
        });
    };

    const toggleWishlist = (itemId) => {
        if (wishlist[itemId]) {
            removeFromWishlist(itemId);
        } else {
            addToWishlist(itemId);
        }
    };

    const setCartItemQuantity = (itemId, quantity) => {
        if (quantity <= 0) {
            setCart((prev) => {
                const newCart = { ...prev };
                delete newCart[itemId];
                return newCart;
            });
        } else {
            setCart((prev) => ({ ...prev, [itemId]: quantity }));
        }
    };

    const clearCart = () => {
        setCart({});
        setCartDetails({});
    };

    // Function to reduce stock when checkout
    const processCheckout = () => {
        // Create a copy of barang_list to modify stock
        const updatedProducts = barang_list.map(product => {
            const cartQuantity = cart[product._id] || 0;
            if (cartQuantity > 0) {
                // Reduce stock by cart quantity
                const newStock = Math.max(0, (product.stock || 80) - cartQuantity);
                return { ...product, stock: newStock };
            }
            return product;
        });

        // In a real app, you would update the backend here
        // For now, we'll just clear the cart and show success
        clearCart();
        
        return {
            success: true,
            message: 'Checkout berhasil! Stok produk telah diperbarui.',
            updatedProducts
        };
    };

    const getWishlistCount = () => Object.keys(wishlist).length;

    const getCartItemQuantity = (itemId) => cart[itemId] || 0;

    const isInCart = (itemId) => cart[itemId] && cart[itemId] > 0;

    // Rating functions
    const setUserRating = (itemId, rating) => {
        console.log('Setting user rating:', itemId, rating);
        setUserRatings((prev) => {
            const newRatings = { ...prev, [itemId]: rating };
            console.log('New ratings state:', newRatings);
            // Save to localStorage for persistence
            localStorage.setItem('userRatings', JSON.stringify(newRatings));
            return newRatings;
        });
    };

    const getUserRating = (itemId) => userRatings[itemId] || 0;

    // Notification functions
    const getUnreadNotificationCount = () => {
        return notifications.filter(notification => !notification.isRead).length;
    };

    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, isRead: true }
                    : notification
            )
        );
    };

    const markAllNotificationsAsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    const deleteNotification = (notificationId) => {
        setNotifications(prev => 
            prev.filter(notification => notification.id !== notificationId)
        );
    };

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            isRead: false,
            ...notification
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const contextValue = {
        barang_list,
        products,
        productsLoading,
        fetchProducts,
        searchQuery,
        setSearchQuery,
        cart,
        setCart,
        cartDetails,
        setCartDetails,
        addToCart,
        removeFromCart,
        setCartItemQuantity,
        clearCart,
        processCheckout,
        getCartCount,
        getCartItemQuantity,
        isInCart,
        getTotalCartAmount,
        wishlist,
        setWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        getWishlistCount,
        user,
        setUser,
        isLoggedIn,
        login,
        logout,
        updateUser,
        userRatings,
        setUserRating,
        getUserRating,
        notifications,
        getUnreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        addNotification,
        checkoutPaymentMethod,
        setCheckoutPaymentMethod,
        checkoutStartedAt,
        setCheckoutStartedAt,
        appliedVoucher,
        setAppliedVoucher,
        getVoucherDiscount,
        VOUCHERS
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}
