import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { BASE_URL } from '../api/http';
import Navbar from '../components/Navbar/Navbar';
import ProductDetailDrawer from '../components/rightDrawers/ProductDetailDrawer';
import CartDrawer from '../components/rightDrawers/CartDrawer';
import MyOrders from '../components/MyOrders/MyOrders';
import MyProfile from '../components/MyProfile/MyProfile';
import PaymentDrawer from '../components/Payment/PaymentDrawer';
import './Dashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();

  // ── Auth & layout state ──────────────────────────────────────
  const [activeModule, setActiveModule]     = useState('products');

  // ── Products state ───────────────────────────────────────────
  const [products, setProducts]             = useState([]);
  const [loading, setLoading]               = useState(true);

  // ── Product-detail drawer state ──────────────────────────────
  const [showProductDrawer, setShowProductDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct]     = useState(null);
  const [drawerLoading, setDrawerLoading]         = useState(false);
  const [quantity, setQuantity]                   = useState(1);

  // ── Cart state ───────────────────────────────────────────────
  const [cart, setCart]                     = useState([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // ── Payment state ─────────────────────────────────────────────
  const [showPayment, setShowPayment]       = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [pendingOrderTotal, setPendingOrderTotal] = useState(0);

  // ── Auth guard ───────────────────────────────────────────────
  useEffect(() => {
    const role = localStorage.getItem('userRole');

    if (!role) {
      navigate('/login');
      return;
    }
    if (role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    fetchProducts();
  }, [navigate]);

  // ── API calls ────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.results || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (productId) => {
    setDrawerLoading(true);
    setShowProductDrawer(true);
    setQuantity(1);
    try {
      const response = await api.get(`/products/${productId}`);
      setSelectedProduct(response);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.warn('Your cart is empty!');
      return;
    }

    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
      toast.error('Please login to place an order');
      return;
    }

    const orderData = {
      customer_id: parseInt(customerId),
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await api.post('/orders', orderData);
      if (response) {
        const total = cart.reduce((sum, i) => sum + i.amount * i.quantity, 0);
        setCart([]);
        setShowCartDrawer(false);
        fetchProducts();
        toast.success('Order placed successfully!');
        // Open payment drawer
        setPendingOrderId(response.order_id);
        setPendingOrderTotal(total);
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Order error:', error);
      const msg =
        error.data?.message || error.data || 'Failed to place order. Please try again.';
      toast.error(`${msg}`);
    }
  };

  // ── Cart helpers ─────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) return;

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product_id === selectedProduct.product_id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [...prev, { ...selectedProduct, quantity }];
    });

    closeProductDrawer();
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.product_id !== productId));

  const getTotalCartItems = () =>
    cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Drawer helpers ────────────────────────────────────────────
  const closeProductDrawer = () => {
    setShowProductDrawer(false);
    setSelectedProduct(null);
    setQuantity(1);
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      {/* Shared Navbar */}
      <Navbar
        title="Welcome!"
        showCart
        cartCount={getTotalCartItems()}
        onCartClick={() => setShowCartDrawer(true)}
      />

      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-menu">
            <div
              className={`sidebar-item ${activeModule === 'products' ? 'active' : ''}`}
              onClick={() => setActiveModule('products')}
            >
              <span className="sidebar-icon">📦</span>
              <span>Products</span>
            </div>
            <div
              className={`sidebar-item ${activeModule === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveModule('orders')}
            >
              <span className="sidebar-icon">🛒</span>
              <span>My Orders</span>
            </div>
            <div
              className={`sidebar-item ${activeModule === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveModule('profile')}
            >
              <span className="sidebar-icon">👤</span>
              <span>My Profile</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* ── Products Module ── */}
          {activeModule === 'products' && (
            <div className="module-content">
              <div className="module-header">
                <h2>Products</h2>
              </div>

              <p>Browse our wide range of spare parts and accessories.</p>

              {loading ? (
                <div className="loading-text">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="no-products-message">
                  <p>No products available at the moment.</p>
                </div>
              ) : (
                <div className="products-grid">
                  {products.map((product) => (
                    <div
                      key={product.product_id}
                      className="product-card-inline"
                      onClick={() => handleProductClick(product.product_id)}
                    >
                      {product.image_url && (
                        <img
                          src={`${BASE_URL}${product.image_url}`}
                          alt={product.name}
                          className="product-card-image"
                        />
                      )}
                      <div className="product-card-info">
                        <h3>{product.name}</h3>
                        <p className="product-card-desc">{product.desc}</p>
                        <div className="product-card-details">
                          <span className="product-card-price">${product.amount}</span>
                          <span className="product-card-stock">Stock: {product.stock}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Orders Module ── */}
          {activeModule === 'orders' && (
            <div className="module-content">
              <h2>My Orders</h2>
              <p>Track and manage your orders.</p>
              <MyOrders />
            </div>
          )}

          {/* ── Profile Module ── */}
          {activeModule === 'profile' && <MyProfile />}
        </div>
      </div>

      {/* Product Detail Drawer */}
      {showProductDrawer && (
        <ProductDetailDrawer
          product={selectedProduct}
          loading={drawerLoading}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          onClose={closeProductDrawer}
        />
      )}

      {/* Cart Drawer */}
      {showCartDrawer && (
        <CartDrawer
          cart={cart}
          onRemoveItem={removeFromCart}
          onPlaceOrder={handlePlaceOrder}
          onClose={() => setShowCartDrawer(false)}
        />
      )}

      {/* Payment Drawer */}
      {showPayment && (
        <PaymentDrawer
          orderId={pendingOrderId}
          totalAmount={pendingOrderTotal}
          onSuccess={() => setShowPayment(false)}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
