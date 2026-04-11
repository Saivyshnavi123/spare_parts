import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import ManageProducts from '../components/AdminModules/ManageProducts';
import ManageOrders from '../components/AdminModules/ManageOrders';
import Customers from '../components/AdminModules/Customers';
import MyProfile from '../components/MyProfile/MyProfile';
import './Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('products');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role) {
      navigate('/login');
      return;
    }
    if (role !== 'admin') {
      navigate('/user-dashboard');
    }
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <Navbar title="Admin Dashboard" />

      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-menu">
            <div
              className={`sidebar-item ${activeModule === 'products' ? 'active' : ''}`}
              onClick={() => setActiveModule('products')}
            >
              <span className="sidebar-icon">📦</span>
              <span>Manage Products</span>
            </div>
            <div
              className={`sidebar-item ${activeModule === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveModule('orders')}
            >
              <span className="sidebar-icon">🛒</span>
              <span>Manage Orders</span>
            </div>
            <div
              className={`sidebar-item ${activeModule === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveModule('customers')}
            >
              <span className="sidebar-icon">👥</span>
              <span>Customers</span>
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
          {activeModule === 'products'  && <ManageProducts />}
          {activeModule === 'orders'    && <ManageOrders />}
          {activeModule === 'customers' && <Customers />}
          {activeModule === 'profile'   && <MyProfile />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

