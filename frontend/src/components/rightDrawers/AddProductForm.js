import React from 'react';
import './AddProductForm.css';

/**
 * AddProductForm
 *
 * Props:
 *  - product       {object}  - { name, amount, description, stock_quantity, file }
 *  - onChange      {fn}      - handles text/number field changes
 *  - onFileChange  {fn}      - handles file input change
 *  - onSubmit      {fn}      - form submit handler
 *  - onCancel      {fn}      - hides the form
 */
const AddProductForm = ({ product, onChange, onFileChange, onSubmit, onCancel }) => {
  return (
    <div className="add-product-form">
      <div className="add-product-form-header">
        <h3>Add New Product</h3>
        <button className="cancel-form-btn" onClick={onCancel} type="button">
          ✕
        </button>
      </div>

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
            rows="3"
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

        <button type="submit" className="submit-product-btn">
          Add Product
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;
