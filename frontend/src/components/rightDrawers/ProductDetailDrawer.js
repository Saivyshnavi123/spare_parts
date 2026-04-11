import React from 'react';
import { BASE_URL } from '../../api/http';
import './Drawers.css';

/**
 * ProductDetailDrawer
 *
 * Props:
 *  - product        {object}   - selected product data
 *  - loading        {boolean}  - show loading state
 *  - quantity       {number}   - current quantity value
 *  - onQuantityChange {fn}     - (newQty) => void
 *  - onAddToCart    {fn}       - called when "Add to Cart" is clicked
 *  - onClose        {fn}       - called when drawer is closed
 */
const ProductDetailDrawer = ({
  product,
  loading,
  quantity,
  onQuantityChange,
  onAddToCart,
  onClose,
}) => {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <h2>Product Details</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-content">
          {loading ? (
            <div className="drawer-loading">Loading...</div>
          ) : product ? (
            <>
              {product.image_url && (
                <img
                  src={`${BASE_URL}${product.image_url}`}
                  alt={product.name}
                  className="drawer-product-image"
                />
              )}

              <div className="drawer-product-info">
                <h3>{product.name}</h3>

                <div className="drawer-detail-row">
                  <span className="drawer-label">Product ID:</span>
                  <span className="drawer-value">{product.product_id}</span>
                </div>

                <div className="drawer-detail-row">
                  <span className="drawer-label">Description:</span>
                  <span className="drawer-value">{product.desc || 'No description'}</span>
                </div>

                <div className="drawer-detail-row">
                  <span className="drawer-label">Price:</span>
                  <span className="drawer-value drawer-price">${product.amount}</span>
                </div>

                <div className="drawer-detail-row">
                  <span className="drawer-label">Stock:</span>
                  <span className={`drawer-value ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                    {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                  </span>
                </div>

                {product.stock > 0 && (
                  <>
                    <div className="drawer-quantity">
                      <label>Quantity:</label>
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn"
                          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="quantity-input"
                          value={quantity}
                          min="1"
                          max={product.stock}
                          onChange={(e) =>
                            onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))
                          }
                        />
                        <button
                          className="quantity-btn"
                          onClick={() =>
                            onQuantityChange(Math.min(product.stock, quantity + 1))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button className="add-to-cart-btn" onClick={onAddToCart}>
                      Add to Cart
                    </button>
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ProductDetailDrawer;
