import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaClipboardList, FaUsers, FaUser } from 'react-icons/fa';
import Navbar from '../components/Navbar/Navbar';
import ManageProducts from '../components/AdminModules/ManageProducts';
import ManageOrders from '../components/AdminModules/ManageOrders';
import Customers from '../components/AdminModules/Customers';
import MyProfile from '../components/MyProfile/MyProfile';
import './Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(() => localStorage.getItem('adminActiveModule') || 'products');

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
      <Navbar title="Welcome!" />

      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-menu">
            <div
              className={`sidebar-item ${activeModule === 'products' ? 'active' : ''}`}
              onClick={() => { localStorage.setItem('adminActiveModule', 'products'); setActiveModule('products'); }}
            >
              <span className="sidebar-icon"><FaBoxOpen /></span>
              <span>Manage Products</span>
            </div>
            <div
              className={`sidebar-item ${activeModule === 'orders' ? 'active' : ''}`}
              onClick={() => { localStorage.setItem('adminActiveModule', 'orders'); setActiveModule('orders'); }}
            >
              <span className="sidebar-icon"><FaClipboardList /></span>
              <span>Manage Orders</span>
            </div>
            <div
              className={`sidebar-item ${activeModule === 'customers' ? 'active' : ''}`}
              onClick={() => { localStorage.setItem('adminActiveModule', 'customers'); setActiveModule('customers'); }}
            >
              <span className="sidebar-icon"><FaUsers /></span>
              <span>Customers</span>
            </div>
            <div
              className={`sidebar-item ${activeModule === 'profile' ? 'active' : ''}`}
              onClick={() => { localStorage.setItem('adminActiveModule', 'profile'); setActiveModule('profile'); }}
            >
              <span className="sidebar-icon"><FaUser /></span>
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

