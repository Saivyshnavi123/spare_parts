import React from 'react';
import './Drawers.css';
import './AddProductForm.css';

const AddProductDrawer = ({ product, onChange, onFileChange, onSubmit, onClose }) => {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <h2>Add New Product</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-content">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={onChange}
                required
                placeholder="Enter product name"
              />
            </div>

            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="amount"
                value={product.amount}
                onChange={onChange}
                required
                step="0.01"
                placeholder="Enter price"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={product.description}
                onChange={onChange}
                placeholder="Enter product description"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                name="stock_quantity"
                value={product.stock_quantity}
                onChange={onChange}
                placeholder="Enter stock quantity"
              />
            </div>

            <div className="form-group">
              <label>Product Image</label>
              <input
                type="file"
                onChange={onFileChange}
                accept="image/*"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">Add Product</button>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddProductDrawer;
