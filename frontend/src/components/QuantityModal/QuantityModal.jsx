import React, { useState } from 'react';
import './QuantityModal.css';

const QuantityModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
    setQuantity(1); // Reset quantity
    onClose();
  };

  const handleClose = () => {
    setQuantity(1); // Reset quantity when closing
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="quantity-modal-overlay" onClick={handleClose}>
      <div className="quantity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quantity-modal-header">
          <h3>Pilih Jumlah</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="quantity-modal-content">
          <div className="product-info">
            <img src={product.image} alt={product.name} className="product-image" />
            <div className="product-details">
              <h4>{product.name}</h4>
              <p className="product-price">Rp {product.price}</p>
            </div>
          </div>
          
          <div className="quantity-selector">
            <label>Jumlah:</label>
            <div className="quantity-controls">
              <button 
                className="quantity-btn decrement" 
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input 
                type="number" 
                value={quantity} 
                onChange={handleQuantityChange}
                min="1"
                className="quantity-input"
              />
              <button 
                className="quantity-btn increment" 
                onClick={handleIncrement}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="total-price">
            <span>Total: Rp {(product.price * quantity).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="quantity-modal-footer">
          <button className="cancel-btn" onClick={handleClose}>
            Batal
          </button>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            TAMBAHKAN KERANJANG
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityModal;