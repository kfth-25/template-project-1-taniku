import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './Wishlist.css';

const Wishlist = () => {
    const { wishlist, toggleWishlist, addToCart, products } = useContext(StoreContext);
    const navigate = useNavigate();

    // Get wishlist items
    const wishlistItems = (products || []).filter(item => wishlist[item._id]);

    const handleAddToCart = (itemId) => {
        addToCart(itemId);
        // Optional: Show success message or notification
    };

    const handleRemoveFromWishlist = (itemId) => {
        toggleWishlist(itemId);
    };

    if (wishlistItems.length === 0) {
        return (
            <div className="wishlist-page">
                <div className="wishlist-container">
                    <div className="wishlist-header">
                        <h1>Wishlist Saya</h1>
                        <p className="wishlist-subtitle">Simpan produk favorit Anda di sini</p>
                    </div>
                    <div className="empty-wishlist">
                        <h2>Wishlist Anda Kosong</h2>
                        <p>Belum ada produk yang ditambahkan ke wishlist. Mulai jelajahi produk dan tambahkan yang Anda sukai!</p>
                        <button 
                            className="continue-shopping-btn"
                            onClick={() => navigate('/')}
                        >
                            Mulai Belanja
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <div className="wishlist-container">
                <div className="wishlist-header">
                    <h1>Wishlist Saya</h1>
                    <p className="wishlist-subtitle">
                        {wishlistItems.length} produk dalam wishlist Anda
                    </p>
                </div>

                <div className="wishlist-grid">
                    {wishlistItems.map((item) => (
                        <div key={item._id} className="wishlist-item">
                            <div className="wishlist-item-image">
                                <img src={item.image} alt={item.name} />
                                <button 
                                    className="remove-wishlist-btn"
                                    onClick={() => handleRemoveFromWishlist(item._id)}
                                    title="Hapus dari wishlist"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="wishlist-item-content">
                                <h3 className="wishlist-item-name">{item.name}</h3>
                                <p className="wishlist-item-description">
                                    {item.description || "Produk berkualitas tinggi untuk kebutuhan Anda"}
                                </p>
                                
                                <div className="wishlist-item-price">
                                    <span className="current-price">Rp {(item.price * 1000).toLocaleString()}</span>
                                    {item.originalPrice && (
                                        <span className="original-price">Rp {(item.originalPrice * 1000).toLocaleString()}</span>
                                    )}
                                </div>

                                <div className="wishlist-item-actions">
                                    <button 
                                        className="add-to-cart-btn"
                                        onClick={() => handleAddToCart(item._id)}
                                    >
                                        <span className="btn-icon">🛒</span>
                                        Tambahkan Keranjang
                                    </button>
                                    
                                    <button 
                                        className="remove-from-wishlist-btn"
                                        onClick={() => handleRemoveFromWishlist(item._id)}
                                    >
                                        Hapus dari Wishlist
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="wishlist-actions">
                    <button 
                        className="continue-shopping-btn"
                        onClick={() => navigate('/')}
                    >
                        Lanjut Belanja
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
