import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api, { BASE_URL } from '../../api/http';
import AddProductDrawer from '../rightDrawers/AddProductDrawer';
import './AdminModules.css';

const EMPTY_PRODUCT = { name: '', amount: '', description: '', stock_quantity: '', file: null };

const ManageProducts = () => {
  const [products, setProducts]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [newProduct, setNewProduct]         = useState(EMPTY_PRODUCT);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('amount', newProduct.amount);
    formData.append('description', newProduct.description);
    formData.append('stock_quantity', newProduct.stock_quantity);
    formData.append('admin_id', localStorage.getItem('customerId'));
    if (newProduct.file) formData.append('file', newProduct.file);

    try {
      const res = await fetch(`${BASE_URL}/products`, { method: 'POST', body: formData });
      if (res.ok) {
        toast.success('Product added successfully!');
        setShowForm(false);
        setNewProduct(EMPTY_PRODUCT);
        fetchProducts();
      } else {
        toast.error('Failed to add product');
      }
    } catch (e) {
      toast.error('Error adding product');
    }
  };

  return (
    <div className="module-content">
      <div className="module-header">
        <h2>Manage Products</h2>
        <button className="add-product-btn" onClick={() => setShowForm(true)}>
          + Add Product
        </button>
      </div>

      {showForm && (
        <AddProductDrawer
          product={newProduct}
          onChange={(e) => setNewProduct((p) => ({ ...p, [e.target.name]: e.target.value }))}
          onFileChange={(e) => setNewProduct((p) => ({ ...p, file: e.target.files[0] }))}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p className="admin-msg">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="admin-msg">No products found.</p>
      ) : (
        <div className="admin-products-grid">
          {products.map((p) => (
            <div key={p.product_id} className="admin-product-card">
              {p.image_url && (
                <img
                  src={`${BASE_URL}${p.image_url}`}
                  alt={p.name}
                  className="admin-product-card-image"
                />
              )}
              <div className="admin-product-card-info">
                <h3>{p.name}</h3>
                <p className="admin-product-card-desc">{p.desc}</p>
                <div className="admin-product-card-details">
                  <span className="admin-product-card-price">${p.amount?.toFixed(2)}</span>
                  <span className="admin-product-card-stock">Stock: {p.stock}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
