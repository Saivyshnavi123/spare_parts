import React from 'react';
import { BASE_URL } from '../../api/http';
import './Drawers.css';

/**
 * CartDrawer
 *
 * Props:
 *  - cart            {array}  - list of cart items
 *  - onRemoveItem    {fn}     - (productId) => void
 *  - onPlaceOrder    {fn}     - called when "Place Order" is clicked
 *  - onClose         {fn}     - called when drawer is closed
 */
const CartDrawer = ({ cart, onRemoveItem, onPlaceOrder, onClose }) => {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart
    .reduce((sum, item) => sum + item.amount * item.quantity, 0)
    .toFixed(2);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer cart-drawer">
        <div className="drawer-header">
          <h2>Shopping Cart {totalItems > 0 && `(${totalItems})`}</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-content">
          {cart.length === 0 ? (
            <div className="empty-cart-drawer">
              <p>No products added to cart</p>
            </div>
          ) : (
            <>
              <div className="cart-drawer-items">
                {cart.map((item) => (
                  <div key={item.product_id} className="cart-drawer-item">
                    {item.image_url && (
                      <img
                        src={`${BASE_URL}${item.image_url}`}
                        alt={item.name}
                        className="cart-drawer-item-image"
                      />
                    )}
                    <div className="cart-drawer-item-info">
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      <p className="cart-drawer-item-price">
                        ${item.amount} × {item.quantity} = $
                        {(item.amount * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <button
                      className="remove-cart-item-btn"
                      onClick={() => onRemoveItem(item.product_id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-drawer-footer">
                <div className="cart-drawer-total">
                  <strong>Total:</strong>
                  <strong className="total-price">${totalPrice}</strong>
                </div>
                <button className="checkout-btn" onClick={onPlaceOrder}>
                  Place Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
